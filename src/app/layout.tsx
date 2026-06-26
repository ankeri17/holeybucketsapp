import type { Metadata, Viewport } from "next";
import { brand } from "@/config/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: `The official digital companion to ${brand.name}. Score a round on your phone or print a scorecard.`,
};

export const viewport: Viewport = {
  themeColor: brand.colors.primary,
  width: "device-width",
  initialScale: 1,
  // Lock zoom so the scoring screen feels like an app, not a web page.
  maximumScale: 1,
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
    <html lang="en" style={cssTokens}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
