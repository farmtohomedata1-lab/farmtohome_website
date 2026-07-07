import { prisma } from "@/lib/prisma";
import { formatDateTimeSGT } from "@/lib/format";

// Read-only — this page never writes anything, so there's nothing here that
// itself needs auditing. Capped at the most recent 200 entries rather than
// paginated: a small single-owner shop won't generate enough admin actions
// for that to matter in practice, and the full history always remains
// queryable directly in the database if ever needed.
const MAX_ENTRIES = 200;

function formatAction(action: string): string {
  return action.replace(/[._]/g, " ");
}

function formatMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "—";
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

export default async function AdminActivityLogPage() {
  const entries = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ENTRIES,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
      <p className="mt-1 text-sm text-gray-500">
        Who did what, and when — order status changes, catalog edits, coupon and settings
        changes. Showing the most recent {entries.length} entr{entries.length === 1 ? "y" : "ies"}.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDateTimeSGT(entry.createdAt)}
                </td>
                <td className="px-4 py-3 text-gray-700">{entry.adminEmail}</td>
                <td className="px-4 py-3 font-medium capitalize text-dark-green">
                  {formatAction(entry.action)}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {entry.targetType ? (
                    <>
                      {entry.targetType}
                      {entry.targetId && (
                        <span className="text-gray-400"> #{entry.targetId.slice(-8)}</span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatMetadata(entry.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
