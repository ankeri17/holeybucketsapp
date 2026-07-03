import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { brand } from "@/config/branding";
import "./globals.css";

// Two fonts only (per the type kit):
//   Display — Bricolage Grotesque: wordmark, titles, hole/player names, wins.
//   Text/UI — Figtree: body, buttons, labels, scores, leaderboard.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});
const text = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-text",
  display: "swap",
});

const description = `The official digital companion to ${brand.name}. Score a round on your phone or print a scorecard.`;

export const metadata: Metadata = {
  // metadataBase lets the Open Graph url resolve; siteUrl is the same address
  // printed on the share card (repoint it in branding.ts when the real
  // domain is live).
  metadataBase: new URL(`https://${brand.siteUrl}`),
  title: `${brand.name} — ${brand.tagline}`,
  description,
  // Link previews in Messages/Slack/socials. No og:image yet — add a raster
  // card (1200×630) once the real course photos arrive.
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description,
    url: "/",
    siteName: brand.name,
    type: "website",
  },
};

// No maximum-scale lock: pinch-zoom must stay available (low-vision players
// rely on it, and iOS ignores the lock anyway). viewport-fit=cover lets the
// sticky bottom bars pad themselves around the iPhone home indicator
// (env(safe-area-inset-bottom)).
export const viewport: Viewport = {
  themeColor: brand.colors.primary,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Publish the brand palette as CSS custom properties, derived from the one
// config file (src/config/branding.ts) so tokens and Tailwind never drift.
const c = brand.colors;
const cssTokens = {
  "--fairway-green": c.primary,
  "--deep-pine": c.deepPine,
  "--sunshine": c.sunshine,
  "--bucket-blue": c.bucketBlue,
  "--canvas-cream": c.cream,
  "--card-white": c.card,
  "--ink": c.ink,
  "--stone": c.stone,
  "--line": c.line,
  "--penalty-clay": c.penalty,
} as React.CSSProperties;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      style={cssTokens}
      className={`${display.variable} ${text.variable}`}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
