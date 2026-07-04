export default function NumberInput({
  label,
  value,
  onChange,
  allowNull,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  allowNull?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" && allowNull) {
            onChange(null);
            return;
          }
          onChange(Number(raw));
        }}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
      />
    </div>
  );
}
