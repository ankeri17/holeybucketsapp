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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
