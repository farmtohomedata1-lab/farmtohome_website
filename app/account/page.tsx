import type { Metadata } from "next";
import TopBar from "@/components/home/TopBar";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PageHero from "@/components/common/PageHero";
import ProfileSection from "@/components/account/ProfileSection";
import AddressesSection from "@/components/account/AddressesSection";
import OrderHistorySection from "@/components/account/OrderHistorySection";
import { requireAuthedCustomer } from "@/lib/auth/customerSession";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Account | Farm To Home",
};

export default async function AccountPage() {
  const customer = await requireAuthedCustomer("/account");

  const [addresses, orders] = await Promise.all([
    prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    }),
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  return (
    <>
      <TopBar />
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero heading="My Account" breadcrumbLabel="Account" />

        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-8 sm:px-6">
          <ProfileSection email={customer.email} name={customer.name ?? ""} />

          <AddressesSection
            initialAddresses={addresses.map((a) => ({
              id: a.id,
              label: a.label ?? "",
              fullName: a.fullName,
              phone: a.phone,
              blockStreet: a.blockStreet,
              unitNumber: a.unitNumber ?? "",
              postalCode: a.postalCode,
              landmark: a.landmark ?? "",
              isDefault: a.isDefault,
            }))}
          />

          <OrderHistorySection
            orders={orders.map((o) => ({
              id: o.id,
              createdAt: o.createdAt.toISOString(),
              total: o.total.toNumber(),
              paymentMethod: o.paymentMethod,
              paymentStatus: o.paymentStatus,
              itemCount: o._count.items,
            }))}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
