"use client";

import { holeSponsor } from "@/lib/sponsors";
import { useLiveSponsors } from "@/lib/liveData";
import { SponsorLink, SponsorLogo } from "./SponsorLogo";

/**
 * "Hole presented by …" — the hole sponsor's small band on the scoring screen.
 *
 * Deliberately quiet: it sits under the hole header, clearly secondary to
 * score entry, and renders nothing at all when the hole has no active sponsor
 * (no empty frames, ever). Sponsors come live from the sponsor sheet when one
 * is connected, from src/config/sponsors/ otherwise (see src/lib/liveData.ts).
 */
export function HoleSponsorBand({
  courseId,
  holeNumber,
}: {
  courseId: string;
  holeNumber: number;
}) {
  const sponsor = holeSponsor(useLiveSponsors(courseId).sponsors, holeNumber);
  if (!sponsor) return null;

  return (
    <aside className="mt-2">
      <SponsorLink
        sponsor={sponsor}
        className="flex min-h-[44px] items-center justify-center gap-3 rounded-xl border border-brand-line bg-brand-card px-4 py-2"
      >
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Hole presented by
        </span>
        <SponsorLogo sponsor={sponsor} className="max-h-7" />
      </SponsorLink>
    </aside>
  );
}
