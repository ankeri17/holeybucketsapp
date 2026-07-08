import { getSponsors } from "@/config/sponsors";
import { holeSponsor } from "@/lib/sponsors";
import { SponsorLink, SponsorLogo } from "./SponsorLogo";

/**
 * "Hole presented by …" — the hole sponsor's small band on the scoring screen.
 *
 * Deliberately quiet: it sits under the hole header, clearly secondary to
 * score entry, and renders nothing at all when the hole has no active sponsor
 * (no empty frames, ever).
 */
export function HoleSponsorBand({
  courseId,
  holeNumber,
}: {
  courseId: string;
  holeNumber: number;
}) {
  const sponsor = holeSponsor(getSponsors(courseId), holeNumber);
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
