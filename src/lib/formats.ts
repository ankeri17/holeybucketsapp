import type { ScoringFormat } from "./types";

/**
 * The scoring formats shown in the start-a-round screen.
 *
 * Only Stroke Play is playable in the MVP. The Phase 2 formats are listed here
 * (marked `available: false`) so the picker already shows where they'll go —
 * turning one on later is just flipping its flag once the scoring is built.
 */
export interface FormatOption {
  id: ScoringFormat;
  label: string;
  blurb: string;
  available: boolean;
}

export const FORMATS: FormatOption[] = [
  { id: "strokePlay", label: "Stroke Play", blurb: "Lowest total score wins.", available: true },
  { id: "matchPlay", label: "Match Play", blurb: "Win the most holes.", available: false },
  { id: "skins", label: "Skins", blurb: "Each hole is its own prize.", available: false },
  { id: "fiveThreeOne", label: "5-3-1", blurb: "Points per hole for a group.", available: false },
  { id: "teamBestBall", label: "Team Best Ball", blurb: "Best score on each team.", available: false },
  { id: "pigAndWolf", label: "Pig & Wolf", blurb: "Pick partners hole by hole.", available: false },
];

/** The format a new round defaults to. */
export const DEFAULT_FORMAT: ScoringFormat = "strokePlay";
