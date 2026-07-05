"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, SITE_URL, CONTACT_EMAIL } from "@/lib/supabase";
import StatTile from "@/components/charts/StatTile";
import TrendChart from "@/components/charts/TrendChart";
import { compact } from "@/lib/format";

// The Business Insights portal, tiered:
//   FREE  — any account connected to a listing (owner_email or an invite-code
//           team member) sees the vanity layer: 30-day views + review basics,
//           with the lead metrics rendered as locked cards + an upgrade CTA.
//   PAID  — an active $-per-month subscription unlocks the full picture:
//           website taps, calls, directions, offer unlocks, the daily trend,
//           the category benchmark — plus team seats (owner can mint up to 4
//           invite codes; 5 logins total).
// All access control lives server-side in the SECURITY DEFINER RPCs (main
// repo schema § 8); this component just renders whatever tier the RPC returns.
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
  is_owner: boolean;
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
  access: "active" | "admin_preview" | "free";
  // Free tier:
  views_30d?: number;
  // Full tier:
  totals_30d?: Record<string, number>;
  totals_lifetime?: Record<string, number>;
  daily_30d?: DailyRow[];
  reviews: {
    count: number;
    avg: number | null;
    recent_90d: number;
    category: string;
    category_avg?: number | null;
    category_businesses?: number;
    rank_in_category?: number | null;
  };
};

type Team = {
  members: { email: string; added_at: string }[];
  codes: { code: string; redeemed: boolean }[];
  seats_total: number;
  seats_used: number;
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
          Free: see that dog people are finding you. Insights ({PRICE_LABEL}):
          see the taps, calls, offer unlocks and how you rank in your category.
          Aggregate counts only — visitor identity is never collected.
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
          Checkout canceled — nothing was charged. Upgrade any time below.
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
        account to your business. Got a team invite code instead? Create an
        account with any email, then redeem the code inside. Same account works
        on dogedin.com.
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
          </a>{" "}
          Got a team invite code? Redeem it below.
        </Notice>
      )}

      {businesses?.map((b) => (
        <InsightsPanel key={b.id} biz={b} />
      ))}

      <RedeemBox onDone={load} />
    </div>
  );
}

// "Have an invite code?" — ties this signed-in account to a business as a team
// member (codes are minted by the owner on a premium listing).
function RedeemBox({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !code.trim()) return;
    setBusy(true);
    setNotice(null);
    const { data, error } = await supabase.rpc("redeem_business_invite", {
      p_code: code.trim(),
    });
    setBusy(false);
    if (error || !data) {
      setNotice("That code didn't work — it may already be used. Ask the owner for a fresh one.");
      return;
    }
    setCode("");
    setNotice("You're in! Loading the business…");
    onDone();
  };

  return (
    <form
      onSubmit={redeem}
      className="flex flex-wrap items-center gap-2 border-2 border-dashed border-black/30 p-3"
    >
      <span className="text-xs font-black uppercase tracking-wide text-black/50">
        🎟 Have a team invite code?
      </span>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="PACK-XXXXXXXX"
        className={`${input} w-44 uppercase`}
      />
      <button
        type="button"
        onClick={redeem}
        disabled={busy}
        className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-wide shadow-hard transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {busy ? "…" : "Redeem"}
      </button>
      {notice && <span className="text-xs font-bold text-black/60">{notice}</span>}
    </form>
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
        Couldn&apos;t load {biz.name} — if you just subscribed or redeemed a
        code, give it a few seconds and refresh.
      </Notice>
    );

  return ins.access === "free" ? (
    <FreePanel biz={biz} ins={ins} />
  ) : (
    <FullPanel biz={biz} ins={ins} />
  );
}

