"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, SITE_URL, CONTACT_EMAIL } from "@/lib/supabase";
import StatTile from "@/components/charts/StatTile";
import TrendChart from "@/components/charts/TrendChart";
import { compact } from "@/lib/format";

// The Business Insights portal: a business signs in with the email on its
// Dogedin listing (owner_email) and — with an active subscription — sees its
// own engagement numbers: listing views, website taps, calls, direction taps,
// offer unlocks, plus a review benchmark against its category. All access
// control lives server-side in the my_portal_businesses() / business_insights()
// SECURITY DEFINER RPCs (main repo schema § 8): the caller's email must match
// the listing AND the subscription must be active (admins get a preview).
// Accounts are shared with dogedin.com — same Supabase project, same login.

const PRICE_LABEL =
  process.env.NEXT_PUBLIC_INSIGHTS_PRICE_LABEL || "$15/mo";

type PortalBusiness = {
  id: string;
  slug: string;
  name: string;
  category: string;
  neighborhood: string | null;
  insights_active: boolean;
  is_admin: boolean;
};

type DailyRow = {
  day: string;
  view: number;
  website: number;
  phone: number;
  directions: number;
  offer_unlock: number;
};

type Insights = {
  business: { id: string; slug: string; name: string; category: string };
  access: "active" | "admin_preview";
  totals_30d: Record<string, number>;
  totals_lifetime: Record<string, number>;
  daily_30d: DailyRow[];
  reviews: {
    count: number;
    avg: number | null;
    recent_90d: number;
    category: string;
    category_avg: number | null;
    category_businesses: number;
    rank_in_category: number | null;
  };
};

export default function PortalApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [subBanner, setSubBanner] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Post-checkout return: ?sub=success|canceled (set by the main site).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("sub");
    if (v === "success" || v === "canceled") setSubBanner(v);
  }, []);

  if (!supabase) {
    return (
      <Notice>
        The portal isn&apos;t connected yet — Supabase env vars are missing on
        this deployment.
      </Notice>
    );
  }
  if (authLoading) {
    return <p className="text-sm font-bold text-black/40">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <span className="inline-block -rotate-1 border-2 border-black bg-[var(--ink)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--sand)]">
          Business portal
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">
          Your listing&apos;s numbers
        </h1>
        <p className="mt-1 max-w-lg text-sm font-bold text-black/60">
          Views, website taps, calls, directions, offer unlocks — and how your
          reviews stack up in your category. Aggregate counts only; visitor
          identity is never collected.
        </p>
      </section>

      {subBanner === "success" && (
        <Notice tone="green">
          🎉 Subscription active — your insights unlock below. (Give it a few
          seconds and refresh if it hasn&apos;t flipped yet.)
        </Notice>
      )}
      {subBanner === "canceled" && (
        <Notice>
          Checkout canceled — nothing was charged. Subscribe any time below.
        </Notice>
      )}

      {user ? <Dashboard user={user} /> : <PortalAuth />}
    </div>
  );
}

