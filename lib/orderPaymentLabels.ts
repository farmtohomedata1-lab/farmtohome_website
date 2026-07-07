// Single source for displaying a raw Order.paymentMethod value — shared by
// the admin order list/detail, the customer-facing order summary, and order
// emails, so they can never drift out of sync with each other again (they
// used to be four separately hand-copied maps).
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PAYNOW_MANUAL: "PayNow",
  STRIPE: "Card",
  // COD was retired as a selectable/creatable payment method — kept here
  // only so pre-existing historical orders still render a real label
  // instead of falling back to the raw string "COD".
  COD: "Cash on Delivery",
};
