import Link from "next/link";
import { IconLeaf } from "./icons";

export default function Logo({
  prefix,
  suffix,
}: {
  prefix: string;
  suffix: string;
}) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
        <IconLeaf className="h-5 w-5 text-brand-green" />
      </span>
      <span className="text-xl font-extrabold tracking-wide text-white">
        {prefix}
        <span className="font-medium">{suffix}</span>
      </span>
    </Link>
  );
}
