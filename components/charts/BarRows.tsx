"use client";

import { useState } from "react";

export type BarRow = { label: string; value: number; hint?: string };

// Horizontal ranked bars. One series, so one hue (no legend needed — the card
// title names the measure). Marks: 16px thick, 4px rounded at the data end,
// square at the baseline; every value sits at the bar tip in ink (bars are the
// one form where a value per mark IS the spec). Hovering a row lifts it and
// shows a tooltip; a table view keeps everything reachable without hover.
export default function BarRows({
  rows,
  color = "var(--series-3)",
  unit = "",
  maxRows = 10,
}: {
  rows: BarRow[];
  color?: string;
  unit?: string;
  maxRows?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = rows.slice(0, maxRows);
  const max = Math.max(1, ...shown.map((r) => r.value));

  if (shown.length === 0) {
    return <p className="text-sm font-bold text-black/40">No data yet.</p>;
  }

  return (
    <div>
      <ul className="flex flex-col gap-[6px]">
        {shown.map((r, i) => (
          <li
            key={r.label}
            className={`relative flex items-center gap-2 rounded px-1 py-0.5 transition-colors ${
              hover === i ? "bg-black/5" : ""
            }`}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            <span
              className="w-32 shrink-0 truncate text-xs font-bold text-black/70 sm:w-40"
              title={r.label}
            >
              {r.label}
            </span>
            <span className="relative h-4 flex-1">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{
                  width: `${Math.max(1.5, (100 * r.value) / max)}%`,
                  background: color,
                  opacity: hover === null || hover === i ? 1 : 0.55,
                }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-xs font-black tabular-nums">
              {r.value.toLocaleString("en-US")}
              {unit}
            </span>
            {hover === i && r.hint && (
              <span className="pointer-events-none absolute -top-7 left-32 z-10 whitespace-nowrap border-2 border-black bg-white px-2 py-0.5 text-xs font-bold shadow-hard sm:left-40">
                <strong className="font-black">
                  {r.value.toLocaleString("en-US")}
                  {unit}
                </strong>{" "}
                <span className="text-black/60">{r.hint}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold text-black/40">
          View as table
        </summary>
        <table className="mt-2 w-full text-left text-xs">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-[var(--grid)]">
                <td className="py-1 pr-2 font-bold text-black/70">{r.label}</td>
                <td className="py-1 text-right font-black tabular-nums">
                  {r.value.toLocaleString("en-US")}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
