import { getSponsors } from "@/config/sponsors";
import { activeHoleSponsors } from "@/lib/sponsors";

/**
 * Hole-sponsor credits under the scorecard grid, footnote style:
 * "Hole 7 presented by Osceola Hardware". The grid's columns are too tight
 * for logos at phone width, and a text footnote prints cleanly — the PDF
 * renders the same line (see src/lib/pdf.ts). Renders nothing when no hole
 * has an active sponsor.
 */
export function ScorecardSponsorRow({ courseId }: { courseId: string }) {
  const sponsors = activeHoleSponsors(getSponsors(courseId));
  if (sponsors.length === 0) return null;

  return (
    <p className="px-1 text-xs text-brand-stone">
      {sponsors
        .map((s) => `Hole ${s.holeId} presented by ${s.name}`)
        .join(" · ")}
    </p>
  );
}
