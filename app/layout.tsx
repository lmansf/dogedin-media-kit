import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL } from "@/lib/supabase";
import TrackedLink from "@/components/TrackedLink";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
});

const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Advertise on Dogedin · Media kit",
  description:
    "Reach Dunedin, FL's dog owners where they actually hang out — the community site for the town's dogs. Audience, placements, and honest numbers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        {/* Sticky so the coral inquiry CTA stays on screen for the whole
            scroll — solid bg + z above the chart tooltips. */}
        <header className="sticky top-0 z-20 border-b-[3px] border-black bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-2xl">🐾</span>
              <div className="min-w-0">
                <p className="font-display text-lg font-extrabold leading-none sm:text-xl">
                  Dogedin media kit
                </p>
                <p className="truncate text-[11px] font-black uppercase tracking-wide text-black/50">
                  Advertise to Dunedin&apos;s dog people
                </p>
              </div>
            </div>
            <TrackedLink
              placement="header"
              href={`${SITE_URL}/advertise`}
              className="inline-flex min-h-11 shrink-0 items-center border-[3px] border-black bg-[var(--coral)] px-3 py-1.5 text-xs font-black uppercase tracking-wide shadow-hard transition-transform hover:-translate-y-0.5"
            >
              <span className="hidden sm:inline">Start an&nbsp;</span>Inquiry →
            </TrackedLink>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t-[3px] border-black bg-white">
          <p className="mx-auto max-w-4xl px-4 py-4 text-xs font-bold text-black/50">
            All numbers are live community aggregates — no advertiser&apos;s
            individual results are ever shown here. 🏴 Dunedin, FL.
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
