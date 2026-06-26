import Link from "next/link";
import { brand } from "@/config/branding";
import { defaultCourse } from "@/config/courses";
import { BucketLogo } from "@/components/icons";

/**
 * Landing page.
 *
 * One clear primary action (Start a round) carried by the boldest element on
 * screen, with the course preview as a quieter secondary. Vertically centered
 * so it doesn't feel top-heavy.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-6">
        <BucketLogo className="h-28 w-28 drop-shadow-sm" />

        <div className="space-y-1">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-brand-ink">
            {brand.name}
          </h1>
          <p className="text-lg font-medium text-brand-stone">
            {brand.tagline}
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          {/* Primary action — the boldest thing on the screen. */}
          <Link
            href="/start"
            className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-primary px-6 py-4 text-xl font-extrabold text-white shadow-lg shadow-brand-primary/25 active:bg-brand-deepPine"
          >
            Start a round
          </Link>

          {/* Secondary action — quieter, never out-weighs the primary. */}
          <Link
            href="/course"
            className="tap-target flex w-full items-center justify-center rounded-2xl border-2 border-brand-line bg-brand-card px-6 font-bold text-brand-deepPine active:bg-brand-cream"
          >
            See {defaultCourse.name} →
          </Link>
        </div>

        <p className="max-w-[18rem] text-sm font-medium text-brand-stone">
          Grab a club, pick your crew, and chase the bucket. No app store, no
          sign-up — just tap and play.
        </p>
      </div>

      <footer className="mt-12 text-sm">
        {/* Small umbrella-brand credit only — Holey Buckets is the identity. */}
        <p className="font-semibold text-brand-stone">{brand.umbrellaCredit}</p>
      </footer>
    </main>
  );
}
