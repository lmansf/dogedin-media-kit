import { supabase } from "@/lib/supabase";

// One RPC: media_kit_stats() on the main project's schema. SECURITY DEFINER,
// granted to anon, and deliberately anonymized — community-scale counts and
// slot-level ad totals only. No advertiser identities, no member data. See
// supabase/schema.sql § 7 in the main dogedin repo.

export type SlotStat = {
  slot: string;
  impressions_30d: number;
  clicks_30d: number;
  ctr_30d: number;
};

// Why the page is showing sample numbers — false means the numbers are live.
// "unconfigured": the Supabase env vars aren't set (expected in local dev).
// "fetch_failed": env IS set but the RPC errored — usually media_kit_stats()
// hasn't been created on that project yet (main repo schema.sql § 7), or the
// URL/key is wrong. Never render placeholder numbers without saying which.
export type DemoReason = false | "unconfigured" | "fetch_failed";

export type MediaKitStats = {
  demo: DemoReason;
  dogsTotal: number;
  dogsNew90: number;
  posts30: number;
  paws30: number;
  friendships: number;
  businesses: number;
  reviews: number;
  avgRating: number | null;
  slots: SlotStat[];
};

export async function getMediaKitStats(): Promise<MediaKitStats> {
  if (!supabase) return DEMO;
  const { data, error } = await supabase.rpc("media_kit_stats");
  if (error || !data) {
    // Loud, labelled fallback — placeholder numbers must NEVER render as if
    // they were live. The message lands in the server/Vercel function logs.
    console.error(
      "[media-kit] media_kit_stats RPC failed — rendering labelled sample data:",
      error?.message ?? "RPC returned no data"
    );
    return { ...DEMO, demo: "fetch_failed" };
  }
  const d = data as {
    dogs_total: number;
    dogs_new_90d: number;
    posts_30d: number;
    paws_30d: number;
    friendships_total: number;
    businesses_approved: number;
    reviews_total: number;
    avg_rating: number | null;
    slots: SlotStat[];
  };
  return {
    demo: false,
    dogsTotal: d.dogs_total ?? 0,
    dogsNew90: d.dogs_new_90d ?? 0,
    posts30: d.posts_30d ?? 0,
    paws30: d.paws_30d ?? 0,
    friendships: d.friendships_total ?? 0,
    businesses: d.businesses_approved ?? 0,
    reviews: d.reviews_total ?? 0,
    avgRating: d.avg_rating,
    slots: d.slots ?? [],
  };
}

const DEMO: MediaKitStats = {
  demo: "unconfigured",
  dogsTotal: 87,
  dogsNew90: 34,
  posts30: 42,
  paws30: 187,
  friendships: 63,
  businesses: 24,
  reviews: 58,
  avgRating: 4.6,
  slots: [
    { slot: "home_feed", impressions_30d: 2510, clicks_30d: 78, ctr_30d: 3.11 },
    { slot: "ttd_grid", impressions_30d: 2470, clicks_30d: 64, ctr_30d: 2.59 },
    { slot: "events_feed", impressions_30d: 1860, clicks_30d: 34, ctr_30d: 1.83 },
  ],
};
