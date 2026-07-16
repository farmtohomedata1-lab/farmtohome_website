import Image from "next/image";
import Link from "next/link";

// Official logo as of the 2026-07-16 rebrand (farm_to_home_new_logo_w.png) —
// a near-square mark (4554x4581px source), unlike the old wide (~1.8:1)
// lockup this replaced. width/height below are set to match its real
// aspect ratio so next/image doesn't stretch it; height is fixed
// responsively via the className and width scales automatically.
export default function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
      <Image
        src="/farm_to_home_new_logo_w.png"
        alt="Farm To Home Groceries"
        width={455}
        height={458}
        priority={priority}
        // Confirmed live: Vercel's Image Optimization quota is currently
        // exhausted (every new/uncached transform request -- not just this
        // file -- returns 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
        // The raw static file serves fine (confirmed 200 directly); only
        // the on-demand resize/format step is blocked. `unoptimized` skips
        // that step and serves the source file as-is, so the logo (on
        // every single page load, header + footer) can't go broken over
        // this regardless of the site-wide quota's state. This is a
        // targeted exception, not a general fix -- see the flagged
        // sitewide product-image risk this same root cause creates.
        unoptimized
        className="h-10 w-auto sm:h-12 lg:h-14"
      />
    </Link>
  );
}
