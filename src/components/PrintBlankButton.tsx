"use client";

import { downloadBlankScorecard } from "@/lib/pdf";
import type { Course } from "@/lib/types";

/**
 * A button that generates and downloads a blank, printable scorecard for the
 * course — print it and fill it in by hand before a round. Client-side so it
 * can trigger the (dynamically-loaded) PDF generator on tap.
 */
export function PrintBlankButton({ course }: { course: Course }) {
  return (
    <button
      type="button"
      onClick={() => downloadBlankScorecard(course)}
      className="tap-target flex w-full items-center justify-center rounded-2xl border-2 border-brand-line bg-brand-card px-6 font-bold text-brand-deepPine active:bg-brand-cream"
    >
      Print a blank scorecard (PDF)
    </button>
  );
}
