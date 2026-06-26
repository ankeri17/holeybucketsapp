import { DEFAULT_PAR, type Course, type HoleScore, type Round } from "./types";
import { holePar } from "./course";

/**
 * ============================================================================
 * SCORING  —  the single source of truth for the bucket golf rules
 * ============================================================================
 *
 * The rules, encoded once so every screen agrees:
 *   - Every hole is a par 3.
 *   - Net score for a hole = strokes
 *                            − 1 if you chipped INTO the bucket (the bonus)
 *                            + 1 per penalty (foliage/water/OB/lost ball)
 *   - Lowest total wins (Stroke Play).
 * ----------------------------------------------------------------------------
 */

/** Net strokes for one hole, applying the bucket-chip bonus and any penalties. */
export function netStrokes(score: HoleScore | undefined): number {
  if (!score) return 0;
  const net =
    score.strokes - (score.bucketChip ? 1 : 0) + (score.penalties ?? 0);
  // Can't score below zero, even with a first-throw chip-in.
  return Math.max(0, net);
}

/** The stored score for one player on one hole, if it exists yet. */
export function getHoleScore(
  round: Round,
  playerId: string,
  holeNumber: number,
): HoleScore | undefined {
  return round.scores[playerId]?.[holeNumber];
}

/** How many holes this player has a recorded score for. */
export function holesScored(round: Round, playerId: string): number {
  return Object.keys(round.scores[playerId] ?? {}).length;
}

/** A player's total net strokes across every hole they've scored. */
export function playerTotal(round: Round, playerId: string): number {
  const byHole = round.scores[playerId];
  if (!byHole) return 0;
  return Object.values(byHole).reduce((sum, s) => sum + netStrokes(s), 0);
}

/** A player's score relative to par, over the holes they've scored. */
export function playerToPar(
  round: Round,
  course: Course,
  playerId: string,
): number {
  const byHole = round.scores[playerId];
  if (!byHole) return 0;
  return Object.entries(byHole).reduce((sum, [holeNumber, score]) => {
    const hole = course.holes.find((h) => h.number === Number(holeNumber));
    const par = hole ? holePar(hole) : DEFAULT_PAR;
    return sum + (netStrokes(score) - par);
  }, 0);
}

/** One row of the leaderboard. */
export interface Standing {
  playerId: string;
  name: string;
  total: number;
  toPar: number;
  holesScored: number;
  /** 1-based placing, with ties sharing a rank. */
  rank: number;
}

/**
 * The leaderboard: every player sorted best (lowest total) first, with ties
 * sharing a rank. This is the live running order during play and the final
 * standings at the end.
 */
export function standings(round: Round, course: Course): Standing[] {
  const rows = round.players.map((player) => ({
    playerId: player.id,
    name: player.name,
    total: playerTotal(round, player.id),
    toPar: playerToPar(round, course, player.id),
    holesScored: holesScored(round, player.id),
    rank: 0,
  }));

  rows.sort((a, b) => a.total - b.total);

  // Assign ranks; equal totals share the same rank.
  rows.forEach((row, i) => {
    row.rank = i > 0 && row.total === rows[i - 1].total ? rows[i - 1].rank : i + 1;
  });

  return rows;
}

/** Balls used/lost by one player (0 if untracked). Never affects the score. */
export function playerBalls(round: Round, playerId: string): number {
  return round.balls?.[playerId] ?? 0;
}

/** Total balls used/lost across the whole group. */
export function totalBalls(round: Round): number {
  return round.players.reduce((sum, p) => sum + playerBalls(round, p.id), 0);
}

/**
 * Everyone sharing the best (lowest) total — usually one player, but more when
 * there's a tie. Callers use `length > 1` to detect a tie.
 */
export function winners(board: Standing[]): Standing[] {
  if (board.length === 0) return [];
  const best = board[0].total;
  return board.filter((row) => row.total === best);
}

/** "Erin", "Erin & Laura", or "Erin, Laura & Sam". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** Format a to-par number the golfy way: "E", "+3", "-1". */
export function formatToPar(toPar: number): string {
  if (toPar === 0) return "E";
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}