// ------------------------------------------------------------- FREE tier
// The vanity layer, real numbers — plus the locked lead metrics as the pitch.
function FreePanel({ biz, ins }: { biz: PortalBusiness; ins: Insights }) {
  const r = ins.reviews;
  return (
    <section className="flex flex-col gap-4 border-[3px] border-black bg-white p-5 shadow-hard">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold">{biz.name}</h2>
          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
            {ins.business.category} · free plan
          </p>
        </div>
        <span className="border-2 border-black bg-[var(--sand)] px-2 py-0.5 text-[10px] font-black uppercase">
          Free
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Listing views · 30d" value={compact(ins.views_30d ?? 0)} />
        <StatTile label="Reviews" value={compact(r.count)} />
        <StatTile label="Avg rating" value={r.avg != null ? `${r.avg}★` : "—"} />
      </div>

      {/* The locked layer: name exactly what they'd see, show nothing. */}
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-black/50">
          In Insights ({PRICE_LABEL})
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            "Website taps",
            "Calls",
            "Direction taps",
            "Offer unlocks",
            "Daily trend chart",
            `Rank among ${r.category?.toLowerCase() ?? "your category"}`,
          ].map((label) => (
            <div
              key={label}
              className="border-[3px] border-dashed border-black/40 bg-[var(--sand)]/60 p-4"
            >
              <p className="text-xs font-black uppercase tracking-wide text-black/40">
                {label}
              </p>
              <p className="mt-1 text-3xl font-black text-black/25">🔒</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-black/15 pt-3">
        <p className="max-w-sm text-xs font-bold text-black/60">
          Insights shows the numbers that mean customers — taps, calls,
          directions, offer unlocks, and your rank in {r.category ?? "your category"}.
          Includes <strong>5 team logins</strong>. Counting is already running,
          so your history is waiting.
        </p>
        <a
          href={`${SITE_URL}/api/insights/checkout?business=${biz.id}`}
          className="shrink-0 border-[3px] border-black bg-[var(--coral)] px-4 py-2 text-sm font-black uppercase tracking-wide shadow-hard transition-transform hover:-translate-y-0.5"
        >
          Upgrade · {PRICE_LABEL}
        </a>
      </div>
    </section>
  );
}

// ------------------------------------------------------------- PAID tier
function FullPanel({ biz, ins }: { biz: PortalBusiness; ins: Insights }) {
  const t = ins.totals_30d ?? {};
  const daily = ins.daily_30d ?? [];
  const r = ins.reviews;
  const life = ins.totals_lifetime ?? {};
  const taps30 = (t.website ?? 0) + (t.phone ?? 0) + (t.directions ?? 0);

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
              { name: "Views", color: "var(--series-1)", values: daily.map((d) => d.view) },
              { name: "Website taps", color: "var(--series-2)", values: daily.map((d) => d.website) },
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
            Category average for {r.category?.toLowerCase()}:{" "}
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
            <a href={`${SITE_URL}/things-to-do/${biz.slug}`} className="underline">
              listing&apos;s review link
            </a>{" "}
            is the fastest way to start (reviewers unlock your thank-you offer).
          </p>
        )}
      </div>

      {(biz.is_owner || biz.is_admin) && <TeamPanel businessId={biz.id} />}

      <p className="text-[11px] font-bold text-black/40">
        Lifetime: {compact(life.view ?? 0)} views ·{" "}
        {compact((life.website ?? 0) + (life.phone ?? 0) + (life.directions ?? 0))}{" "}
        taps. Counters are aggregate per day — no visitor identity is ever
        recorded.
      </p>
    </section>
  );
}

// Owner-only team seats: mint/copy invite codes, see who's in (5 seats total).
function TeamPanel({ businessId }: { businessId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc("business_team", { p_business_id: businessId });
    setTeam((data as Team) ?? null);
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!team) return null;
  const openCodes = team.codes.filter((c) => !c.redeemed);
  const canMint = team.seats_used + openCodes.length < team.seats_total;

  const mint = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.rpc("generate_business_invite", { p_business_id: businessId });
    await load();
    setBusy(false);
  };

  return (
    <div className="border-t-2 border-dashed border-black/15 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wide">
          Team access · {team.seats_used} of {team.seats_total} seats
        </h3>
        <button
          type="button"
          onClick={mint}
          disabled={!canMint || busy}
          title={canMint ? "Create an invite code" : "All seats are taken"}
          className="border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide shadow-hard transition-transform hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? "…" : "+ Invite code"}
        </button>
      </div>
      {(team.members.length > 0 || openCodes.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
          {team.members.map((m) => (
            <span key={m.email} className="border-2 border-black bg-[var(--sand)] px-2 py-1">
              👤 {m.email}
            </span>
          ))}
          {openCodes.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => navigator.clipboard?.writeText(c.code)}
              title="Copy code"
              className="border-2 border-dashed border-black bg-white px-2 py-1 font-mono hover:bg-[var(--sand)]"
            >
              🎟 {c.code} ⧉
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] font-bold text-black/40">
        Send a code to a teammate — they create their own login at this page and
        redeem it. Codes are single-use.
      </p>
    </div>
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
