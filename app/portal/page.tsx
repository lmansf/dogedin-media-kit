import type { Metadata } from "next";
import PortalApp from "@/components/portal/PortalApp";

export const metadata: Metadata = {
  title: "Business portal · Dogedin",
  description:
    "Sign in to see how your listing performs with Dunedin's dog people — views, taps, calls, and review benchmarks.",
  // A private, login-gated tool — no reason for it to rank.
  robots: { index: false },
};

export default function PortalPage() {
  return <PortalApp />;
}
