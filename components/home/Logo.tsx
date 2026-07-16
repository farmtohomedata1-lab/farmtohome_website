import Image from "next/image";
import Link from "next/link";

// Official logo as of the 2026-07-16 rebrand (Farm_to_home_new_logo.png) —
// a near-square mark (4554x4581px source), unlike the old wide (~1.8:1)
// lockup this replaced. width/height below are set to match its real
// aspect ratio so next/image doesn't stretch it; height is fixed
// responsively via the className and width scales automatically.
export default function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
      <Image
        src="/Farm_to_home_new_logo.png"
        alt="Farm To Home Groceries"
        width={455}
        height={458}
        priority={priority}
        className="h-10 w-auto sm:h-12 lg:h-14"
      />
    </Link>
  );
}
