"use client";

import { activeHoleSponsors } from "@/lib/sponsors";
import { useLiveSponsors } from "@/lib/liveData";

/**
 * Hole-sponsor credits under the scorecard grid, footnote style:
 * "Hole 7 presented by Osceola Hardware". The grid's columns are too tight
 * for logos at phone width, and a text footnote prints cleanly — the PDF
 * renders the same line (see src/lib/pdf.ts). Renders nothing when no hole
 * has an active sponsor. Sponsors come live from the sponsor sheet when one
 * is connected, from src/config/sponsors/ otherwise.
 */
export function ScorecardSponsorRow({ courseId }: { courseId: string }) {
  const sponsors = activeHoleSponsors(useLiveSponsors(courseId).sponsors);
  if (sponsors.length === 0) return null;

  return (
    <p className="px-1 text-xs text-brand-stone">
      {sponsors
        .map((s) => `Hole ${s.holeId} presented by ${s.name}`)
        .join(" · ")}
    </p>
  );
}
