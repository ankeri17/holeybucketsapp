import type { Metadata } from "next";

/**
 * The admin area is unlisted: nothing links to it, and this metadata asks
 * search engines not to index it. The only "login" is knowing the full URL
 * (see adminKey in src/config/sheets.ts).
 */
export const metadata: Metadata = {
  title: "Course Admin — Holey Buckets",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
