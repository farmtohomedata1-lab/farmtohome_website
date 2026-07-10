import "server-only";
import { revalidatePath as nextRevalidatePath } from "next/cache";

// Wraps Next.js's revalidatePath so a caching/revalidation hiccup can never
// mask an already-successful database write as a total failure to the admin.
//
// Confirmed real incident: an admin's "Add Product" submission genuinely
// created the product (the row and its AdminAuditLog entry were both
// written), but the admin saw a generic "Something went wrong" crash anyway
// — because the unguarded revalidatePath() call that runs right after the
// write threw, and with no error.tsx anywhere in this app, that uncaught
// throw propagated all the way to the root global-error boundary, making a
// fully successful write look like a total failure. This is exactly the
// same reasoning lib/audit/log.ts's logAdminAction already applies to
// itself ("a logging hiccup must never turn into a failed order update or
// product edit") — revalidation deserves the identical treatment, and
// previously didn't have it.
//
// Every admin Server Action that revalidates a path after a write should
// import revalidatePath from HERE, not directly from "next/cache".
export function revalidatePath(path: string): void {
  try {
    nextRevalidatePath(path);
  } catch (err) {
    console.error(`[cache] revalidatePath(${path}) failed:`, err);
  }
}
