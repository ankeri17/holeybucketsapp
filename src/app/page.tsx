import Link from "next/link";
import { brand } from "@/config/branding";
import { courses } from "@/config/courses";
import { coursePar } from "@/lib/course";
import { LogoLockup } from "@/components/icons";
import { ResumeRoundButton } from "@/components/ResumeRoundButton";
import { ConfettiBackdrop } from "@/components/ConfettiBackdrop";

/**
 * Landing page — the friendly front door of the whole site.
 *
 * Deliberately NOT course-specific: it answers "what is this?" for someone who
 * just followed a share card or heard about bucket golf, then routes players to
 * their course. Three jobs, in order: (1) what Holey Buckets / bucket golf is,
 * (2) the 30-second version of how to play and score, (3) find your course —
 * every course in the registry gets a card linking to its own home at
 * /courses/<id>, where the round starts.
 *
 * The house rules at /how-to-play are course-flavored (ball prices, where the
 * clubhouse is), so they are deliberately NOT linked from here — each course
 * home links them instead. (Founder note, 2026-07-16: house rules should
 * become course-configurable data eventually.)
 *
 * Scoring language here ("chip in", "−1", "+1") matches src/lib/scoring.ts so
 * the pitch and the scorecard never disagree.
 */
export default function Home() {
  return (
    <main className="relative mx-auto min-h-screen max-w-md overflow-hidden px-5 pb-10 pt-10">
      <ConfettiBackdrop />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Hero — who we are, plus one clear action for someone ready to play. */}
        <header className="flex flex-col items-center text-center">
          <LogoLockup markClassName="h-24 w-24" />
          <p className="mt-2 text-lg font-medium text-brand-stone">
            {brand.tagline}
          </p>

          <div className="mt-6 w-full space-y-3">
            {/* If a round is in progress on this phone, the way back in comes
                first — nobody should lose their group's scores to a locked
                screen. Renders nothing when there's no active round. */}
            <ResumeRoundButton />

            {/* Primary action — jumps to the course list below. */}
            <a
              href="#find-your-course"
              className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-primary px-6 py-4 text-xl font-extrabold text-white shadow-lg shadow-brand-primary/25 active:bg-brand-deepPine"
            >
              Find your course
            </a>
          </div>
        </header>

        {/* What is Holey Buckets? */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            What is Holey Buckets?
          </h2>
          <div className="mt-2 space-y-3 rounded-2xl border border-brand-line bg-brand-card p-4 shadow-sm">
            <p className="font-display text-xl font-bold leading-snug text-brand-ink">
              Bucket golf: a bit like golf, shrunk down to backyard size.
            </p>
            <p className="text-sm text-brand-stone">
              You swing a modified club at a wiffle ball, aiming for a bucket
              instead of a hole — and the bucket&apos;s never too far away. No
              dress code, no experience needed: anyone can play and enjoy it.
            </p>
            <p className="text-sm text-brand-stone">
              Holey Buckets is the game&apos;s digital companion: keep score on
              your phone and share the bragging rights after. No app store, no
              sign-up — just tap and play.
            </p>
          </div>
        </section>

        {/* How to play — the 30-second version; the house rules page has the rest. */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            How to play
          </h2>
          <ol className="mt-2 space-y-3">
            {HOW_TO_PLAY.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-2xl border border-brand-line bg-brand-card p-4 shadow-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-extrabold text-white shadow">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-brand-ink">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm text-brand-stone">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Find your course — one card per registered course. When new
            locations join the registry (src/config/courses/index.ts) they
            appear here automatically; nothing on this page names a course. */}
        <section id="find-your-course" className="scroll-mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            Find your course
          </h2>
          <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-brand-ink">
            Pick a spot, play a round
          </p>
          <div className="mt-3 space-y-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-brand-primary/40 bg-brand-card p-4 shadow-sm active:bg-brand-cream"
              >
                <span className="min-w-0">
                  <span className="block font-display text-xl font-extrabold text-brand-ink">
                    {course.name}
                  </span>
                  <span className="block text-sm font-medium text-brand-stone">
                    {course.location}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
                    {course.holes.length} holes · par {coursePar(course)}
                  </span>
                </span>
                <span className="shrink-0 text-xl font-bold text-brand-primary">
                  →
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-brand-stone">
            More locations are on the way.
          </p>
        </section>

        <footer className="mt-2 text-center text-sm">
          {/* Small umbrella-brand credit only — Holey Buckets is the identity. */}
          <p className="font-semibold text-brand-stone">
            {brand.umbrellaCredit}
          </p>
        </footer>
      </div>
    </main>
  );
}

/**
 * The 30-second pitch of the game (founder's wording, 2026-07-16: hitting the
 * bucket finishes the hole — you don't need to chip it in, but chipping it in
 * earns the bonus). Rule numbers must agree with src/lib/scoring.ts (chip into
 * the bucket = −1, each penalty = +1).
 */
const HOW_TO_PLAY: { title: string; detail: string }[] = [
  {
    title: "Tee off toward the bucket",
    detail:
      "Chip your wiffle ball from the tee toward the bucket. Every swing counts as a stroke.",
  },
  {
    title: "Hit the bucket to finish the hole",
    detail:
      "Any hit ends the hole — you don't need to sink it. Chip it all the way in and take −1 off your score.",
  },
  {
    title: "Fewest strokes wins",
    detail:
      "Add up your strokes across the round — the lowest total takes it. Foliage, water, or out of bounds costs +1 each.",
  },
];
