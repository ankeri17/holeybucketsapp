"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { defaultCourse } from "@/config/courses";
import { FORMATS, DEFAULT_FORMAT } from "@/lib/formats";
import { createRound } from "@/lib/round";
import { saveRound, setActiveRoundId } from "@/lib/storage";
import type { ScoringFormat } from "@/lib/types";

/**
 * Start-a-round flow (Milestone 3).
 *
 * Name the group, add players by name (no accounts), pick a format. On start
 * we build a Round, save it to the phone's storage so it survives a refresh,
 * and hand off to the round screen (scoring lands in Milestone 4).
 */
export default function StartPage() {
  const router = useRouter();
  const course = defaultCourse;

  const [groupName, setGroupName] = useState("");
  // Start with two empty player slots — most groups have at least two.
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const [format, setFormat] = useState<ScoringFormat>(DEFAULT_FORMAT);

  const filledPlayers = players.map((p) => p.trim()).filter(Boolean);
  const canStart = groupName.trim().length > 0 && filledPlayers.length > 0;

  function updatePlayer(index: number, value: string) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, ""]);
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  function startRound() {
    if (!canStart) return;
    const round = createRound({
      courseId: course.id,
      groupName,
      playerNames: players,
      format,
    });
    saveRound(round);
    setActiveRoundId(round.id);
    router.push(`/play/${round.id}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-6">
      <Link
        href="/"
        className="text-sm font-semibold text-brand-ink/60 hover:text-brand-ink"
      >
        ← Home
      </Link>

      <h1 className="mb-1 mt-4 font-display text-3xl font-extrabold tracking-tight text-brand-ink">
        Start a round
      </h1>
      <p className="mb-6 text-brand-ink/70">
        {course.name} · {course.location}
      </p>

      {/* Group name */}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Group name
        </span>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g. The Bachelor Party"
          className="tap-target w-full rounded-2xl border-2 border-brand-ink/10 bg-white px-4 text-lg font-medium outline-none focus:border-brand-primary"
        />
      </label>

      {/* Players */}
      <div className="mt-6">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Players
        </span>
        <div className="space-y-2">
          {players.map((player, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={player}
                onChange={(e) => updatePlayer(index, e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="tap-target w-full rounded-2xl border-2 border-brand-ink/10 bg-white px-4 text-lg font-medium outline-none focus:border-brand-primary"
              />
              {players.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  aria-label={`Remove player ${index + 1}`}
                  className="tap-target shrink-0 rounded-2xl bg-brand-ink/5 px-4 text-2xl font-bold text-brand-ink/50 active:bg-brand-ink/10"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPlayer}
          className="tap-target mt-2 w-full rounded-2xl border-2 border-dashed border-brand-primary/40 px-4 text-lg font-bold text-brand-primary active:bg-brand-primary/5"
        >
          + Add player
        </button>
      </div>

      {/* Format — with only one live option, show it selected plus a quiet
          "more coming" line instead of a wall of greyed-out cards. */}
      <div className="mt-6">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-brand-stone">
          Format
        </span>
        <div className="space-y-2">
          {FORMATS.filter((opt) => opt.available).map((opt) => {
            const selected = opt.id === format;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormat(opt.id)}
                className={[
                  "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-brand-line bg-brand-card",
                ].join(" ")}
              >
                <span>
                  <span className="block font-display font-bold text-brand-ink">
                    {opt.label}
                  </span>
                  <span className="block text-sm text-brand-stone">
                    {opt.blurb}
                  </span>
                </span>
                {selected && (
                  <span className="text-xl font-bold text-brand-primary">✓</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-brand-stone">
          More formats coming soon —{" "}
          {FORMATS.filter((opt) => !opt.available)
            .map((opt) => opt.label)
            .join(", ")}
          .
        </p>
      </div>

      {/* Sticky start button */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-brand-line bg-brand-cream/95 px-5 py-3 backdrop-blur">
        <button
          type="button"
          onClick={startRound}
          disabled={!canStart}
          className="tap-target w-full rounded-2xl bg-brand-primary px-6 text-lg font-extrabold text-white disabled:opacity-40"
        >
          {canStart
            ? `Start round · ${filledPlayers.length} player${filledPlayers.length === 1 ? "" : "s"}`
            : "Add a group name & a player"}
        </button>
      </div>
    </main>
  );
}
