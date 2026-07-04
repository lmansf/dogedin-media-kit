# Dogedin · Media kit (advertiser pitch)

A public, shareable one-pager for businesses interested in advertising on
[dogedin.com](https://dogedin.com): who the audience is, where the ad slots
run, and live aggregate performance numbers. Send the URL to any Main Street
business that asks "who actually sees this?"

## What it shows

- **Hero reach number** — registered local dogs, growing count.
- **Audience engagement** — photos, paws, friendships, guide reviews (live
  aggregates, recounted hourly).
- **Placements** — the three native slots (`home_feed`, `ttd_grid`,
  `events_feed`) with 30-day impressions + CTR per slot when there's data,
  "fresh slot — be the first" when there isn't.
- **How it works** — weighted rotation, flight windows, honest per-advertiser
  reporting.
- **CTA** — straight into the main site's `/advertise` inquiry form (which
  emails the team) or a mailto.

## Data access

One RPC on the main project: `media_kit_stats()` — SECURITY DEFINER, granted
to `anon`, and **deliberately anonymized**: community-scale counts and
slot-level totals only. No advertiser identities, no per-campaign numbers, no
member or revenue data. It ships in the main repo's `supabase/schema.sql`
(§ 7, "analytics helpers") — run that file once before pointing this app at
production.

## Setup

```bash
npm install
cp .env.local.example .env.local   # Supabase URL + anon key
npm run dev                        # http://localhost:4003
```

With no env configured the page renders labelled **sample data**.

## Deploy

Stock Next.js 15 → Vercel; set the `NEXT_PUBLIC_SUPABASE_*` vars (plus
`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_CONTACT_EMAIL` if they differ from the
defaults). A nice touch: point a subdomain like `advertise.dogedin.com` at it.

## Production checklist (live numbers, not placeholders)

The page shows a gold **"Sample data"** banner whenever it is NOT serving
live numbers — the banner text says whether the env is missing or the live
fetch failed. To go live:

1. **Create the RPCs** — run the main repo's `supabase/schema.sql` § 7
   (`media_kit_stats`, and `media_kit_weekly` for the growth chart) against
   the **production** Supabase project (SQL editor, once — the file is
   idempotent). Quick check that it worked:

   ```bash
   curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/media_kit_stats" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
   # → JSON stats, not a 404 "function not found"
   ```

2. **Set the env vars** — `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project settings (all
   environments).

3. **Redeploy** — env vars are baked in at build time, so a redeploy is
   required after changing them. After that, data refreshes on a 10-minute
   ISR window (`revalidate = 600` in `app/page.tsx`).

If the banner still shows "fetch failed" after all three steps, the exact
Supabase error is in the Vercel function logs (`[media-kit] media_kit_stats
RPC failed …`).
