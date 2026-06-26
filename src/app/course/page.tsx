import Link from "next/link";
import { defaultCourse } from "@/config/courses";
import { holePar, coursePar } from "@/lib/course";

/**
 * Course preview page (Milestone 2).
 *
 * This renders the active course straight from config (src/config/courses/).
 * It's the visible proof that "course as data" works: change the Osceola file
 * and this page changes, with nothing about Osceola hardcoded here.
 */
export default function CoursePage() {
  const course = defaultCourse;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      <Link
        href="/"
        className="text-sm font-semibold text-brand-ink/60 hover:text-brand-ink"
      >
        ← Home
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink">
          {course.name}
        </h1>
        <p className="mt-1 font-medium text-brand-ink/70">{course.location}</p>
        {course.host && (
          <p className="mt-0.5 text-sm text-brand-ink/55">
            Hosted by {course.host}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <Stat value={course.holes.length} label="holes" />
          <Stat value={coursePar(course)} label="par" />
        </div>
      </header>

      <ol className="space-y-3 tabular-nums">
        {course.holes.map((hole) => (
          <li
            key={hole.number}
            className="flex gap-3 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-brand-ink/5"
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-primary text-white">
              <span className="text-lg font-extrabold leading-none">
                {hole.number}
              </span>
              <span className="text-[10px] font-semibold uppercase opacity-80">
                par {holePar(hole)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              {hole.name && (
                <p className="font-display font-bold text-brand-ink">
                  {hole.name}
                </p>
              )}
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-brand-ink/70">
                {hole.distancePaces != null && (
                  <span>{hole.distancePaces} paces</span>
                )}
                {hole.hazards && (
                  <span className="font-semibold text-brand-penalty">
                    Heads up: {hole.hazards}
                  </span>
                )}
              </div>
              {hole.note && (
                <p className="mt-1 text-sm italic text-brand-ink/55">
                  {hole.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-brand-ink/40">
        Hole details are placeholders until the real Osceola layout is added.
      </p>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-brand-sunshine/30 px-4 py-2 text-center">
      <div className="text-xl font-extrabold leading-none text-brand-ink tabular-nums">
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-ink/60">
        {label}
      </div>
    </div>
  );
}
