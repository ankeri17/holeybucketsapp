"use client";

import { useEffect, useState } from "react";
import { getSponsors } from "@/config/sponsors";
import { activeDigitalSponsors } from "@/lib/sponsors";
import { SponsorLink, SponsorLogo } from "./SponsorLogo";
import type { Sponsor } from "@/lib/types";

/**
 * The rotating digital-sponsor slot (home + results screens).
 *
 * Rotation is per page load: each visit picks one active digital sponsor at
 * random, so every sponsor gets fair exposure without any on-screen motion.
 * The pick happens on mount (client-side) — a statically prerendered page
 * would otherwise bake one sponsor in forever. Renders nothing when there are
 * no active digital sponsors.
 */
export function DigitalSponsorSlot({ courseId }: { courseId: string }) {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    const pool = activeDigitalSponsors(getSponsors(courseId));
    if (pool.length > 0) {
      setSponsor(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [courseId]);

  if (!sponsor) return null;

  return (
    <aside className="w-full">
      <SponsorLink
        sponsor={sponsor}
        className="flex min-h-[44px] items-center justify-center gap-3 rounded-xl border border-brand-line bg-brand-card px-4 py-2"
      >
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Sponsor
        </span>
        <SponsorLogo sponsor={sponsor} className="max-h-7" />
      </SponsorLink>
    </aside>
  );
}
