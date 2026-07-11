import Link from "next/link";
import { defaultCourse } from "@/config/courses";
import { holePar, coursePar, courseYards } from "@/lib/course";
import { PrintBlankButton } from "@/components/PrintBlankButton";

/** Fallback tee thumbnail when a hole has no photo yet (generic, any course). */
const TEE_PLACEHOLDER = "/placeholder-tee.svg";

/**
 * Course preview page.
 *
 * Renders the active course straight from config (src/config/courses/) — the
 * visible proof that "course as data" works. Hero image, per-hole tee photos,
 * and difficulty come from the course/worksheet data; photos are placeholders
 * until the real ones are dropped in.
 */
export default function CoursePage() {
  const course = defaultCourse;
  const total = course.holes.length;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-6">
      <Link
        href="/"
        className="text-sm font-semibold text-brand-stone hover:text-brand-ink"
      >
        ← Home
      </Link>

      {/* Hero image with the course name overlaid, or a text header as fallback */}
      {course.heroImage ? (
        <div className="relative mt-4 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.heroImage}
            alt={`${course.name}`}
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 p-4 text-white">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {course.name}
            </h1>
            <p className="text-sm font-medium opacity-90">
              {course.location}
              {course.host ? ` · Hosted by ${course.host}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <header className="mt-4">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink">
            {course.name}
          </h1>
          <p className="mt-1 font-medium text-brand-stone">{course.location}</p>
          {course.host && (
            <p className="mt-0.5 text-sm text-brand-stone">
              Hosted by {course.host}
            </p>
          )}
        </header>
      )}

      <div className="mt-4 flex gap-3">
        <Stat value={course.holes.length} label="holes" />
        <Stat value={coursePar(course)} label="par" />
        {courseYards(course) > 0 && (
          <Stat value={courseYards(course)} label="yards" />
        )}
      </div>

      {/* Course-wide notes from the owner worksheet (Course Info tab) */}
      {(course.startingTee || course.houseRules || course.outOfBounds) && (
        <div className="mt-4 space-y-1.5 rounded-2xl border border-brand-line bg-brand-card p-4 text-sm shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            Good to know
          </h2>
          {course.startingTee && (
            <p className="text-brand-ink">
              <span className="font-semibold">First tee: </span>
              {course.startingTee}
            </p>
          )}
          {course.houseRules && (
            <p className="text-brand-ink">
              <span className="font-semibold">House rule: </span>
              {course.houseRules}
            </p>
          )}
          {course.outOfBounds && (
            <p className="text-brand-ink">
              <span className="font-semibold text-brand-penalty">
                Out of bounds:{" "}
              </span>
              {course.outOfBounds}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 mb-6">
        <PrintBlankButton course={course} />
      </div>

      <ol className="space-y-3 tabular-nums">
        {course.holes.map((hole) => (
          <li
            key={hole.number}
            className="flex gap-3 rounded-2xl border border-brand-line bg-brand-card p-3 shadow-sm"
          >
            {/* Tee thumbnail with the hole number badged on it */}
            <div className="relative h-16 w-16 shrink-0">
              {/* lazy: 18 real photos would otherwise load at once on a phone */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hole.teePhoto ?? TEE_PLACEHOLDER}
                alt=""
                loading="lazy"
                className="h-16 w-16 rounded-xl object-cover"
              />
              <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs font-extrabold text-white shadow">
                {hole.number}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                {hole.name && (
                  <p className="truncate font-display font-bold text-brand-ink">
                    {hole.name}
                  </p>
                )}
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-stone">
                  Par {holePar(hole)}
                </span>
              </div>

              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-brand-stone">
                {hole.distanceYards != null && (
                  <span>{hole.distanceYards} yds</span>
                )}
                {/* Only the label gets the warning color — with 15 of 18
                    holes carrying a hazard, all-orange text made the whole
                    page read like an alarm. */}
                {hole.hazards && (
                  <span>
                    <span className="font-semibold text-brand-penalty">
                      Heads up:{" "}
                    </span>
                    {hole.hazards}
                  </span>
                )}
              </div>

              {hole.difficultyRank != null && (
                <DifficultyMeter rank={hole.difficultyRank} total={total} />
              )}

              {hole.note && (
                <p className="mt-1 text-sm italic text-brand-stone">
                  {hole.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Only shown while any hole still lacks a real photo — goes away by itself. */}
      {course.holes.some((hole) => !hole.teePhoto) && (
        <p className="mt-8 text-center text-xs text-brand-stone">
          Some tee photos are placeholders until the real ones are added.
        </p>
      )}

      {/* Sticky start CTA — browsing the course shouldn't be a dead end.
          Bottom padding respects the iPhone home-indicator safe area. */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-brand-line bg-brand-cream/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link
          href="/start"
          className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-primary px-6 text-lg font-extrabold text-white active:bg-brand-deepPine"
        >
          Start a round here →
        </Link>
      </div>
    </main>
  );
}

/** A small difficulty meter (5 pips) from a hole's difficultyRank (1 = hardest). */
function DifficultyMeter({ rank, total }: { rank: number; total: number }) {
  const level = Math.max(1, Math.min(5, Math.ceil(((total - rank + 1) / total) * 5)));
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-stone">
        Difficulty
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-3 rounded-full ${
              i <= level ? "bg-brand-penalty" : "bg-brand-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-brand-sunshine/30 px-4 py-2 text-center">
      <div className="text-xl font-extrabold leading-none text-brand-ink tabular-nums">
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
        {label}
      </div>
    </div>
  );
}
