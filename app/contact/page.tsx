import type { Metadata } from "next";
import TopBar from "@/components/home/TopBar";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PageHero from "@/components/common/PageHero";
import ContactForm from "@/components/contact/ContactForm";
import { footer } from "@/content/homepage";
import { IconPhone, IconPin } from "@/components/home/icons";

export const metadata: Metadata = {
  title: "Contact Us | Farm To Home",
  description: "Get in touch with Farm To Home — questions, feedback, or order help.",
};

export default function ContactPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero heading="Contact Us" breadcrumbLabel="Contact" />

        <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 lg:flex lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1">
            <ContactForm />
          </div>

          <aside className="mt-8 w-full shrink-0 rounded-lg border border-gray-200 bg-white p-6 lg:mt-0 lg:w-80">
            <h2 className="text-base font-bold text-dark-green">{footer.help.title}</h2>
            <ul className="mt-5 space-y-5 text-sm">
              <li className="flex items-start gap-3">
                <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <span className="text-gray-500">{footer.help.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <span>
                  <span className="block text-gray-500">{footer.help.hours}</span>
                  <a
                    href={`tel:${footer.help.phone.replace(/\s/g, "")}`}
                    className="mt-1 block text-base font-bold text-brand-green"
                  >
                    {footer.help.phone}
                  </a>
                </span>
              </li>
            </ul>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
