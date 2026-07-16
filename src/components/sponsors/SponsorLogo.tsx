"use client";

import { useState } from "react";
import { sponsorHref } from "@/lib/sponsors";
import type { Sponsor } from "@/lib/types";

/**
 * A sponsor's logo, with the house guarantee: a missing or broken logo file
 * NEVER breaks a screen — it falls back to the sponsor's name as styled text.
 */
export function SponsorLogo({
  sponsor,
  className = "max-h-8",
}: {
  sponsor: Sponsor;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!sponsor.logoUrl || broken) {
    return (
      <span className="font-display font-bold text-brand-ink">
        {sponsor.name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sponsor.logoUrl}
      alt={sponsor.name}
      onError={() => setBroken(true)}
      className={`w-auto object-contain ${className}`}
    />
  );
}

/**
 * Wraps a placement in the sponsor's website link when they have one (new tab,
 * `rel="noopener noreferrer"`), or renders it as-is when they don't. The URL is
 * normalized to absolute via sponsorHref, so a bare hostname from the tracker
 * ("shophappens.com") never resolves as a relative in-app path.
 * A future click-tracking hook belongs here — one place, every placement.
 */
export function SponsorLink({
  sponsor,
  className,
  children,
}: {
  sponsor: Sponsor;
  className?: string;
  children: React.ReactNode;
}) {
  const href = sponsorHref(sponsor.website);
  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit sponsor ${sponsor.name}`}
      className={className}
    >
      {children}
    </a>
  );
}
