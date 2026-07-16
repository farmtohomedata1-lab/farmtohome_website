import Link from "next/link";

export default function PageHero({
  heading,
  breadcrumbLabel,
}: {
  heading: string;
  breadcrumbLabel: string;
}) {
  return (
    <section className="border-b border-gray-200 bg-gray-section">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-2 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-dark-green sm:text-3xl">{heading}</h1>
        <p className="text-sm text-gray-500">
          <Link href="/" className="text-gray-400 hover:text-brand-green">
            Homes
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-medium text-brand-green">{breadcrumbLabel}</span>
        </p>
      </div>
    </section>
  );
}
