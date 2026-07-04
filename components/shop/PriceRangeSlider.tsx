"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

export default function PriceRangeSlider({
  min,
  max,
  value,
  onCommit,
}: {
  min: number;
  max: number;
  value: [number, number];
  onCommit: (value: [number, number]) => void;
}) {
  const [local, setLocal] = useState<[number, number]>(value);
  // Reset the local drag position whenever the committed value changes from
  // outside (URL navigation, Reset Filters, browser back) — adjusted during
  // render rather than in an effect, per React's "adjusting state when a
  // prop changes" pattern, so it takes effect in the same commit.
  const [prevValue, setPrevValue] = useState(value);
  if (value[0] !== prevValue[0] || value[1] !== prevValue[1]) {
    setPrevValue(value);
    setLocal(value);
  }

  if (max <= min) return null;

  const [lo, hi] = local;
  const lowPercent = ((lo - min) / (max - min)) * 100;
  const highPercent = ((hi - min) / (max - min)) * 100;

  function commit(next: [number, number]) {
    setLocal(next);
    onCommit(next);
  }

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-gray-200">
        <div
          className="absolute h-1.5 rounded-full bg-brand-green"
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => setLocal([Math.min(Number(e.target.value), hi), hi])}
          onMouseUp={(e) => commit([Math.min(Number(e.currentTarget.value), hi), hi])}
          onTouchEnd={(e) => commit([Math.min(Number(e.currentTarget.value), hi), hi])}
          onKeyUp={(e) => commit([Math.min(Number(e.currentTarget.value), hi), hi])}
          onBlur={(e) => commit([Math.min(Number(e.currentTarget.value), hi), hi])}
          className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => setLocal([lo, Math.max(Number(e.target.value), lo)])}
          onMouseUp={(e) => commit([lo, Math.max(Number(e.currentTarget.value), lo)])}
          onTouchEnd={(e) => commit([lo, Math.max(Number(e.currentTarget.value), lo)])}
          onKeyUp={(e) => commit([lo, Math.max(Number(e.currentTarget.value), lo)])}
          onBlur={(e) => commit([lo, Math.max(Number(e.currentTarget.value), lo)])}
          className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-medium text-gray-600">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}</span>
      </div>
    </div>
  );
}
