import { getMediaKitStats, getMediaKitWeekly } from "@/lib/stats";
import { SITE_URL, CONTACT_EMAIL } from "@/lib/supabase";
import { compact } from "@/lib/format";
import StatTile from "@/components/charts/StatTile";
import BarRows from "@/components/charts/BarRows";
import StackBar from "@/components/charts/StackBar";
import TrendChart from "@/components/charts/TrendChart";
import TrackedLink from "@/components/TrackedLink";

// Short enough that a schema/env fix shows up within minutes, long enough
// that the Supabase RPCs aren't hit on every request.
export const revalidate = 600;

const SLOT_INFO: Record<string, { name: string; where: string; blurb: string }> = {
  home_feed: {
    name: "Homepage feed",
    where: "dogedin.com — front page",
    blurb:
      "The first thing every visitor scrolls. Native card between community sections, clearly labelled “Local partner.”",
  },
  ttd_grid: {
    name: "Local guide grid",
    where: "dogedin.com/things-to-do",
    blurb:
      "Sits inside the dog-friendly business directory — people here are literally deciding where to go next.",
  },
  events_feed: {
    name: "Events page",
    where: "dogedin.com/events",
    blurb:
      "Next to the weekend's dog-friendly events. Great fit for breweries, cafés and anything with a patio.",
  },
};

// Fixed --series-* assignment per slot so the stacked bar, the CTR bars and
// the placement cards all speak the same color.
const SLOT_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

