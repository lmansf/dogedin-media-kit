import { getMediaKitStats } from "@/lib/stats";
import { SITE_URL, CONTACT_EMAIL } from "@/lib/supabase";
import StatTile from "@/components/charts/StatTile";
import BarRows from "@/components/charts/BarRows";

export const revalidate = 3600;

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

export default async function MediaKit() {
  const s = await getMediaKitStats();
  const hasAdData = s.slots.some((x) => x.impressions_30d > 0);

  return (
    <div className="flex flex-col gap-10">
      {s.demo && (
        <p className="border-[3px] border-black bg-[var(--gold)]/30 px-4 py-2 text-xs font-black uppercase tracking-wide">
          Sample data — set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY to publish live
          numbers.
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
            <a
              href={`${SITE_URL}/advertise`}
              className="border-[3px] border-black bg-[var(--turq)] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--sand)] shadow-hard transition-transform hover:-translate-y-0.5"
            >
              Start an inquiry →
            </a>
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
          <StatTile
            label="Photos shared · 30d"
            value={s.posts30.toLocaleString("en-US")}
          />
          <StatTile label="Paws given · 30d" value={s.paws30.toLocaleString("en-US")} />
          <StatTile
            label="Dog friendships"
            value={s.friendships.toLocaleString("en-US")}
          />
          <StatTile
            label="Local guide reviews"
            value={s.reviews.toLocaleString("en-US")}
            hint={s.avgRating ? `${s.avgRating}★ average` : undefined}
          />
        </div>
        <p className="text-xs font-bold text-black/50">
          Plus {s.businesses.toLocaleString("en-US")} local businesses already
          listed in the dog-friendly guide. Page-view traffic stats are
          available on request.
        </p>
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
                  <p className="mt-3 border-t-2 border-black pt-2 text-xs font-bold text-black/70">
                    <strong className="font-black">
                      {stat.impressions_30d.toLocaleString("en-US")}
                    </strong>{" "}
                    impressions ·{" "}
                    <strong className="font-black">{stat.ctr_30d}%</strong> CTR
                    <span className="text-black/40"> · last 30 days</span>
                  </p>
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
            <a
              href={`${SITE_URL}/advertise`}
              className="border-[3px] border-black bg-[var(--gold)] px-5 py-2 text-sm font-black uppercase tracking-wide text-[var(--ink)] shadow-hard transition-transform hover:-translate-y-0.5"
            >
              Inquiry form →
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="border-[3px] border-black bg-white px-5 py-2 text-sm font-black uppercase tracking-wide text-[var(--ink)] shadow-hard transition-transform hover:-translate-y-0.5"
            >
              {CONTACT_EMAIL}
            </a>
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
