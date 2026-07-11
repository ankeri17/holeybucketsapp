"use client";

import { useEffect, useState } from "react";
import { activeDigitalSponsors } from "@/lib/sponsors";
import { useLiveSponsors } from "@/lib/liveData";
import { SponsorLink, SponsorLogo } from "./SponsorLogo";
import type { Sponsor } from "@/lib/types";

/**
 * The rotating digital-sponsor slot (home + results screens).
 *
 * Rotation is per page load: each visit picks one active digital sponsor at
 * random, so every sponsor gets fair exposure without any on-screen motion.
 * The pick happens on mount (client-side) — a statically prerendered page
 * would otherwise bake one sponsor in forever. Sponsors come live from the
 * connected Google Sheet, with the bundled config as the fallback. Renders
 * nothing when there are no active digital sponsors.
 */
export function DigitalSponsorSlot(_props: { courseId: string }) {
  const { sponsors } = useLiveSponsors();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    const pool = activeDigitalSponsors(sponsors);
    setSponsor(
      pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null,
    );
  }, [sponsors]);

  if (!sponsor) return null;

  return (
    <aside className="w-full">
      {/* Label stacked ABOVE the logo (founder request, 2026-07-11) so a wide
          wordmark gets the card's full width, with a taller card to match. */}
      <SponsorLink
        sponsor={sponsor}
        className="flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border border-brand-line bg-brand-card px-4 py-3"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Sponsor
        </span>
        <SponsorLogo sponsor={sponsor} className="max-h-10 max-w-full" />
      </SponsorLink>
    </aside>
  );
}
