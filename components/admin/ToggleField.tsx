export default function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
      {/*
        Knob positioning is flex + padding based, never absolute + a
        magic-number translate: the track pads itself by p-0.5 on every side
        and vertically centers the knob (items-center), so the knob sits a
        uniform 2px from the left when off. `translate-x-full` then slides it
        right by exactly its own width — which, with this track/knob sizing,
        lands it a matching 2px from the right when on. That symmetry is what
        was previously broken (the old translate-x-4 stopped 2px short of the
        right edge, so the knob looked off-centre in the ON state).
      */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-brand-green" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-full" : "translate-x-0"
          }`}
        />
      </button>
      {label}
    </label>
  );
}
