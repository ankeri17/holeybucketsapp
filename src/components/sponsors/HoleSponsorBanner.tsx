import { SponsorLink, SponsorLogo } from "./SponsorLogo";
import type { Sponsor } from "@/lib/types";

/**
 * A hole's sponsor as a tappable banner — the sponsor's logo, or their name in
 * the app's bold display type when there's no logo.
 *
 * Shown on the scoring screen under the hole header, so the crew playing that
 * hole can tap straight through to the sponsor. Hole sponsors previously showed
 * as plain, un-tappable text there; this gives them the same tappable treatment
 * digital sponsors already get (see DigitalSponsorSlot). It's a link only when
 * the sponsor has a website — otherwise it's a plain credit — because that
 * decision lives in SponsorLink, which also normalizes the URL to absolute.
 */
export function HoleSponsorBanner({ sponsor }: { sponsor: Sponsor }) {
  return (
    <SponsorLink
      sponsor={sponsor}
      className="mt-3 flex min-h-[60px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-brand-line bg-brand-card px-4 py-3 shadow-sm"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-stone">
        This hole sponsored by
      </span>
      <SponsorLogo sponsor={sponsor} className="max-h-10 max-w-full" />
    </SponsorLink>
  );
}
