import type { Round, ScoringFormat } from "./types";
import { newId } from "./ids";

/** What the start-a-round form collects to build a new round. */
export interface NewRoundInput {
  courseId: string;
  groupName: string;
  playerNames: string[];
  format: ScoringFormat;
}

/**
 * Build a fresh Round from the start form. Each player gets a stable id so
 * scores key off the id, not the name (two "Mike"s are fine). Scores start
 * empty and get filled in on the scoring screen (Milestone 4).
 */
export function createRound(input: NewRoundInput): Round {
  return {
    id: newId(),
    courseId: input.courseId,
    groupName: input.groupName.trim(),
    players: input.playerNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((name) => ({ id: newId(), name })),
    format: input.format,
    scores: {},
    createdAt: new Date().toISOString(),
  };
}
