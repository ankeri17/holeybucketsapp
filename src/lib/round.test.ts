import { describe, expect, it } from "vitest";
import { createRound } from "./round";
import { SCHEMA_VERSION } from "./types";

describe("createRound", () => {
  const input = {
    courseId: "osceola",
    groupName: "  The Bachelor Party  ",
    playerNames: [" Erin ", "", "Laura", "   "],
    format: "strokePlay" as const,
  };

  it("stamps the current schema version", () => {
    expect(createRound(input).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("trims the group name and drops blank player slots", () => {
    const round = createRound(input);
    expect(round.groupName).toBe("The Bachelor Party");
    expect(round.players.map((p) => p.name)).toEqual(["Erin", "Laura"]);
  });

  it("gives every player and the round distinct stable ids", () => {
    const round = createRound(input);
    const ids = [round.id, ...round.players.map((p) => p.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("starts with no scores and a valid timestamp", () => {
    const round = createRound(input);
    expect(round.scores).toEqual({});
    expect(Number.isNaN(Date.parse(round.createdAt))).toBe(false);
  });
});
