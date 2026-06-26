import Link from "next/link";
import { brand } from "@/config/branding";
import { defaultCourse } from "@/config/courses";
import { LogoLockup } from "@/components/icons";

/**
 * Landing page.
 *
 * One clear primary action (Start a round) carried by the boldest element on
 * screen, with the course preview as a quieter secondary. Vertically centered
 * so it doesn't feel top-heavy.
 */
export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center overflow-hidden px-6 py-10 text-center">
      {/* Confetti motif — backyard-party energy, behind the content. Yellow
          stays a confetti accent here, never a competing button. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute left-9 top-24 h-3 w-3 rounded-full bg-brand-sunshine" />
        <span className="absolute right-12 top-16 h-2.5 w-2.5 rounded-full bg-brand-bucketBlue" />
        <span className="absolute left-20 top-40 h-2 w-2 rounded-full bg-brand-penalty" />
        <span className="absolute right-16 top-44 h-3 w-3 rounded-full bg-brand-sunshine/80" />
        <span className="absolute left-1/2 top-10 h-2 w-2 rounded-full bg-brand-penalty/70" />
        <span className="absolute right-24 top-1/3 h-2 w-2 rounded-full bg-brand-bucketBlue/70" />
        <span className="absolute left-12 top-1/2 h-2.5 w-2.5 rounded-full bg-brand-sunshine/70" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <LogoLockup markClassName="h-24 w-24" />
          <p className="mt-2 text-lg font-medium text-brand-stone">
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

      <footer className="relative z-10 mt-12 text-sm">
        {/* Small umbrella-brand credit only — Holey Buckets is the identity. */}
        <p className="font-semibold text-brand-stone">{brand.umbrellaCredit}</p>
      </footer>
    </main>
  );
}
