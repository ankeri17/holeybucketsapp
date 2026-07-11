"use client";

import { activeHoleSponsors } from "@/lib/sponsors";
import { useLiveSponsors } from "@/lib/liveData";

/**
 * Hole-sponsor credits under the scorecard grid, footnote style:
 * "Hole 7 presented by Osceola Hardware". The grid's columns are too tight
 * for logos at phone width, and a text footnote prints cleanly — the PDF
 * renders the same line (see src/lib/pdf.ts). Sponsors come live from the
 * connected Google Sheet, with the bundled config as the fallback. Renders
 * nothing when no hole has an active sponsor.
 */
export function ScorecardSponsorRow(_props: { courseId: string }) {
  const { sponsors } = useLiveSponsors();
  const holeSponsors = activeHoleSponsors(sponsors);
  if (holeSponsors.length === 0) return null;

  return (
    <p className="px-1 text-xs text-brand-stone">
      {holeSponsors
        .map((s) => `Hole ${s.holeNumber} presented by ${s.name}`)
        .join(" · ")}
    </p>
  );
}
