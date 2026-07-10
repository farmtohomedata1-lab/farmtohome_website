import { test } from "node:test";
import assert from "node:assert/strict";
import { processImage } from "./processImage";

// A real, valid, tiny 4x4 PNG (not a mock/stub) — generated via sharp's own
// `create` API (`sharp({ create: {...} }).png().toBuffer()`) — used to prove
// the SUCCESS path still genuinely compresses via the real sharp package,
// not just that the fallback path works.
const TINY_VALID_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0,
  0, 0, 4, 8, 2, 0, 0, 0, 38, 147, 9, 41, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0,
  3, 232, 0, 0, 3, 232, 1, 181, 123, 82, 107, 0, 0, 0, 16, 73, 68, 65, 84, 8,
  153, 99, 56, 33, 39, 7, 71, 12, 196, 113, 0, 177, 99, 16, 65, 215, 170, 110,
  16, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

// ─────────────────────────────────────────────────────────────────────────
// Regression guard for a confirmed, live production incident: sharp's
// native binary failed to load on Vercel's linux-x64 runtime
// (ERR_DLOPEN_FAILED: libvips-cpp.so), and because sharp was previously
// imported STATICALLY at module scope, that failure was uncatchable and
// crashed the entire admin action. These tests PROVE — with a real forced
// failure, not just an inspection of the code — that processImage() always
// returns successfully (falls back to the original bytes) regardless of how
// or why sharp fails, so this exact incident can never recur.
// ─────────────────────────────────────────────────────────────────────────

test("processImage: falls back to the original image when the sharp import itself rejects (simulates the real ERR_DLOPEN_FAILED incident)", async () => {
  const originalBuffer = new Uint8Array([1, 2, 3, 4, 5]);
  const failingLoader = () =>
    Promise.reject(
      new Error(
        "Failed to load external module sharp-XXXX: Could not load the 'sharp' module using the linux-x64 runtime. ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file"
      )
    );

  const result = await processImage(
    originalBuffer,
    "image/png",
    "png",
    false,
    failingLoader as unknown as () => Promise<typeof import("sharp")>
  );

  assert.deepEqual(Array.from(result.buffer), Array.from(originalBuffer), "must return the ORIGINAL bytes unchanged, not throw");
  assert.equal(result.contentType, "image/png", "must keep the original content type when compression is skipped");
  assert.equal(result.extension, "png", "must keep the original extension when compression is skipped");
});

test("processImage: falls back when sharp loads successfully but processing itself throws", async () => {
  const originalBuffer = new Uint8Array([9, 8, 7]);
  const loaderWithBrokenSharp = () =>
    Promise.resolve({
      default: () => {
        throw new Error("simulated: corrupt/unsupported image data mid-processing");
      },
    }) as unknown as Promise<typeof import("sharp")>;

  const result = await processImage(originalBuffer, "image/jpeg", "jpg", false, loaderWithBrokenSharp);

  assert.deepEqual(Array.from(result.buffer), Array.from(originalBuffer));
  assert.equal(result.contentType, "image/jpeg");
  assert.equal(result.extension, "jpg");
});

test("processImage: falls back when the resize/webp pipeline rejects asynchronously", async () => {
  const originalBuffer = new Uint8Array([42, 42, 42]);
  const loaderWithAsyncFailure = () =>
    Promise.resolve({
      default: () => ({
        resize: () => ({
          webp: () => ({
            toBuffer: () => Promise.reject(new Error("simulated async pipeline failure")),
          }),
        }),
      }),
    }) as unknown as Promise<typeof import("sharp")>;

  const result = await processImage(originalBuffer, "image/gif", "gif", true, loaderWithAsyncFailure);

  assert.deepEqual(Array.from(result.buffer), Array.from(originalBuffer));
  assert.equal(result.contentType, "image/gif");
  assert.equal(result.extension, "gif");
});

test("processImage: uses the REAL sharp package to genuinely compress when it succeeds (proves the success path still works)", async () => {
  const result = await processImage(TINY_VALID_PNG, "image/png", "png", false);

  assert.equal(result.contentType, "image/webp", "a successful compression must report webp");
  assert.equal(result.extension, "webp");
  assert.ok(result.buffer.length > 0, "must produce real output bytes");
  // Confirm it's genuinely different processed output, not just the
  // original bytes silently passed through under a different label.
  assert.notDeepEqual(Array.from(result.buffer), Array.from(TINY_VALID_PNG));
});
