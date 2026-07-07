import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

interface LogAdminActionParams {
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

// Called from every sensitive admin Server Action, right after its write
// succeeds. Best-effort by design (try/catch, never rethrows) — this is a
// forensic trail for the Activity Log, not a transactional guarantee, so a
// logging hiccup must never turn into a failed order update or product edit.
export async function logAdminAction(
  adminEmail: string,
  params: LogAdminActionParams
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("[audit] logAdminAction failed:", err);
  }
}
