"use client";

import { motion } from "framer-motion";
import { footer } from "@/content/homepage";
import { buttonMotion, fadeIn, viewportOnce } from "./motion";
import { IconClock, IconPin, IconSend, IconWhatsApp, socialIcons } from "./icons";
import Logo from "./Logo";

export default function FooterClient({
  hours,
  whatsappNumber,
}: {
  hours: string;
  whatsappNumber: string;
}) {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeIn}
      className="bg-footer text-white"
    >
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.3fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-6 text-gray-400">
            {footer.tagline}
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-5 flex max-w-xs items-stretch overflow-hidden rounded-md bg-white p-1"
          >
            <input
              type="email"
              placeholder={footer.emailPlaceholder}
              aria-label={footer.emailPlaceholder}
              className="min-w-0 flex-1 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            <motion.button
              {...buttonMotion}
              type="submit"
              aria-label="Subscribe"
              className="rounded-md bg-brand-green p-2.5 text-white"
            >
              <IconSend className="h-4 w-4" />
            </motion.button>
          </form>
          <ul className="mt-6 flex items-center gap-3">
            {footer.socials.map((social) => {
              const Icon = socialIcons[social.id];
              return (
                <li key={social.id}>
                  <a
                    href={social.href}
                    aria-label={social.id}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-brand-green hover:text-brand-green"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {footer.columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-base font-bold">{column.title}</h3>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-base font-bold">{footer.help.title}</h3>
          <ul className="mt-5 space-y-5 text-sm">
            <li className="flex items-start gap-3">
              <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <span className="text-gray-400">{footer.help.address}</span>
            </li>
            <li className="flex items-start gap-3">
              <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <span className="block text-gray-400">{hours}</span>
            </li>
            <li className="flex items-start gap-3">
              <IconWhatsApp className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <span>
                <span className="block font-semibold">WhatsApp Us</span>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-base font-bold text-brand-green hover:underline"
                >
                  {whatsappNumber}
                </a>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-center px-4 py-5 sm:px-6">
          <p className="text-xs text-gray-400">{footer.copyright}</p>
        </div>
      </div>
    </motion.footer>
  );
}
