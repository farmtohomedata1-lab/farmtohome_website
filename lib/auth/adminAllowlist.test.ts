import { test } from "node:test";
import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail, resolveAdminUser } from "./adminAllowlist";

// ─────────────────────────────────────────────────────────────────────────
// Regression guard for the customer → admin privilege-escalation fix.
//
// This test runs on every build (see package.json's "build" script, which is
// what Vercel runs). Its whole reason to exist: if a future refactor drops
// the admin allowlist check from resolveAdminUser, THIS TEST FAILS and the
// deploy is blocked — the hole cannot silently come back. See the
// SECURITY-CRITICAL banner in adminAllowlist.ts for the history.
//
// Hermetic: it sets process.env.ADMIN_EMAILS itself for each case (isAdminEmail
// reads the env per-call), so it needs no external configuration or network.
// ─────────────────────────────────────────────────────────────────────────

function fakeUser(email: string | undefined): User {
  return { id: "test-user-id", email } as User;
}

const ok = { error: null };

test("isAdminEmail: fails CLOSED when ADMIN_EMAILS is unset", () => {
  delete process.env.ADMIN_EMAILS;
  assert.equal(isAdminEmail("owner@farmtohome.sg"), false);
});

test("isAdminEmail: fails CLOSED when ADMIN_EMAILS is empty", () => {
  process.env.ADMIN_EMAILS = "";
  assert.equal(isAdminEmail("owner@farmtohome.sg"), false);
});

test("isAdminEmail: accepts an allowlisted email, rejects others", () => {
  process.env.ADMIN_EMAILS = "owner@farmtohome.sg";
  assert.equal(isAdminEmail("owner@farmtohome.sg"), true);
  assert.equal(isAdminEmail("customer@example.com"), false);
});

test("isAdminEmail: is case- and whitespace-insensitive", () => {
  process.env.ADMIN_EMAILS = "  Owner@FarmToHome.SG  ";
  assert.equal(isAdminEmail("owner@farmtohome.sg"), true);
  assert.equal(isAdminEmail("OWNER@FARMTOHOME.SG"), true);
});

test("isAdminEmail: tolerates a value pasted WITH quotes (Vercel dashboard trap)", () => {
  // A .env strips quotes; the Vercel dashboard does not. Both must work so a
  // quoted value can never silently lock the admin out.
  process.env.ADMIN_EMAILS = "'farmtohomedata1@gmail.com'";
  assert.equal(isAdminEmail("farmtohomedata1@gmail.com"), true);
  process.env.ADMIN_EMAILS = '"farmtohomedata1@gmail.com"';
  assert.equal(isAdminEmail("farmtohomedata1@gmail.com"), true);
});

test("isAdminEmail: supports multiple comma-separated admins", () => {
  process.env.ADMIN_EMAILS = "a@shop.sg, b@shop.sg";
  assert.equal(isAdminEmail("a@shop.sg"), true);
  assert.equal(isAdminEmail("b@shop.sg"), true);
  assert.equal(isAdminEmail("c@shop.sg"), false);
});

test("isAdminEmail: rejects null/undefined/empty email", () => {
  process.env.ADMIN_EMAILS = "owner@farmtohome.sg";
  assert.equal(isAdminEmail(null), false);
  assert.equal(isAdminEmail(undefined), false);
  assert.equal(isAdminEmail(""), false);
});

// The core assertion the whole fix rests on:
test("resolveAdminUser: REJECTS a valid-but-non-allowlisted session", () => {
  process.env.ADMIN_EMAILS = "owner@farmtohome.sg";
  const result = resolveAdminUser({ data: { user: fakeUser("customer@example.com") }, ...ok });
  assert.equal(result, null, "a real customer's valid session must NOT be treated as admin");
});

test("resolveAdminUser: ACCEPTS a valid allowlisted session", () => {
  process.env.ADMIN_EMAILS = "owner@farmtohome.sg";
  const user = fakeUser("owner@farmtohome.sg");
  const result = resolveAdminUser({ data: { user }, ...ok });
  assert.equal(result, user, "the real admin must still get in");
});

test("resolveAdminUser: rejects when there is no user", () => {
  process.env.ADMIN_EMAILS = "owner@farmtohome.sg";
  assert.equal(resolveAdminUser({ data: { user: null }, ...ok }), null);
});

test("resolveAdminUser: rejects when getUser returned an error", () => {
  process.env.ADMIN_EMAILS = "owner@farmtohome.sg";
  const result = resolveAdminUser({
    data: { user: fakeUser("owner@farmtohome.sg") },
    error: new Error("token expired"),
  });
  assert.equal(result, null, "an errored getUser() must never resolve to an admin");
});

test("resolveAdminUser: fail-closed even for a session when ADMIN_EMAILS unset", () => {
  delete process.env.ADMIN_EMAILS;
  const result = resolveAdminUser({ data: { user: fakeUser("owner@farmtohome.sg") }, ...ok });
  assert.equal(result, null, "no allowlist configured => nobody is admin");
});
