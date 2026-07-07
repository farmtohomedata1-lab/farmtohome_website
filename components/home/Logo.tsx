import Image from "next/image";
import Link from "next/link";

// The source file is a wide (~1.8:1) full-color lockup, not a square mark —
// height is fixed responsively and width is left to scale automatically so
// it's never stretched/squished.
export default function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center">
      <Image
        src="/home_logo.png"
        alt="Farm To Home Groceries"
        width={362}
        height={200}
        priority={priority}
        className="h-10 w-auto sm:h-12 lg:h-14"
      />
    </Link>
  );
}
