import Link from "next/link";
import { brand } from "@/config/branding";
import { defaultCourse } from "@/config/courses";

/**
 * Landing page (Milestone 1).
 *
 * This is intentionally a near-empty, branded placeholder. Its job right now is
 * to prove the deploy pipeline works end-to-end (push -> Netlify -> live URL).
 * The real flows (start a round, scoring, leaderboard, results, PDF) land in
 * the next milestones.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-between px-6 py-10 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        {/* Logo placeholder — swap for the real Holey Buckets mark later. */}
        <div
          aria-hidden
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-primary text-5xl shadow-lg"
        >
          🪣
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-ink">
            {brand.name}
          </h1>
          <p className="text-lg font-medium text-brand-ink/70">
            {brand.tagline}
          </p>
        </div>

        <div className="w-full space-y-3 pt-4">
          <Link
            href="/start"
            className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-primary px-6 text-lg font-bold text-white"
          >
            Start a round
          </Link>

          {/* Preview the course, loaded from config. */}
          <Link
            href="/course"
            className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-accent px-6 text-lg font-bold text-brand-ink"
          >
            See the {defaultCourse.location} course →
          </Link>
        </div>
      </div>

      <footer className="space-y-1 pt-8 text-sm text-brand-ink/60">
        {/* Small umbrella-brand credit only — Holey Buckets is the identity. */}
        <p className="font-semibold text-brand-ink/70">{brand.umbrellaCredit}</p>
      </footer>
    </main>
  );
}
