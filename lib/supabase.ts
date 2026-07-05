import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

// Every advertiser-facing CTA points at `${SITE_URL}/advertise`, so a stray
// `http://` or trailing slash in the env var would land prospects on a TLS
// warning or a `//advertise` 404. Normalize defensively: force https, strip
// the trailing slash. No vercel.app fallback on purpose — the canonical
// domain is the default, and a cert problem there is a DNS/domain fix on the
// main site, not something this repo should paper over.
function normalizeSiteUrl(raw: string | undefined): string {
  const host = (raw ?? "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return host ? `https://${host}` : "https://dogedin.com";
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

// Contact address for CTAs. No hardcoded fallback — when unset, consumers
// hide their mailto link (set NEXT_PUBLIC_CONTACT_EMAIL on the deployment).
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();
