"use server";

import { getAuthedCustomer } from "./customerSession";

export interface CustomerHeaderInfo {
  name: string | null;
  email: string;
}

// Callable directly from the client (components/home/SiteHeader.tsx) to
// decide the header's Login/account button — deliberately returns only the
// two fields the header needs, not the full Customer row.
export async function getCustomerHeaderInfo(): Promise<CustomerHeaderInfo | null> {
  const customer = await getAuthedCustomer();
  if (!customer) return null;
  return { name: customer.name, email: customer.email };
}
