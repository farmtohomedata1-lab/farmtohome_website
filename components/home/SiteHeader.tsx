import { getCustomerHeaderInfo } from "@/lib/auth/getCustomerHeaderInfo";
import SiteHeaderClient from "./SiteHeaderClient";

// Resolves the customer's auth state server-side, before the header ever
// reaches the browser — this is what the logged-in/logged-out state on
// first paint always matches reality, with no client-side flash while a
// fetch-after-mount would otherwise be in flight.
export default async function SiteHeader() {
  const customerInfo = await getCustomerHeaderInfo();
  return <SiteHeaderClient initialCustomerInfo={customerInfo} />;
}
