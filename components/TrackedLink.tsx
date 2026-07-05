"use client";

import type { ReactNode } from "react";
import { track } from "@vercel/analytics";

// The inquiry CTAs live in server components, so this tiny client anchor
// exists only to fire the Vercel Analytics conversion event on click.
// `placement` says WHICH CTA earned the click (header / hero / mid_page /
// closing / mailto) — that's the whole funnel report for this one-pager.
export default function TrackedLink({
  placement,
  href,
  className,
  children,
}: {
  placement: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track("inquiry_click", { placement })}
    >
      {children}
    </a>
  );
}
