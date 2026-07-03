import "server-only";
import { prisma } from "@/lib/prisma";

// DB-backed (not in-memory) because Vercel serverless functions don't share
// process memory across invocations — an in-memory counter would silently
// reset on every cold start and never actually lock anyone out.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export type LoginGate =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

// Fails open (allowed: true) on a DB error — Supabase Auth's own password
// check is still the real gate; a transient DB hiccup here should degrade
// the extra brute-force protection, not lock the admin out entirely.
export async function checkLoginAllowed(email: string): Promise<LoginGate> {
  try {
    const record = await prisma.loginAttempt.findUnique({ where: { email } });
    if (!record?.lockedUntil) return { allowed: true };

    if (record.lockedUntil > new Date()) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000),
      };
    }

    // Lockout window has passed — give the account a clean slate.
    await prisma.loginAttempt.delete({ where: { email } }).catch(() => {});
    return { allowed: true };
  } catch (err) {
    console.error(`[auth] checkLoginAllowed(${email}) failed:`, err);
    return { allowed: true };
  }
}

export async function recordFailedLogin(email: string): Promise<void> {
  try {
    const existing = await prisma.loginAttempt.findUnique({ where: { email } });
    const failedCount = (existing?.failedCount ?? 0) + 1;
    const lockedUntil =
      failedCount >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
        : null;

    await prisma.loginAttempt.upsert({
      where: { email },
      create: { email, failedCount, lockedUntil },
      update: { failedCount, lockedUntil },
    });
  } catch (err) {
    console.error(`[auth] recordFailedLogin(${email}) failed:`, err);
  }
}

export async function clearLoginAttempts(email: string): Promise<void> {
  try {
    await prisma.loginAttempt.delete({ where: { email } });
  } catch {
    // No record to clear (or a transient DB error) — either way, nothing
    // to do here.
  }
}
