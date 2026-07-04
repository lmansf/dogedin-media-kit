# Vercel Web Analytics on the media kit

The media kit ships with [`@vercel/analytics`](https://vercel.com/docs/analytics):
`<Analytics />` is rendered in `app/layout.tsx`, and every inquiry CTA fires a
custom `inquiry_click` event (via `components/TrackedLink.tsx`) with a
`placement` property saying which button was clicked: `header`, `hero`,
`mid_page`, `closing`, or `mailto`.

## The one step to turn it on

Enable **Web Analytics** on the Vercel project (Project → Analytics →
Enable). That's it — the code side is already deployed. Until it's enabled,
the injected script 404s harmlessly and nothing is recorded.

## What it shows

Traffic to **this page only** — i.e. how the advertiser pitch itself is
doing:

- **Visitors / page views** — how many prospects opened the media kit.
- **Referrers** — where they came from (a Facebook group link, an email,
  a QR code on a flyer, direct).
- **Countries and devices** — sanity check that the audience is local and
  the page works where they read it (mostly phones, most likely).
- **`inquiry_click` events** — which CTA converts: the sticky header, the
  hero, the mid-page band after the CTR numbers, the closing panel, or the
  mailto. This is the funnel: views → inquiry clicks.

## What it does NOT show

- **Main-site engagement.** Nothing about dogedin.com itself — dogs, paws,
  ad impressions, slot CTR. Those numbers come from the `media_kit_stats()` /
  `media_kit_weekly()` Supabase RPCs and are what the page displays.
- **What happens after the click.** The inquiry form lives on dogedin.com,
  a different deployment — form submissions are not tracked here (they
  already email the team / land in the main site's admin inbox).
- **History before it was enabled.** There is no backfill; counting starts
  the day Web Analytics is switched on.
