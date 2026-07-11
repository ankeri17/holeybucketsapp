import Link from "next/link";

/**
 * How To Play page.
 *
 * The house rules, written the way you'd hear them at the clubhouse. Kept as a
 * short numbered list — this is a "read it once on your phone while your crew
 * signs in" page, not a rulebook. Scoring language ("chip in", "-1 bonus")
 * matches src/lib/scoring.ts so the rules and the scorecard never disagree.
 */

const RULES: { title: string; detail: string }[] = [
  {
    title: "Sign in at the clubhouse",
    detail:
      "First come, first served. Grab a drink — and be sure to bring your trash to the cans at the turn or the clubhouse.",
  },
  {
    title: "Tee off",
    detail:
      "Use the clubs and balls we provide, or bring your own as long as they're approved.",
  },
  {
    title: "Extra balls are $5",
    detail: "If you lose one, replacements are available at the clubhouse.",
  },
  {
    title: "Extra tees are $1",
    detail: "If you bust one, grab another at the clubhouse.",
  },
  {
    title: "Hit the bucket or chip in for a bonus",
    detail:
      "Land it in the bucket or chip in and take −1 off your score for the hole.",
  },
];

export default function HowToPlayPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-6">
      <Link
        href="/"
        className="text-sm font-semibold text-brand-stone hover:text-brand-ink"
      >
        ← Home
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink">
          How to play
        </h1>
        <p className="mt-1 font-medium text-brand-stone">
          Five things to know before you tee off.
        </p>
      </header>

      <ol className="mt-6 space-y-3">
        {RULES.map((rule, i) => (
          <li
            key={rule.title}
            className="flex gap-3 rounded-2xl border border-brand-line bg-brand-card p-4 shadow-sm"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-extrabold text-white shadow">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-display font-bold text-brand-ink">
                {rule.title}
              </p>
              <p className="mt-0.5 text-sm text-brand-stone">{rule.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-brand-stone">
        That&apos;s it — everything else is just backyard golf. Have fun out
        there.
      </p>

      {/* Sticky start CTA — reading the rules shouldn't be a dead end.
          Bottom padding respects the iPhone home-indicator safe area. */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-brand-line bg-brand-cream/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link
          href="/start"
          className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-primary px-6 text-lg font-extrabold text-white active:bg-brand-deepPine"
        >
          Start a round →
        </Link>
      </div>
    </main>
  );
}