// ---------------------------------------------------------------- auth panel
function PortalAuth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setNotice(null);
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setNotice(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setNotice(error.message);
      else if (!data.session)
        setNotice("Check your email to confirm the account, then sign in here.");
    }
    setBusy(false);
  };

  return (
    <form
      onSubmit={go}
      className="flex max-w-md flex-col gap-3 border-[3px] border-black bg-white p-5 shadow-hard"
    >
      <div className="flex gap-2">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wide ${
              mode === m ? "bg-[var(--ink)] text-[var(--sand)]" : "bg-white"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-black/50">
        Use the email on your Dogedin listing — that&apos;s what connects your
        account to your business. Same account works on dogedin.com.
      </p>
      <input
        type="email"
        required
        placeholder="you@yourbusiness.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={input}
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={input}
      />
      {notice && <p className="text-sm font-bold text-[var(--coral)]">{notice}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-fit border-[3px] border-black bg-[var(--turq)] px-4 py-2 text-sm font-black uppercase tracking-wide text-[var(--sand)] shadow-hard transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {busy ? "One sec…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <p className="text-[11px] font-bold text-black/40">
        Forgot your password? Reset it at{" "}
        <a href={`${SITE_URL}/reset-password`} className="underline">
          dogedin.com/reset-password
        </a>{" "}
        — it&apos;s the same account.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------- dashboard
function Dashboard({ user }: { user: User }) {
  const [businesses, setBusinesses] = useState<PortalBusiness[] | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("my_portal_businesses");
    setBusinesses(error || !data ? [] : (data as PortalBusiness[]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = businesses?.some((b) => b.is_admin) ?? false;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-black/50">
        <span>
          Signed in as <strong className="text-black/80">{user.email}</strong>
          {isAdmin && (
            <span className="ml-2 border-2 border-black bg-[var(--gold)] px-1.5 py-0.5 text-[10px] font-black uppercase text-black">
              Admin preview — you see every listing
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => supabase?.auth.signOut()}
          className="font-black uppercase tracking-wide underline"
        >
          Sign out
        </button>
      </div>

      {businesses === null && (
        <p className="text-sm font-bold text-black/40">Loading your listings…</p>
      )}

      {businesses !== null && businesses.length === 0 && (
        <Notice>
          No Dogedin listing is connected to <strong>{user.email}</strong> yet.
          The connection is the contact email on your listing — if your business
          is already in the local guide, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>{" "}
          to link it. Not listed yet?{" "}
          <a href={`${SITE_URL}/list-your-business`} className="underline">
            Add your business free →
          </a>
        </Notice>
      )}

      {businesses?.map((b) =>
        b.insights_active ? (
          <InsightsPanel key={b.id} biz={b} />
        ) : (
          <LockedPanel key={b.id} biz={b} />
        )
      )}
    </div>
  );
}

// A listing without an active subscription: what they get + the subscribe CTA.
function LockedPanel({ biz }: { biz: PortalBusiness }) {
  return (
    <section className="border-[3px] border-black bg-white p-5 shadow-hard">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">{biz.name}</h2>
          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
            {biz.category}
            {biz.neighborhood ? ` · ${biz.neighborhood}` : ""}
          </p>
          <p className="mt-2 max-w-md text-sm font-bold text-black/60">
            Unlock your listing&apos;s live numbers: views, website taps, calls,
            direction taps, offer unlocks, and how your rating compares with
            other {biz.category.toLowerCase()} spots. Counted since day one —
            history is already accruing.
          </p>
        </div>
        <a
          href={`${SITE_URL}/api/insights/checkout?business=${biz.id}`}
          className="shrink-0 border-[3px] border-black bg-[var(--coral)] px-4 py-2 text-sm font-black uppercase tracking-wide shadow-hard transition-transform hover:-translate-y-0.5"
        >
          Unlock insights · {PRICE_LABEL}
        </a>
      </div>
    </section>
  );
}

// "Jul 5" from a YYYY-MM-DD string, parsed as LOCAL time (a bare new Date(str)
// would parse UTC and can shift the label a day).
function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function InsightsPanel({ biz }: { biz: PortalBusiness }) {
  const [ins, setIns] = useState<Insights | null | "loading">("loading");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .rpc("business_insights", { p_business_id: biz.id })
      .then(({ data, error }) =>
        setIns(error || !data ? null : (data as Insights))
      );
  }, [biz.id]);

  if (ins === "loading")
    return (
      <p className="text-sm font-bold text-black/40">Loading {biz.name}…</p>
    );
  if (!ins)
    return (
      <Notice>
        Couldn&apos;t load insights for {biz.name} — if you just subscribed,
        give it a few seconds and refresh.
      </Notice>
    );

  const t = ins.totals_30d;
  const taps30 =
    (t.website ?? 0) + (t.phone ?? 0) + (t.directions ?? 0);
  const daily = ins.daily_30d;
  const r = ins.reviews;

  return (
    <section className="flex flex-col gap-4 border-[3px] border-black bg-white p-5 shadow-hard">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold">{biz.name}</h2>
          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
            {ins.business.category} · last 30 days
          </p>
        </div>
        {ins.access === "admin_preview" && (
          <span className="border-2 border-black bg-[var(--gold)] px-2 py-0.5 text-[10px] font-black uppercase">
            Admin preview
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Listing views" value={compact(t.view ?? 0)} />
        <StatTile label="Website taps" value={compact(t.website ?? 0)} />
        <StatTile label="Calls" value={compact(t.phone ?? 0)} />
        <StatTile label="Directions" value={compact(t.directions ?? 0)} />
        <StatTile label="Offer unlocks" value={compact(t.offer_unlock ?? 0)} />
      </div>

      {taps30 + (t.view ?? 0) > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-black uppercase tracking-wide">
            Daily activity
          </h3>
          <TrendChart
            labels={daily.map((d) => dayLabel(d.day))}
            series={[
              {
                name: "Views",
                color: "var(--series-1)",
                values: daily.map((d) => d.view),
              },
              {
                name: "Website taps",
                color: "var(--series-2)",
                values: daily.map((d) => d.website),
              },
              {
                name: "Calls + directions",
                color: "var(--series-3)",
                values: daily.map((d) => d.phone + d.directions),
              },
            ]}
          />
        </div>
      ) : (
        <p className="border-2 border-dashed border-black/30 px-3 py-2 text-sm font-bold text-black/50">
          Counting started — numbers appear here as dog people find your
          listing. Share your review link from the local guide to get moving.
        </p>
      )}

      <div className="border-t-2 border-dashed border-black/15 pt-3 text-sm font-bold text-black/70">
        <h3 className="mb-1 text-sm font-black uppercase tracking-wide text-black">
          Reviews benchmark
        </h3>
        {r.count > 0 ? (
          <p>
            ⭐ {r.avg} average over {r.count} review{r.count === 1 ? "" : "s"}
            {r.recent_90d > 0 && <> ({r.recent_90d} in the last 90 days)</>}.
            Category average for {r.category.toLowerCase()}:{" "}
            {r.category_avg ?? "—"}
            {r.rank_in_category != null && (
              <>
                {" "}
                — you&apos;re <strong>#{r.rank_in_category}</strong> of{" "}
                {r.category_businesses} in your category
              </>
            )}
            .
          </p>
        ) : (
          <p>
            No reviews yet — your{" "}
            <a
              href={`${SITE_URL}/things-to-do/${biz.slug}`}
              className="underline"
            >
              listing&apos;s review link
            </a>{" "}
            is the fastest way to start (reviewers unlock your thank-you offer).
          </p>
        )}
      </div>

      <p className="text-[11px] font-bold text-black/40">
        Lifetime: {compact(ins.totals_lifetime.view ?? 0)} views ·{" "}
        {compact(
          (ins.totals_lifetime.website ?? 0) +
            (ins.totals_lifetime.phone ?? 0) +
            (ins.totals_lifetime.directions ?? 0)
        )}{" "}
        taps. Counters are aggregate per day — no visitor identity is ever
        recorded.
      </p>
    </section>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "green";
}) {
  return (
    <p
      className={`border-[3px] border-black px-4 py-3 text-sm font-bold shadow-hard ${
        tone === "green" ? "bg-[var(--sand)]" : "bg-[var(--gold)]/20"
      }`}
    >
      {children}
    </p>
  );
}

const input =
  "border-2 border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--turq)]";
