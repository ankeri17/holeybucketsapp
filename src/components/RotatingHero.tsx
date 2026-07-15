"use client";

import { useEffect, useState } from "react";

/**
 * A decorative hero banner that crossfades through a set of photos on its own.
 *
 * Purely a backdrop — unlike the per-hole <TappablePhoto>, this one does NOT
 * open full-size; the course name sits on top of it and it's just a mood
 * setter. Honors prefers-reduced-motion (stays on the first photo, no motion),
 * and degrades to a single still image when given only one.
 */
export function RotatingHero({
  images,
  alt,
  intervalMs = 4500,
}: {
  /** Already-deduped, render-ready photo URLs. First one shows on load. */
  images: string[];
  /** Describes the course for screen readers (the visible name is a separate <h1>). */
  alt: string;
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % images.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          aria-hidden={i === 0 ? undefined : true}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