export default async function MediaKit() {
  const [s, weekly] = await Promise.all([getMediaKitStats(), getMediaKitWeekly()]);
  const hasAdData = s.slots.some((x) => x.impressions_30d > 0);

  return (
    <div className="flex flex-col gap-10">
      {s.demo === "unconfigured" && (
        <p className="border-[3px] border-black bg-[var(--gold)]/30 px-4 py-2 text-xs font-black uppercase tracking-wide">
          Sample data — set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY to publish live
          numbers.
        </p>
      )}
      {s.demo === "fetch_failed" && (
        <p className="border-[3px] border-black bg-[var(--gold)]/30 px-4 py-2 text-xs font-black uppercase tracking-wide">
          Sample data — the live stats fetch failed. Check that
          media_kit_stats() exists on the Supabase project (main repo
          schema.sql § 7) and that the URL / anon key are correct; details are
          in the server logs.
        </p>
      )}

      {/* ------------------------------------------------ Hero */}
      <section className="relative overflow-hidden border-[3px] border-black bg-white p-8 shadow-hard-lg">
        <div className="dots absolute inset-0" />
        <div className="relative">
          <span className="inline-block -rotate-1 border-2 border-black bg-[var(--ink)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--sand)]">
            Why Dogedin
          </span>
          <h1 className="mt-3 max-w-xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Put your business in front of Dunedin&apos;s dog people
          </h1>
          <p className="mt-3 max-w-lg text-sm font-bold text-black/60">
            Dogedin is where the town&apos;s dog owners register their dogs,
            find dog-friendly spots, and plan their weekends. Not an audience
            bought from an ad network — the actual neighborhood.
          </p>
          <div className="mt-6 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-6xl font-black leading-none">
                {s.dogsTotal.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-black/50">
                Registered local dogs (+{s.dogsNew90} in 90 days)
              </p>
            </div>
            <TrackedLink
              placement="hero"
              href={`${SITE_URL}/advertise`}
              className="border-[3px] border-black bg-[var(--turq)] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--sand)] shadow-hard transition-transform hover:-translate-y-0.5"
            >
              Start an inquiry →
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Audience */}
      <section className="flex flex-col gap-4">
        <SectionHead
          kicker="The audience"
          title="Small town, real engagement"
          blurb="Every number below is a live aggregate from the community — refresh the page and it re-counts."
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* compact() keeps five-digit-plus values inside a ~150px tile at
              360px viewports. */}
          <StatTile label="Photos shared · 30d" value={compact(s.posts30)} />
          <StatTile label="Paws given · 30d" value={compact(s.paws30)} />
          <StatTile label="Dog friendships" value={compact(s.friendships)} />
          <StatTile
            label="Local guide reviews"
            value={compact(s.reviews)}
            hint={s.avgRating ? `${s.avgRating}★ average` : undefined}
          />
        </div>
        <p className="text-xs font-bold text-black/50">
          Plus {s.businesses.toLocaleString("en-US")} local businesses already
          listed in the dog-friendly guide. Page-view traffic stats are
          available on request.
        </p>

        {/* Weekly growth — only rendered when the headline stats are live AND
            media_kit_weekly() answered with data, so a real curve never sits
            under a "sample data" banner. No chart beats a made-up curve. */}
        {s.demo === false && weekly && (
          <div className="border-[3px] border-black bg-white p-4 shadow-hard">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide">
              Community growth · new per week · last 12 weeks
            </h3>
            <TrendChart
              labels={weekly.labels}
              series={[
                { name: "New dogs", color: "var(--series-1)", values: weekly.newDogs },
                { name: "Photos", color: "var(--series-2)", values: weekly.newPosts },
                { name: "Paws", color: "var(--series-3)", values: weekly.newPaws },
              ]}
            />
          </div>
        )}
      </section>

      {/* ------------------------------------------------ Placements */}
      <section className="flex flex-col gap-4">
        <SectionHead
          kicker="Placements"
          title="Where your ad runs"
          blurb="Three native slots, one ad at a time per slot, always labelled as a local partner."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(SLOT_INFO).map(([key, info]) => {
            const stat = s.slots.find((x) => x.slot === key);
            return (
              <div key={key} className="flex flex-col border-[3px] border-black bg-white p-4 shadow-hard">
                <h3 className="font-display text-lg font-extrabold leading-tight">
                  {info.name}
                </h3>
                <p className="text-[11px] font-black uppercase tracking-wide text-[var(--turq)]">
                  {info.where}
                </p>
                <p className="mt-2 flex-1 text-xs font-bold text-black/60">{info.blurb}</p>
                {stat && stat.impressions_30d > 0 ? (
                  <div className="mt-3 border-t-2 border-black pt-2">
                    <p className="text-xs font-bold text-black/70">
                      <strong className="font-black">
                        {stat.impressions_30d.toLocaleString("en-US")}
                      </strong>{" "}
                      impressions ·{" "}
                      <strong className="font-black">{stat.ctr_30d}%</strong> CTR
                      <span className="text-black/40"> · last 30 days</span>
                    </p>
                    {/* Drill-down: overview line above for skimmers, the full
                        slot breakdown one tap away. Plain <details> — works
                        without JS and stays a server component. */}
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[11px] font-black uppercase tracking-wide text-[var(--turq)]">
                        Full 30-day numbers
                      </summary>
                      <dl className="mt-2 flex flex-col gap-1 text-xs font-bold text-black/70">
                        <div className="flex justify-between gap-2">
                          <dt>Impressions</dt>
                          <dd className="font-black tabular-nums">
                            {stat.impressions_30d.toLocaleString("en-US")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Clicks</dt>
                          <dd className="font-black tabular-nums">
                            {stat.clicks_30d.toLocaleString("en-US")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Click-through rate</dt>
                          <dd className="font-black tabular-nums">{stat.ctr_30d}%</dd>
                        </div>
                      </dl>
                    </details>
                  </div>
                ) : (
                  <p className="mt-3 border-t-2 border-black pt-2 text-xs font-black uppercase tracking-wide text-[var(--coral)]">
                    Fresh slot — be the first
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {hasAdData && (
          <div className="border-[3px] border-black bg-white p-4 shadow-hard">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide">
              Impression share by placement · last 30 days
            </h3>
            {/* Derived from the same s.slots the CTR chart uses, so both
                charts describe the same set of placements and the share
                denominator is the true total (a slot the RPC returns but
                SLOT_INFO doesn't know still counts, labelled by its key). */}
            <StackBar
              segments={s.slots
                .filter((x) => x.impressions_30d > 0)
                .map((x, i) => ({
                  label: SLOT_INFO[x.slot]?.name ?? x.slot,
                  value: x.impressions_30d,
                  color: SLOT_COLORS[i % SLOT_COLORS.length],
                }))}
            />
          </div>
        )}

        {hasAdData && (
          <div className="border-[3px] border-black bg-white p-4 shadow-hard">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide">
              Click-through rate by placement · last 30 days
            </h3>
            <BarRows
              rows={s.slots
                .map((x) => ({
                  label: SLOT_INFO[x.slot]?.name ?? x.slot,
                  value: x.ctr_30d,
                  hint: `${x.clicks_30d.toLocaleString("en-US")} clicks / ${x.impressions_30d.toLocaleString("en-US")} impressions`,
                }))
                .sort((a, b) => b.value - a.value)}
              color="var(--series-2)"
              unit="%"
            />
            <p className="mt-3 text-xs font-bold text-black/40">
              Aggregate across all campaigns — for scale: typical banner ads
              industry-wide run well under 0.5%.
            </p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ Mid-page CTA */}
      {/* Buying intent peaks right after the CTR numbers — catch it before
          the how-it-works details. */}
      <section className="relative overflow-hidden border-[3px] border-black bg-[var(--coral)] p-6 shadow-hard-lg sm:p-8">
        <div className="dots absolute inset-0" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Want your card in one of these slots?
            </h2>
            <p className="mt-1 max-w-md text-sm font-bold text-black/70">
              Tell us which placement and when — we&apos;ll come back with
              current rates and what&apos;s available.
            </p>
          </div>
          <TrackedLink
            placement="mid_page"
            href={`${SITE_URL}/advertise`}
            className="shrink-0 border-[3px] border-black bg-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-wide text-[var(--sand)] shadow-hard transition-transform hover:-translate-y-0.5"
          >
            Start an inquiry →
          </TrackedLink>
        </div>
      </section>

      {/* ------------------------------------------------ How it works */}
      <section className="flex flex-col gap-4">
        <SectionHead
          kicker="How it works"
          title="Simple, honest, local"
          blurb="No auctions, no tracking pixels, no middlemen."
        />
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            ["🎯", "One slot, your card", "Your business card — logo, tagline, link — rotates in the slot you book. Heavier weight = more of the rotation."],
            ["📅", "Flight windows", "Book a date range or run evergreen. Campaigns switch themselves off at the end date."],
            ["📈", "Honest reporting", "You get your own impressions, clicks and CTR per placement — the same numbers we look at."],
            ["🤝", "Community first", "Ads are clearly labelled, family-friendly, and local. If your customers walk on four legs (or hold the leash), you'll fit right in."],
          ].map(([emoji, title, body]) => (
            <li key={title} className="flex gap-3 border-[3px] border-black bg-white p-4 shadow-hard">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="text-sm font-black">{title}</p>
                <p className="text-xs font-bold text-black/60">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="relative overflow-hidden border-[3px] border-black bg-[var(--green)] p-8 text-center shadow-hard-lg">
        <div className="dots absolute inset-0" />
        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold text-[var(--sand)]">
            Let&apos;s talk 🐾
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm font-bold text-[var(--sand)]/90">
            Tell us which slot and when — we&apos;ll come back with current
            rates and what&apos;s available.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <TrackedLink
              placement="closing"
              href={`${SITE_URL}/advertise`}
              className="border-[3px] border-black bg-[var(--gold)] px-5 py-2 text-sm font-black uppercase tracking-wide text-[var(--ink)] shadow-hard transition-transform hover:-translate-y-0.5"
            >
              Inquiry form →
            </TrackedLink>
            {/* max-w-full + break-all: a long configured contact email wraps
                inside the button instead of overflowing a 360px screen. */}
            <TrackedLink
              placement="mailto"
              href={`mailto:${CONTACT_EMAIL}`}
              className="max-w-full break-all border-[3px] border-black bg-white px-5 py-2 text-sm font-black uppercase tracking-wide text-[var(--ink)] shadow-hard transition-transform hover:-translate-y-0.5"
            >
              {CONTACT_EMAIL}
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <div>
      <span className="inline-block -rotate-1 border-2 border-black bg-[var(--ink)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--sand)]">
        {kicker}
      </span>
      <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight">{title}</h2>
      <p className="text-sm font-bold text-black/50">{blurb}</p>
    </div>
  );
}
