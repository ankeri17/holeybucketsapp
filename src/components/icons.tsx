/**
 * Custom flat icons for Holey Buckets.
 *
 * These replace emoji (which render differently on every phone and read as
 * generic). They're simple, flat, 2-color SVGs. The small UI icons use
 * `currentColor` so they adopt their button's text color; the logo mark uses
 * the brand tokens directly so it's always on-brand.
 */

import { brand } from "@/config/branding";

/**
 * The full logo lockup: the bucket mark integrated with the wordmark as one
 * unit (the mark overlaps the top of the wordmark so they read as designed
 * together, not two stacked elements).
 */
export function LogoLockup({
  className,
  markClassName = "h-20 w-20",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <BucketLogo className={`${markClassName} drop-shadow-sm`} />
      <span className="-mt-2 text-center font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-brand-ink">
        {brand.name}
      </span>
    </div>
  );
}

/**
 * The Holey Buckets logo mark: a bucket with a golf flag planted in it and a
 * ball arcing in.
 *
 * `onDark` flips the palette for dark/green surfaces (results hero, share
 * card): the bucket body goes white and the pole goes white — the default
 * green-bodied bucket disappears against the green panels it sits on.
 */
export function BucketLogo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const body = onDark ? "#ffffff" : "var(--fairway-green)";
  const pole = onDark ? "#ffffff" : "var(--deep-pine)";
  const ball = onDark ? "var(--sunshine)" : "var(--bucket-blue)";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {/* flag pole, planted inside the bucket (bucket drawn over its base) */}
      <line
        x1="30"
        y1="23"
        x2="30"
        y2="5.5"
        stroke={pole}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* flag */}
      <path d="M31 4.5 L42.5 8.25 L31 12 Z" fill="var(--penalty-clay)" />
      {/* arc / ball trajectory into the bucket */}
      <path
        d="M6 27 Q 12 8 20 11.5"
        fill="none"
        stroke="var(--sunshine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
      {/* ball */}
      <circle cx="21.5" cy="12" r="3.2" fill={ball} />
      {/* bucket body */}
      <path d="M11 22 L37 22 L33 42 Q24 45 15 42 Z" fill={body} />
      {/* bucket rim (opening) */}
      <ellipse cx="24" cy="22" rx="13" ry="3.6" fill="var(--deep-pine)" />
    </svg>
  );
}

/** Chip-in bonus icon: a ball dropping into a bucket. */
export function ChipInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* ball + drop arrow */}
      <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
      <path d="M12 8 v3 m0 0 l-2 -2 m2 2 l2 -2" opacity="0.6" />
      {/* bucket */}
      <path d="M6 12 h12 l-1.5 8 a8 8 0 0 1 -9 0 Z" />
      <ellipse cx="12" cy="12" rx="6" ry="1.6" opacity="0.6" />
    </svg>
  );
}

/** Foliage penalty icon: a little bush. */
export function FoliageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* leafy cluster */}
      <circle cx="8" cy="11" r="4" />
      <circle cx="15" cy="9" r="4.5" />
      <circle cx="16" cy="14" r="3.6" opacity="0.6" />
      {/* stem */}
      <rect x="11" y="14" width="2" height="7" rx="1" opacity="0.6" />
    </svg>
  );
}
