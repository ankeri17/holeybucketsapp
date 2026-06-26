"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCourse } from "@/config/courses";
import { loadRound } from "@/lib/storage";
import { FORMATS } from "@/lib/formats";
import type { Round } from "@/lib/types";

/**
 * Round screen (Milestone 3 stub).
 *
 * Loads the round the start form just saved and confirms it's ready. The
 * hole-by-hole scoring UI replaces this placeholder body in Milestone 4 —
 * the round is already persisted, so that's purely additive.
 */
export default function PlayRoundPage() {
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
        Loading round…
      </main>
    );
  }

  if (!round) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <p className="text-brand-ink/70">
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

  const course = getCourse(round.courseId);
  const formatLabel =
    FORMATS.find((f) => f.id === round.format)?.label ?? round.format;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      <Link
        href="/"
        className="text-sm font-semibold text-brand-ink/60 hover:text-brand-ink"
      >
        ← Home
      </Link>

      <div className="mt-6 rounded-2xl bg-brand-primary px-5 py-6 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
          Round started 🪣
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">
          {round.groupName}
        </h1>
        <p className="mt-1 opacity-90">
          {course?.name ?? "Course"} · {formatLabel}
        </p>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-brand-ink/60">
        Players ({round.players.length})
      </h2>
      <ul className="space-y-2">
        {round.players.map((player) => (
          <li
            key={player.id}
            className="rounded-2xl bg-white/70 px-4 py-3 font-display font-bold text-brand-ink ring-1 ring-brand-ink/5"
          >
            {player.name}
          </li>
        ))}
      </ul>

      <button
        disabled
        className="tap-target mt-8 w-full rounded-2xl bg-brand-accent px-6 text-lg font-extrabold text-brand-ink opacity-60"
      >
        Score the round — coming next
      </button>
    </main>
  );
}
