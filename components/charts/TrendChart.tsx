"use client";

import { useMemo, useRef, useState } from "react";

export type TrendSeries = {
  name: string;
  color: string; // a --series-* custom property value, e.g. "var(--series-1)"
  values: number[];
};

// Line chart over evenly spaced time buckets. Spec: 2px round-joined lines, a
// ~10% area wash, ≥8px end markers with a 2px surface ring, hairline solid
// gridlines, clean y ticks, and — because an HTML chart is interactive by
// default — a crosshair that snaps to the nearest bucket with ONE tooltip
// listing every series at that x. Legend renders for ≥2 series; a single
// series is named by the card title. A table view keeps values reachable
// without hover.
export default function TrendChart({
  labels,
  series,
  height = 180,
  yFormat = (n: number) => n.toLocaleString("en-US"),
}: {
  labels: string[];
  series: TrendSeries[];
  height?: number;
  yFormat?: (n: number) => string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 640;
  const H = height;
  const PAD = { top: 12, right: 14, bottom: 22, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = labels.length;

  const { maxY, ticks } = useMemo(() => {
    const rawMax = Math.max(1, ...series.flatMap((s) => s.values));
    // Round the top tick up to a clean number: 1/2/5 × 10^k.
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const norm = rawMax / mag;
    const top = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    // Counts don't get fractional midlines — drop the mid tick when it
    // wouldn't land on a whole number.
    const mid = top / 2;
    return { maxY: top, ticks: Number.isInteger(mid) ? [0, mid, top] : [0, top] };
  }, [series]);

  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => PAD.top + innerH - (v / maxY) * innerH;

  const paths = series.map((s) => {
    const line = s.values
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");
    const area =
      `${line} L${x(s.values.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)}` +
      ` L${x(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;
    return { line, area };
  });

  const onMove = (e: React.PointerEvent) => {
    const el = wrapRef.current;
    if (!el || n === 0) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, i)));
  };

  if (n === 0) {
    return <p className="text-sm font-bold text-black/40">No data yet.</p>;
  }

  // Tooltip anchored to the hovered bucket, flipped on the right half.
  const tipLeftPct = hoverIdx === null ? 0 : (x(hoverIdx) / W) * 100;
  const tipFlip = hoverIdx !== null && hoverIdx > n / 2;

  return (
    <div>
      {series.length >= 2 && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs font-bold text-black/70">
              <span className="inline-block h-[2px] w-4 rounded" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div
        ref={wrapRef}
        className="relative"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img">
          {/* hairline gridlines + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--grid)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 3}
                textAnchor="end"
                fontSize="10"
                fontWeight="700"
                fill="var(--muted)"
              >
                {yFormat(t)}
              </text>
            </g>
          ))}

          {/* x labels: first, middle, last */}
          {[0, Math.floor((n - 1) / 2), n - 1]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((i) => (
              <text
                key={i}
                x={x(i)}
                y={H - 6}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize="10"
                fontWeight="700"
                fill="var(--muted)"
              >
                {labels[i]}
              </text>
            ))}

          {/* crosshair */}
          {hoverIdx !== null && (
            <line
              x1={x(hoverIdx)}
              x2={x(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--ink)"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
          )}

          {/* area washes, then lines, then markers */}
          {paths.map((p, si) => (
            <path key={`a${si}`} d={p.area} fill={series[si].color} fillOpacity="0.1" />
          ))}
          {paths.map((p, si) => (
            <path
              key={`l${si}`}
              d={p.line}
              fill="none"
              stroke={series[si].color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {series.map((s, si) => {
            const last = s.values.length - 1;
            const i = hoverIdx ?? last;
            return (
              <circle
                key={`m${si}`}
                cx={x(i)}
                cy={y(s.values[i])}
                r="4.5"
                fill={s.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {hoverIdx !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 border-2 border-black bg-white px-2.5 py-1.5 shadow-hard"
            style={
              tipFlip
                ? { right: `${100 - tipLeftPct}%`, marginRight: 8 }
                : { left: `${tipLeftPct}%`, marginLeft: 8 }
            }
          >
            <p className="text-[10px] font-black uppercase tracking-wide text-black/50">
              {labels[hoverIdx]}
            </p>
            {series.map((s) => (
              <p key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-[2px] w-3 rounded" style={{ background: s.color }} />
                <strong className="font-black tabular-nums">
                  {yFormat(s.values[hoverIdx])}
                </strong>
                {series.length > 1 && <span className="font-bold text-black/50">{s.name}</span>}
              </p>
            ))}
          </div>
        )}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-bold text-black/40">
          View as table
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-1 pr-2 font-black">Week</th>
                {series.map((s) => (
                  <th key={s.name} className="py-1 text-right font-black">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((l, i) => (
                <tr key={l + i} className="border-t border-[var(--grid)]">
                  <td className="py-1 pr-2 font-bold text-black/70">{l}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-1 text-right font-black tabular-nums">
                      {yFormat(s.values[i])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
