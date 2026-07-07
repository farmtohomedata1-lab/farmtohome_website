import type { MapContent } from "@/content/homepage";
import SectionHeading from "./SectionHeading";

// Plain `output=embed` Google Maps URL — no API key required, matches the
// exact address maintained in content/homepage.ts (STORE_ADDRESS) so this
// can never drift from the footer's address.
export default function MapSection({ content }: { content: MapContent }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(content.address)}&output=embed`;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6">
      {content.heading && <SectionHeading title={content.heading} />}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <iframe
          src={src}
          className="h-64 w-full sm:h-80 lg:h-[420px]"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map showing our location at ${content.address}`}
        />
      </div>
    </section>
  );
}
