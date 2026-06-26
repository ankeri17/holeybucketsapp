"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCourse } from "@/config/courses";
import { holePar } from "@/lib/course";
import { loadRound } from "@/lib/storage";
import {
  getHoleScore,
  netStrokes,
  standings,
  formatToPar,
} from "@/lib/scoring";
import { buildShareImage, shareImage, downloadImage } from "@/lib/shareImage";
import { BucketLogo, ChipInIcon, FoliageIcon } from "@/components/icons";
import type { Course, Round } from "@/lib/types";

/**
 * Branded results screen (Milestone 5).
 *
 * The end-of-round payoff: winner celebration, a shareable branded image for
 * word of mouth, and the full final scorecard. The PDF scorecard (Milestone 6)
 * and email capture / booking link (Milestone 7) slot in below later.
 */
export default function ResultsPage() {
  const params = useParams<{ roundId: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    setRound(loadRound(params.roundId));
    setLoaded(true);
  }, [params.roundId]);

  const course = round ? getCourse(round.courseId) : undefined;
  const board = useMemo(
    () => (round && course ? standings(round, course) : []),
    [round, course],
  );

  // Build the shareable image once the round is loaded.
  useEffect(() => {
    if (!round || !course) return;
    let url: string | null = null;
    buildShareImage(round, course, standings(round, course)).then((blob) => {
      if (!blob) return;
      setShareBlob(blob);
      url = URL.createObjectURL(blob);
      setShareUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [round, course]);

  if (!loaded) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center text-brand-ink/50">
        Loading results…
      </main>
    );
  }

  if (!round || !course) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <p className="text-brand-ink/70">We couldn&apos;t find that round.</p>
        <Link
          href="/start"
          className="tap-target mt-4 inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 font-bold text-white"
        >
          Start a new round
        </Link>
      </main>
    );
  }

  const winner = board[0];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      {/* Winner hero */}
      <div className="rounded-2xl bg-brand-primary px-5 py-8 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
          {round.groupName} · final
        </p>
        <BucketLogo className="mx-auto mt-2 h-16 w-16" />
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          {winner.name} wins!
        </h1>
        <p className="mt-1 opacity-90">
          {winner.total} strokes · {formatToPar(winner.toPar)}
        </p>
      </div>

      {/* Shareable branded image */}
      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Share the win
        </h2>
        {shareUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shareUrl}
            alt="Shareable Holey Buckets result card"
            className="w-full rounded-2xl shadow-sm ring-1 ring-brand-ink/5"
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-white/60 text-brand-ink/40">
            Making your card…
          </div>
        )}
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            disabled={!shareBlob}
            onClick={() => shareBlob && shareImage(shareBlob, round)}
            className="tap-target flex-1 rounded-2xl bg-brand-sunshine px-5 font-extrabold text-brand-ink disabled:opacity-40"
          >
            Share
          </button>
          <button
            type="button"
            disabled={!shareBlob}
            onClick={() => shareBlob && downloadImage(shareBlob)}
            className="tap-target flex-1 rounded-2xl bg-brand-ink/5 px-5 font-bold text-brand-ink disabled:opacity-40"
          >
            Save image
          </button>
        </div>
      </section>

      {/* Standings */}
      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Final standings
        </h2>
        <ol className="space-y-2 tabular-nums">
          {board.map((row) => (
            <li
              key={row.playerId}
              className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-brand-ink/5"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center font-extrabold text-brand-ink/40">
                  {row.rank}
                </span>
                <span className="font-display font-bold text-brand-ink">
                  {row.name}
                </span>
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-brand-ink/40">
                  {formatToPar(row.toPar)}
                </span>
                <span className="text-xl font-extrabold text-brand-ink">
                  {row.total}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Full scorecard */}
      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Scorecard
        </h2>
        <Scorecard round={round} course={course} />
      </section>

      {/* PDF scorecard comes in Milestone 6 */}
      <button
        disabled
        className="tap-target mt-6 w-full rounded-2xl bg-brand-sunshine px-6 font-extrabold text-brand-ink opacity-50"
      >
        Print PDF scorecard — coming soon
      </button>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/play/${round.id}`}
          className="tap-target flex flex-1 items-center justify-center rounded-2xl bg-brand-ink/5 px-5 font-bold text-brand-ink"
        >
          ← Back to scoring
        </Link>
        <Link
          href="/"
          className="tap-target flex flex-1 items-center justify-center rounded-2xl bg-brand-primary px-5 font-bold text-white"
        >
          Done
        </Link>
      </div>
    </main>
  );
}

/** The full hole-by-hole grid: a row per hole, a column per player. */
function Scorecard({ round, course }: { round: Round; course: Course }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-brand-ink/5">
      <table className="w-full border-collapse bg-white text-sm tabular-nums">
        <thead>
          <tr className="bg-brand-ink/5 text-brand-ink/70">
            <th className="px-2 py-2 text-left font-bold">Hole</th>
            <th className="px-2 py-2 font-bold">Par</th>
            {round.players.map((p) => (
              <th key={p.id} className="px-2 py-2 font-bold">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {course.holes.map((hole) => (
            <tr key={hole.number} className="border-t border-brand-ink/5">
              <td className="px-2 py-1.5 text-left font-semibold text-brand-ink/70">
                {hole.number}
                {hole.name ? (
                  <span className="ml-1 text-xs text-brand-ink/40">
                    {hole.name}
                  </span>
                ) : null}
              </td>
              <td className="px-2 py-1.5 text-center text-brand-ink/50">
                {holePar(hole)}
              </td>
              {round.players.map((p) => {
                const score = getHoleScore(round, p.id, hole.number);
                const net = score ? netStrokes(score) : null;
                const par = holePar(hole);
                const color =
                  net == null
                    ? "text-brand-stone"
                    : net < par
                      ? "text-brand-primary"
                      : net > par
                        ? "text-brand-penalty"
                        : "text-brand-ink";
                return (
                  <td
                    key={p.id}
                    className={`px-2 py-1.5 text-center font-bold ${color}`}
                  >
                    <span className="inline-flex items-center justify-center gap-0.5">
                      {net ?? "–"}
                      {score?.bucketChip && (
                        <ChipInIcon className="h-3 w-3 text-brand-bucketBlue" />
                      )}
                      {score?.foliage && (
                        <FoliageIcon className="h-3 w-3 text-brand-penalty" />
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-brand-ink/10 bg-brand-ink/5 font-extrabold">
            <td className="px-2 py-2 text-left">Total</td>
            <td className="px-2 py-2" />
            {round.players.map((p) => {
              const total = course.holes.reduce((sum, hole) => {
                const score = getHoleScore(round, p.id, hole.number);
                return sum + (score ? netStrokes(score) : 0);
              }, 0);
              return (
                <td key={p.id} className="px-2 py-2 text-center text-brand-ink">
                  {total}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
