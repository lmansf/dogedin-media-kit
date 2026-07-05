"use client";

import { useState } from "react";

export type StackSegment = { label: string; value: number; color: string };

// A single 100% horizontal stacked bar for a status mix. Segments separate by
// a 2px surface gap (never a stroke); the two extreme ends get the 4px
// rounding, interior segments stay square. A percentage renders inside a
// segment only when it's wide enough to fit; the legend + hover tooltip carry
// the rest, and identity is never color-alone (legend is always present).
export default function StackBar({ segments }: { segments: StackSegment[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((a, s) => a + s.value, 0);

  if (total === 0) {
    return <p className="text-sm font-bold text-black/40">No data yet.</p>;
  }

  // Center of each segment as a % of the bar, for anchoring the tooltip at
  // the container level (an in-segment tooltip overflows the viewport when a
  // narrow segment sits near an edge on a 360px screen).
  const centers: number[] = [];
  let acc = 0;
  for (const s of shown) {
    const p = (100 * s.value) / total;
    centers.push(acc + p / 2);
    acc += p;
  }

  return (
    <div>
      <div className="relative flex h-6 w-full gap-[2px]">
        {shown.map((s, i) => {
          const p = (100 * s.value) / total;
          return (
            <div
              key={s.label}
              className={`relative flex items-center justify-center transition-opacity ${
                i === 0 ? "rounded-l-[4px]" : ""
              } ${i === shown.length - 1 ? "rounded-r-[4px]" : ""}`}
              style={{
                width: `${p}%`,
                background: s.color,
                opacity: hover === null || hover === i ? 1 : 0.55,
              }}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              {p >= 12 && (
                <span className="text-[10px] font-black text-white">
                  {Math.round(p)}%
                </span>
              )}
            </div>
          );
        })}
        {hover !== null && (
          <span
            className="pointer-events-none absolute bottom-full z-10 mb-1 border-2 border-black bg-white px-2 py-0.5 text-xs font-bold shadow-hard"
            style={
              centers[hover] > 50
                ? { right: `${100 - centers[hover]}%` }
                : { left: `${centers[hover]}%` }
            }
          >
            <strong className="font-black tabular-nums">
              {shown[hover].value.toLocaleString("en-US")}
            </strong>{" "}
            <span className="text-black/60">{shown[hover].label}</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs font-bold text-black/70">
            <span
              className="inline-block h-2.5 w-2.5 rounded-[2px]"
              style={{ background: s.color }}
            />
            {s.label}
            <span className="font-black tabular-nums">
              {s.value.toLocaleString("en-US")}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
