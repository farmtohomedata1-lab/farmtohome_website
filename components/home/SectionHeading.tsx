export default function SectionHeading({
  title,
  withDot = false,
}: {
  title: string;
  withDot?: boolean;
}) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-bold text-dark-green sm:text-2xl">
      {withDot && (
        <span aria-hidden="true" className="h-3 w-3 rounded-full bg-gold" />
      )}
      {title}
    </h2>
  );
}
