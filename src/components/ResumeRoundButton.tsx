"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadActiveRound } from "@/lib/storage";
import type { Round } from "@/lib/types";

/**
 * "Resume round" button for the landing page.
 *
 * A locked phone or an accidental tab close shouldn't lose a group mid-round:
 * the round is already in storage, so if one is active we offer the way back
 * in. Client-only (storage lives in the browser) — renders nothing on the
 * server and nothing when there's no round to resume. The active round is
 * cleared when the group taps Done on the results screen.
 */
export function ResumeRoundButton() {
  const [round, setRound] = useState<Round | null>(null);

  useEffect(() => {
    setRound(loadActiveRound());
  }, []);

  if (!round) return null;

  return (
    <Link
      href={`/play/${round.id}`}
      className="tap-target flex w-full items-center justify-center rounded-2xl bg-brand-sunshine px-6 py-4 text-lg font-extrabold text-brand-ink shadow-lg shadow-brand-sunshine/25 active:bg-brand-sunshine/80"
    >
      Resume round · {round.groupName} →
    </Link>
  );
}
