"use client";

import { useState } from "react";
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
 * Wraps a placement in the sponsor's website link when they have one
 * (new tab, `rel="noopener"`), or renders it as-is when they don't.
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
  if (!sponsor.website) {
    return <span className={className}>{children}</span>;
  }
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noopener"
      aria-label={`Visit sponsor ${sponsor.name}`}
      className={className}
    >
      {children}
    </a>
  );
}
