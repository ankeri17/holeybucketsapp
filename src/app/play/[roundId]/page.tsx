"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCourse } from "@/config/courses";
import { holePar } from "@/lib/course";
import { loadRound, saveRound } from "@/lib/storage";
import {
  getHoleScore,
  netStrokes,
  standings,
  formatToPar,
} from "@/lib/scoring";
import { ChipInIcon, FoliageIcon } from "@/components/icons";
import type { HoleScore, Round } from "@/lib/types";

/**
 * Scoring screen — the heart of the app.
 *
 * One hole at a time, every player on screen. The resulting HOLE SCORE is the
 * prominent number; raw strokes are the secondary input you adjust with the
 * +/− stepper. The bucket-chip (−1) bonus and foliage (+1) penalty are toggles,
 * and when one is on we show the math so nobody's confused by the difference.
 * Every change writes straight to the phone's storage.
 */
export default function PlayRoundPage() {
  const params = useParams<{ roundId: string }>();
  const router = useRouter();

  const [round, setRound] = useState<Round | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [holeIndex, setHoleIndex] = useState(0);

  const course = round ? getCourse(round.courseId) : undefined;

  useEffect(() => {
    setRound(loadRound(params.roundId));
    setLoaded(true);
  }, [params.roundId]);

  // Landing on a hole means it's in play — make sure every player has a score
  // for it (default = par) so it counts toward the running totals.
  useEffect(() => {
    if (!round || !course) return;
    const hole = course.holes[holeIndex];
    if (!hole) return;
    setRound((prev) => {
      if (!prev) return prev;
      let changed = false;
      const scores = { ...prev.scores };
      for (const player of prev.players) {
        const byHole = scores[player.id] ?? {};
        if (byHole[hole.number] == null) {
          scores[player.id] = {
            ...byHole,
            [hole.number]: { strokes: holePar(hole) },
          };
          changed = true;
        }
      }
      if (!changed) return prev;
      const next = { ...prev, scores };
      saveRound(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id, holeIndex, course]);

  const updateScore = useCallback(
    (playerId: string, holeNumber: number, changes: Partial<HoleScore>) => {
      setRound((prev) => {
        if (!prev) return prev;
        const existing =
          prev.scores[playerId]?.[holeNumber] ?? ({ strokes: 3 } as HoleScore);
        const next: Round = {
          ...prev,
          scores: {
            ...prev.scores,
            [playerId]: {
              ...(prev.scores[playerId] ?? {}),
              [holeNumber]: { ...existing, ...changes },
            },
          },
        };
        saveRound(next);
        return next;
      });
    },
    [],
  );

  if (!loaded) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center text-brand-stone">
        Loading round…
      </main>
    );
  }

  if (!round || !course) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <p className="text-brand-stone">
          We couldn&apos;t find that round on this device.
        </p>
        <Link
          href="/start"
          className="tap-target mt-4 inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 font-bold text-white"
        >
          Start a new round
        </Link>
      </main>
    );
  }

  const hole = course.holes[holeIndex];
  const isFirst = holeIndex === 0;
  const isLast = holeIndex === course.holes.length - 1;
  const board = standings(round, course);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-brand-stone hover:text-brand-ink"
        >
          ← Home
        </Link>
        <span className="truncate text-sm font-bold text-brand-stone">
          {round.groupName}
        </span>
      </div>

      {/* Hole header */}
      <section className="mt-3 rounded-2xl bg-brand-primary px-5 py-4 text-white">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-80">
            Hole {hole.number} of {course.holes.length}
          </span>
          <span className="text-sm font-semibold opacity-80">
            Par {holePar(hole)}
          </span>
        </div>
        {hole.name && (
          <h1 className="font-display text-2xl font-extrabold">{hole.name}</h1>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 text-sm opacity-90">
          {hole.distancePaces != null && <span>{hole.distancePaces} paces</span>}
          {hole.hazards && (
            <span className="font-semibold">Heads up: {hole.hazards}</span>
          )}
        </div>
        {hole.note && (
          <p className="mt-1 text-sm italic opacity-80">{hole.note}</p>
        )}
      </section>

      {/* Player scorers */}
      <div className="mt-4 space-y-3">
        {round.players.map((player) => {
          const score = getHoleScore(round, player.id, hole.number);
          const strokes = score?.strokes ?? holePar(hole);
          const net = netStrokes(score ?? { strokes });
          const hasModifier = !!score?.bucketChip || !!score?.foliage;
          return (
            <div
              key={player.id}
              className="rounded-2xl border border-brand-line bg-brand-card p-4 shadow-sm"
            >
              {/* Name + prominent hole score */}
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-brand-ink">
                  {player.name}
                </span>
                <div className="text-right leading-none">
                  <div className="text-4xl font-extrabold text-brand-ink">
                    {net}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-brand-stone">
                    hole score
                  </div>
                </div>
              </div>

              {/* Strokes stepper (the secondary input) */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wide text-brand-stone">
                  Strokes
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Remove a stroke for ${player.name}`}
                    onClick={() =>
                      updateScore(player.id, hole.number, {
                        strokes: Math.max(1, strokes - 1),
                      })
                    }
                    className="tap-target h-12 w-12 rounded-full border-2 border-brand-line bg-brand-card text-2xl font-bold text-brand-ink active:bg-brand-cream"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-2xl font-extrabold text-brand-ink">
                    {strokes}
                  </span>
                  <button
                    type="button"
                    aria-label={`Add a stroke for ${player.name}`}
                    onClick={() =>
                      updateScore(player.id, hole.number, {
                        strokes: strokes + 1,
                      })
                    }
                    className="tap-target h-12 w-12 rounded-full bg-brand-primary text-2xl font-bold text-white active:bg-brand-deepPine"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bonus / penalty toggles */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ToggleChip
                  active={!!score?.bucketChip}
                  onClick={() =>
                    updateScore(player.id, hole.number, {
                      bucketChip: !score?.bucketChip,
                    })
                  }
                  activeClass="bg-brand-bucketBlue text-white"
                  icon={<ChipInIcon className="h-5 w-5" />}
                >
                  Chipped in −1
                </ToggleChip>
                <ToggleChip
                  active={!!score?.foliage}
                  onClick={() =>
                    updateScore(player.id, hole.number, {
                      foliage: !score?.foliage,
                    })
                  }
                  activeClass="bg-brand-penalty text-white"
                  icon={<FoliageIcon className="h-5 w-5" />}
                >
                  Foliage +1
                </ToggleChip>
              </div>

              {/* The math, shown only when a modifier changes the score */}
              {hasModifier && (
                <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm font-bold text-brand-stone">
                  <span>{strokes} strokes</span>
                  {score?.bucketChip && (
                    <span className="text-brand-bucketBlue">− 1 chip-in</span>
                  )}
                  {score?.foliage && (
                    <span className="text-brand-penalty">+ 1 foliage</span>
                  )}
                  <span className="text-brand-ink">= {net}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Live leaderboard */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-stone">
          Leaderboard
        </h2>
        <ol className="space-y-1.5">
          {board.map((row) => (
            <li
              key={row.playerId}
              className="flex items-center justify-between rounded-xl border border-brand-line bg-brand-card px-4 py-2"
            >
              <span className="flex items-center gap-3">
                <span className="w-5 text-center font-bold text-brand-stone">
                  {row.rank}
                </span>
                <span className="font-semibold text-brand-ink">{row.name}</span>
              </span>
              <span className="flex items-baseline gap-2">
                <span
                  className={`text-xs font-bold ${
                    row.toPar < 0
                      ? "text-brand-primary"
                      : row.toPar > 0
                        ? "text-brand-penalty"
                        : "text-brand-stone"
                  }`}
                >
                  {formatToPar(row.toPar)}
                </span>
                <span className="text-lg font-extrabold text-brand-ink">
                  {row.total}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Sticky hole navigation */}
      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center gap-3 border-t border-brand-line bg-brand-cream/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setHoleIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="tap-target rounded-2xl border-2 border-brand-line bg-brand-card px-5 font-bold text-brand-ink disabled:opacity-30"
        >
          ← Prev
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={() => router.push(`/play/${round.id}/results`)}
            className="tap-target flex-1 rounded-2xl bg-brand-sunshine px-5 text-lg font-extrabold text-brand-ink"
          >
            Finish round →
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setHoleIndex((i) => Math.min(course.holes.length - 1, i + 1))
            }
            className="tap-target flex-1 rounded-2xl bg-brand-primary px-5 text-lg font-extrabold text-white active:bg-brand-deepPine"
          >
            Next hole →
          </button>
        )}
      </nav>
    </main>
  );
}

function ToggleChip({
  active,
  onClick,
  activeClass,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "tap-target flex items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors",
        active
          ? activeClass
          : "border border-brand-line bg-brand-card text-brand-stone",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}
