// Small formatting + time-bucketing helpers shared by the charts and stats.

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

export function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((100 * part) / whole)}%`;
}

export type WeekBucket = { label: string; start: Date; end: Date };

// The last `n` calendar weeks (Mon–Sun), oldest first, labelled "Jun 2".
export function lastWeeks(n: number, now = new Date()): WeekBucket[] {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  // Walk back to this week's Monday.
  const dow = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - dow);
  const weeks: WeekBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(day);
    start.setDate(day.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weeks.push({
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      start,
      end,
    });
  }
  return weeks;
}

// Count timestamps into weekly buckets (new-per-week).
export function countPerWeek(dates: Date[], weeks: WeekBucket[]): number[] {
  return weeks.map(
    (w) => dates.filter((d) => d >= w.start && d < w.end).length
  );
}

// Running total as of the END of each bucket — for "growth so far" curves.
// `baseline` counts anything that predates the first bucket.
export function cumulativePerWeek(dates: Date[], weeks: WeekBucket[]): number[] {
  return weeks.map((w) => dates.filter((d) => d < w.end).length);
}
