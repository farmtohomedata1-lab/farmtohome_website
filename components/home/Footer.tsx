import { footer } from "@/content/homepage";
import { getSectionContent } from "@/lib/cms/getSectionContent";
import FooterClient from "./FooterClient";

export interface FooterContactContent {
  hours: string;
  whatsappNumber: string;
}

// Server wrapper (mirrors SiteHeader/SiteHeaderClient) so FooterClient can
// stay a "use client" component (framer-motion) while hours/WhatsApp number
// are still fetched from the CMS. Falls back to the static content/homepage.ts
// defaults if the "footer_contact" section hasn't been seeded yet, so the
// footer never breaks while a fresh environment is waiting on `pnpm db:seed`.
export default async function Footer() {
  const footerContact = await getSectionContent<FooterContactContent>("home", "footer_contact");

  return (
    <FooterClient
      hours={footerContact?.content.hours ?? footer.help.hours}
      whatsappNumber={footerContact?.content.whatsappNumber ?? footer.help.whatsappNumber}
    />
  );
}
