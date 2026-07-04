import { prisma } from "@/lib/prisma";
import CouponsClient from "./CouponsClient";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
      <p className="mt-1 text-sm text-gray-500">
        Run seasonal offers — set a start/end date and a coupon automatically stops
        working after it ends, with zero manual cleanup.
      </p>

      <CouponsClient
        initialCoupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
          discountValue: c.discountValue.toNumber(),
          active: c.active,
          startDate: toDateInputValue(c.startDate),
          endDate: toDateInputValue(c.endDate),
        }))}
      />
    </div>
  );
}
