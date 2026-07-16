import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/config/branding";
import { courses, getCourse } from "@/config/courses";
import { LogoLockup } from "@/components/icons";
import { ResumeRoundButton } from "@/components/ResumeRoundButton";
import { DigitalSponsorSlot } from "@/components/sponsors/DigitalSponsorSlot";
import { ConfettiBackdrop } from "@/components/ConfettiBackdrop";

/**
 * Course home — the per-course welcome screen.
 *
 * This is where "Find your course" on the landing page lands you: the screen a
 * group standing at a course opens to get going. One clear primary action
 * (Start a round) carried by the boldest element on screen, with the rules and
 * course preview as quieter secondaries — the same shape the site-wide landing
 * page had before it went course-agnostic.
 *
 * Course-aware but never course-specific: the course comes from the registry
 * by URL id, and every registered course gets this page prebuilt via
 * generateStaticParams. Unknown ids 404.
 *
 * NOTE (Phase 2): /start and /course still operate on the app's default
 * course. Today the registry holds exactly one course, so the links below
 * always agree with the course shown; when a second course registers, those
 * two routes need the course id threaded through before this page can link
 * them per-course.
 */

export function generateStaticParams() {
  return courses.map((course) => ({ courseId: course.id }));
}

export function generateMetadata({
  params,
}: {
  params: { courseId: string };
}): Metadata {
  const course = getCourse(params.courseId);
  if (!course) return {};
  return {
    title: `${course.name} — ${brand.name}`,
    description: `Play ${brand.name} at ${course.name} in ${course.location}. Start a round and keep score on your phone.`,
  };
}

export default function CourseHomePage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = getCourse(params.courseId);
  if (!course) notFound();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center overflow-hidden px-6 py-6 text-center">
      <ConfettiBackdrop />

      {/* The way back to the site-wide landing / course list. */}
      <Link
        href="/"
        className="relative z-10 self-start text-sm font-semibold text-brand-stone hover:text-brand-ink"
      >
        ← All courses
      </Link>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <div className="flex flex-col items-center">
          <LogoLockup markClassName="h-24 w-24" />
          {/* The course you're standing at, front and center. */}
          <p className="mt-3 font-display text-xl font-bold text-brand-ink">
            {course.name}
          </p>
          <p className="text-sm font-medium text-brand-stone">
            {course.location}
            {course.host ? ` · Hosted by ${course.host}` : ""}
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          {/* If a round is in progress on this phone, the way back in comes
              first — nobody should lose their group's scores to a locked
              screen. Renders nothing when there's no active round. */}
          <ResumeRoundButton />

          {/* Primary action — the boldest thing on the screen. */}
          <Link
            href="/start"
            className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-primary px-6 py-4 text-xl font-extrabold text-white shadow-lg shadow-brand-primary/25 active:bg-brand-deepPine"
          >
            Start a round
          </Link>

          {/* Secondary actions — quieter, never out-weigh the primary. */}
          <Link
            href="/how-to-play"
            className="tap-target flex w-full items-center justify-center rounded-2xl border-2 border-brand-line bg-brand-card px-6 font-bold text-brand-deepPine active:bg-brand-cream"
          >
            How to play
          </Link>
          <Link
            href="/course"
            className="tap-target flex w-full items-center justify-center rounded-2xl border-2 border-brand-line bg-brand-card px-6 font-bold text-brand-deepPine active:bg-brand-cream"
          >
            See {course.name} →
          </Link>
        </div>

        <p className="max-w-[18rem] text-sm font-medium text-brand-stone">
          Grab a club, pick your crew, and chase the bucket. No app store, no
          sign-up — just tap and play.
        </p>

        {/* One rotating digital-sponsor slot — a different active sponsor can
            come up on each visit. Renders nothing when none are active. */}
        <DigitalSponsorSlot courseId={course.id} />
      </div>

      <footer className="relative z-10 mt-6 text-sm">
        {/* Small umbrella-brand credit only — Holey Buckets is the identity. */}
        <p className="font-semibold text-brand-stone">{brand.umbrellaCredit}</p>
      </footer>
    </main>
  );
}
