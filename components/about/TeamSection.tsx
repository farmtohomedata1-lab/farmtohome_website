"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TeamSectionContent } from "@/content/about";
import { cardLift, fadeUp, stagger, viewportOnce } from "@/components/home/motion";
import { IconWhatsApp } from "@/components/home/icons";

type TeamContent = Omit<TeamSectionContent, "show">;

// whatsappNumber is sourced from the shared "footer_contact" CMS section
// (same field the footer/contact page use) — never a separate hardcoded
// copy, so there is exactly one contact number anywhere on the site.
export default function TeamSection({
  content,
  whatsappNumber,
}: {
  content: TeamContent;
  whatsappNumber: string;
}) {
  if (content.members.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        {content.heading && (
          <h2 className="text-2xl font-bold text-dark-green sm:text-3xl">
            {content.heading}
          </h2>
        )}
        {content.subtext && (
          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            {content.subtext}
          </p>
        )}
      </div>

      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4"
      >
        {content.members.map((member) => (
          <motion.li
            key={member.id}
            variants={fadeUp}
            whileHover={cardLift}
            className="flex flex-col items-center text-center"
          >
            {member.photo && (
              <Image
                src={member.photo}
                alt={member.imageAlt || ""}
                width={400}
                height={400}
                className="h-40 w-40 rounded-lg object-cover sm:h-48 sm:w-48"
              />
            )}
            {member.name && (
              <h3 className="mt-4 text-base font-bold text-dark-green">{member.name}</h3>
            )}
            {member.role && <p className="mt-1 text-sm text-gray-500">{member.role}</p>}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-green hover:underline"
              >
                <IconWhatsApp className="h-4 w-4" />
                {whatsappNumber}
              </a>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
