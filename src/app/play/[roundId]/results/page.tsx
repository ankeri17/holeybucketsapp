"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCourse } from "@/config/courses";
import { loadRound } from "@/lib/storage";
import {
  standings,
  formatToPar,
  playerBalls,
  totalBalls,
  winners,
  joinNames,
} from "@/lib/scoring";
import { buildShareImage, shareImage, downloadImage } from "@/lib/shareImage";
import { downloadResultsScorecard } from "@/lib/pdf";
import { BucketLogo } from "@/components/icons";
import { Scorecard } from "@/components/Scorecard";
import type { Round } from "@/lib/types";

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

  const top = winners(board);
  const isTie = top.length > 1;
  const best = top[0];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      {/* Winner hero (or tie) */}
      <div className="rounded-2xl bg-brand-primary px-5 py-8 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
          {round.groupName} · final
        </p>
        <BucketLogo className="mx-auto mt-2 h-16 w-16" />
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          {isTie
            ? `It's a tie!`
            : `${best.name} wins!`}
        </h1>
        <p className="mt-1 opacity-90">
          {isTie ? `${joinNames(top.map((w) => w.name))} · ` : ""}
          {best.total} strokes · {formatToPar(best.toPar)}
        </p>
      </div>

      {/* Rounds aren't saved anywhere — nudge a keepsake. */}
      <p className="mt-4 rounded-2xl border border-brand-line bg-brand-sunshine/20 px-4 py-3 text-center text-sm font-medium text-brand-ink">
        <span className="font-bold">Heads up —</span> rounds aren&apos;t saved.
        Screenshot this page, share the card, or download the PDF below to keep
        your results.
      </p>

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

      {/* Balls used — only for venues that charge per ball (out of the score) */}
      {course.trackBalls && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
            Balls used · {totalBalls(round)} total
          </h2>
          <ul className="space-y-2 tabular-nums">
            {round.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-brand-line bg-brand-card px-4 py-2"
              >
                <span className="font-display font-bold text-brand-ink">
                  {p.name}
                </span>
                <span className="font-extrabold text-brand-ink">
                  {playerBalls(round, p.id)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Completed-round PDF scorecard */}
      <button
        type="button"
        onClick={() => downloadResultsScorecard(round, course)}
        className="tap-target mt-6 w-full rounded-2xl bg-brand-sunshine px-6 font-extrabold text-brand-ink"
      >
        Download scorecard (PDF)
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
