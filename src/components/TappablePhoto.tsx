"use client";

import { useEffect, useState } from "react";

/**
 * A photo that opens full-size in a modal when tapped.
 *
 * Course photos render as small thumbnails (or a cropped hero), so this gives
 * players a way to actually *see* a tee shot before walking to it. The modal
 * closes on backdrop tap, the Close button, or Escape — whichever the player
 * reaches first.
 */
export function TappablePhoto({
  src,
  alt,
  caption,
  className,
  buttonClassName = "block w-full cursor-zoom-in",
}: {
  src: string;
  alt: string;
  /** Shown under the full-size photo (e.g. "Hole 4 — The Ravine"). */
  caption?: string;
  /** Classes for the thumbnail <img> itself. */
  className?: string;
  /** Classes for the tappable wrapper (defaults to a full-width block). */
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  // While the modal is up: Escape closes it, and the page behind must not
  // scroll (otherwise the sticky CTA and list scroll under a frozen photo).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName}
        aria-label={caption ? `View photo: ${caption}` : `View photo: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={caption ?? alt}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          {caption && (
            <p className="mt-3 max-w-sm text-center font-semibold text-white">
              {caption}
            </p>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="tap-target mt-4 rounded-2xl bg-white/15 px-8 font-bold text-white active:bg-white/25"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
