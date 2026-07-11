"use client";

import Link from "next/link";
import { holePar, coursePar } from "@/lib/course";
import { useLiveCourse, useLiveSponsors } from "@/lib/liveData";
import { activeSponsors, holeSponsors } from "@/lib/sheets";
import { PrintBlankButton } from "@/components/PrintBlankButton";

/** Fallback tee thumbnail when a hole has no photo yet (generic, any course). */
const TEE_PLACEHOLDER = "/placeholder-tee.svg";

/**
 * Course preview page.
 *
 * Renders the active course — live from the owner's Google Sheet when one is
 * connected (see src/config/sheets.ts), with the built-in config as the
 * always-works fallback. Hero image, per-hole tee photos, difficulty, and
 * sponsors all come from the course/worksheet data.
 */
export default function CoursePage() {
  const { course } = useLiveCourse();
  const { sponsors } = useLiveSponsors();

  if (!course) return null; // can't happen for the default course
  const unit = course.distanceUnit ?? "paces";
  const sponsorByHole = holeSponsors(sponsors);
  const thanks = activeSponsors(sponsors);

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
      </div>

      {/* Course-wide notes from the owner worksheet: where to start, what to
          avoid, house rules. Only shows when there's something to say. */}
      {(course.startingTee || course.outOfBounds || course.houseRules) && (
        <div className="mt-4 space-y-1.5 rounded-2xl border border-brand-line bg-brand-card p-4 text-sm text-brand-stone shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            Good to know
          </h2>
          {course.startingTee && (
            <p>
              <span className="font-semibold text-brand-ink">Start: </span>
              {course.startingTee}
            </p>
          )}
          {course.houseRules && (
            <p>
              <span className="font-semibold text-brand-ink">House rule: </span>
              {course.houseRules}
            </p>
          )}
          {course.outOfBounds && (
            <p>
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
        {course.holes.map((hole) => {
          const sponsor = sponsorByHole.get(hole.number);
          return (
            <li
              key={hole.number}
              className="flex gap-3 rounded-2xl border border-brand-line bg-brand-card p-3 shadow-sm"
            >
              {/* Tee thumbnail with the hole number badged on it */}
              <div className="relative h-16 w-16 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hole.teePhoto ?? TEE_PLACEHOLDER}
                  alt=""
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
                  {hole.distance != null && (
                    <span>
                      {hole.distance} {unit}
                    </span>
                  )}
                  {/* Only the label gets the warning color — with most holes
                      carrying a hazard, all-orange text made the whole page
                      read like an alarm. */}
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
                  <DifficultyMeter rank={hole.difficultyRank} />
                )}

                {hole.note && (
                  <p className="mt-1 text-sm italic text-brand-stone">
                    {hole.note}
                  </p>
                )}

                {sponsor && (
                  <p className="mt-1 text-xs font-semibold text-brand-deepPine">
                    Sponsored by{" "}
                    {sponsor.website ? (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {sponsor.name}
                      </a>
                    ) : (
                      sponsor.name
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Sponsor thank-you strip — every currently-active sponsor. */}
      {thanks.length > 0 && (
        <section className="mt-8 rounded-2xl bg-brand-sunshine/20 p-4 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            Thanks to our sponsors
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-brand-ink">
            {thanks.map((sponsor, i) => (
              <span key={sponsor.name}>
                {i > 0 && " · "}
                {sponsor.website ? (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-brand-stone/40"
                  >
                    {sponsor.name}
                  </a>
                ) : (
                  sponsor.name
                )}
              </span>
            ))}
          </p>
        </section>
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

/**
 * A small difficulty meter (5 pips) from a hole's difficultyRank. The
 * worksheet ranks difficulty 1–5 with 1 = hardest, so rank 1 lights all
 * five pips. Values past 5 (old data) just clamp to the easiest.
 */
function DifficultyMeter({ rank }: { rank: number }) {
  const level = Math.max(1, Math.min(5, 6 - rank));
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
