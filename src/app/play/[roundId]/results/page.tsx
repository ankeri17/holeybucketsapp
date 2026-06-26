"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCourse } from "@/config/courses";
import { loadRound } from "@/lib/storage";
import { standings, formatToPar } from "@/lib/scoring";
import type { Round } from "@/lib/types";

/**
 * Results screen (Milestone 4 stub).
 *
 * Shows the final standings from the live scoring. The full branded results —
 * winner celebration, final scorecard, and the shareable image — land in
 * Milestone 5. The numbers here already come from the real scoring engine.
 */
export default function ResultsPage() {
  const params = useParams<{ roundId: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRound(loadRound(params.roundId));
    setLoaded(true);
  }, [params.roundId]);

  if (!loaded) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center text-brand-ink/50">
        Loading results…
      </main>
    );
  }

  const course = round ? getCourse(round.courseId) : undefined;
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

  const board = standings(round, course);
  const winner = board[0];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      <div className="rounded-2xl bg-brand-primary px-5 py-8 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
          {round.groupName} · final
        </p>
        <p className="mt-2 text-5xl">🏆</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">
          {winner.name} wins!
        </h1>
        <p className="mt-1 opacity-90">
          {winner.total} strokes · {formatToPar(winner.toPar)}
        </p>
      </div>

      <ol className="mt-6 space-y-2">
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

      <p className="mt-8 text-center text-sm text-brand-ink/50">
        Branded results, a printable scorecard, and a shareable image are coming
        next.
      </p>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/play/${round.id}`}
          className="tap-target flex flex-1 items-center justify-center rounded-2xl bg-brand-ink/5 px-5 font-bold text-brand-ink"
        >
          ← Back to scoring
        </Link>
        <Link
          href="/"
          className="tap-target flex flex-1 items-center justify-center rounded-2xl bg-brand-accent px-5 font-bold text-brand-ink"
        >
          Done
        </Link>
      </div>
    </main>
  );
}
