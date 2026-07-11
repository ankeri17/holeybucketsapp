"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultCourse, getCourse } from "@/config/courses";
import { getSponsors } from "@/config/sponsors";
import { sheetsConfig } from "@/config/sheets";
import {
  assertCsvResponse,
  courseFromSheets,
  sheetCsvUrl,
  sponsorsFromSheet,
  type SheetSponsor,
} from "./sheets";
import type { Course } from "./types";

/**
 * ============================================================================
 * LIVE DATA  —  course + sponsor info straight from the Google Sheets.
 * ============================================================================
 *
 * The rule that keeps the play loop bulletproof: the built-in course config is
 * ALWAYS the starting point, and sheet data only ever *upgrades* it. Screens
 * render instantly from the bundle (or the last good copy cached on the
 * phone), then refresh in place when the sheet answers. If the sheet is
 * unreachable, mis-shared, or broken, players never notice — they just get
 * the built-in data, and the admin panel shows exactly what went wrong.
 * ----------------------------------------------------------------------------
 */

/** Where the data on screen came from, worst → best. */
export type LiveSource = "bundled" | "cached" | "live";

export interface LiveStatus {
  /** Is a sheet ID configured at all (see src/config/sheets.ts)? */
  configured: boolean;
  source: LiveSource;
  /** ISO timestamp of the copy on screen (cached or live). */
  fetchedAt: string | null;
  /** Why the last fetch failed, in fix-it-yourself language. Null when fine. */
  error: string | null;
}

const COURSE_CACHE_KEY = "holeybuckets:sheets:course:v1";
const SPONSOR_CACHE_KEY = "holeybuckets:sheets:sponsors:v1";

interface Cached<T> {
  data: T;
  warnings: string[];
  fetchedAt: string;
}

function readCache<T>(key: string): Cached<T> | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached<T>;
    if (!parsed || typeof parsed.fetchedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T, warnings: string[]): Cached<T> {
  const entry: Cached<T> = {
    data,
    warnings,
    fetchedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full or blocked — live data still works for this page view.
  }
  return entry;
}

async function fetchTabCsv(sheetId: string, tabName: string): Promise<string> {
  const response = await fetch(sheetCsvUrl(sheetId, tabName), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Google Sheets answered ${response.status} for the "${tabName}" tab — ` +
        "double-check the sheet ID and tab name in src/config/sheets.ts.",
    );
  }
  const text = await response.text();
  assertCsvResponse(text);
  return text;
}

/** Fetch and parse the course sheet. Throws with a fixable message on failure. */
export async function fetchSheetCourse(): Promise<{
  course: Course;
  warnings: string[];
}> {
  const { courseSheetId, courseInfoTab, holeDetailsTab } = sheetsConfig;
  const [holesCsv, infoCsv] = await Promise.all([
    fetchTabCsv(courseSheetId, holeDetailsTab),
    // Course Info is optional — a missing tab shouldn't take holes down with it.
    fetchTabCsv(courseSheetId, courseInfoTab).catch(() => null),
  ]);
  return courseFromSheets(defaultCourse, infoCsv, holesCsv);
}

/** Fetch and parse the sponsor sheet (ALL pipeline rows; only "active" ones show). */
export async function fetchSheetSponsors(): Promise<{
  sponsors: SheetSponsor[];
  warnings: string[];
}> {
  const csv = await fetchTabCsv(sheetsConfig.sponsorSheetId, sheetsConfig.sponsorTab);
  return { sponsors: sponsorsFromSheet(csv), warnings: [] };
}

/** The config sponsors in SheetSponsor clothing (pipeline = their status). */
function configSponsors(courseId: string): SheetSponsor[] {
  return getSponsors(courseId).map((s) => ({ ...s, pipeline: s.status }));
}

/**
 * Synchronous snapshot of the sponsors every placement should use right now:
 * the last good sheet copy when a sponsor sheet is connected, the config
 * sponsors otherwise. For code that can't run a hook (the PDF generator);
 * components use useLiveSponsors instead.
 */
export function currentSponsors(courseId: string): SheetSponsor[] {
  if (!sheetsConfig.sponsorSheetId || courseId !== defaultCourse.id) {
    return configSponsors(courseId);
  }
  const cached = readCache<SheetSponsor[]>(SPONSOR_CACHE_KEY);
  return cached ? cached.data : configSponsors(courseId);
}

/* ----------------------------------------------------------------------------
 * Hooks
 * ------------------------------------------------------------------------- */

interface LiveState<T> {
  data: T;
  warnings: string[];
  status: LiveStatus;
}

/**
 * Shared cache-then-network machinery: start from the bundled value, upgrade
 * to the cached copy, then to a fresh fetch. `enabled` gates the whole thing
 * (e.g. the sheet only describes the flagship course).
 */
function useSheetData<T>(
  bundled: T,
  cacheKey: string,
  configured: boolean,
  enabled: boolean,
  fetcher: () => Promise<{ data: T; warnings: string[] }>,
  refreshToken: number,
): LiveState<T> {
  const [state, setState] = useState<LiveState<T>>({
    data: bundled,
    warnings: [],
    status: { configured, source: "bundled", fetchedAt: null, error: null },
  });

  useEffect(() => {
    if (!configured || !enabled) {
      setState({
        data: bundled,
        warnings: [],
        status: { configured, source: "bundled", fetchedAt: null, error: null },
      });
      return;
    }

    let cancelled = false;

    const cached = readCache<T>(cacheKey);
    if (cached) {
      setState({
        data: cached.data,
        warnings: cached.warnings,
        status: {
          configured,
          source: "cached",
          fetchedAt: cached.fetchedAt,
          error: null,
        },
      });
    }

    fetcher()
      .then(({ data, warnings }) => {
        if (cancelled) return;
        const entry = writeCache(cacheKey, data, warnings);
        setState({
          data,
          warnings,
          status: {
            configured,
            source: "live",
            fetchedAt: entry.fetchedAt,
            error: null,
          },
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        // Keep whatever we already showed (cache or bundle); just report why
        // the refresh failed so the admin panel can surface it.
        setState((prev) => ({
          ...prev,
          status: { ...prev.status, error: message },
        }));
      });

    return () => {
      cancelled = true;
    };
    // `bundled` is intentionally not a dependency: it's a module-level
    // constant, and object identity would re-trigger the effect every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, configured, enabled, refreshToken]);

  return state;
}

export interface LiveCourse {
  /** Undefined only when an unknown courseId was asked for. */
  course: Course | undefined;
  warnings: string[];
  status: LiveStatus;
  /** Re-fetch from the sheet right now (used by the admin panel). */
  refresh: () => void;
}

/**
 * The course, live from the Google Sheet when connected — bundled config
 * otherwise. Pass a round's courseId, or nothing for the default course.
 */
export function useLiveCourse(courseId?: string): LiveCourse {
  const base = courseId ? getCourse(courseId) : defaultCourse;
  // The sheet describes the flagship course; other (future) courses render
  // straight from their config.
  const enabled = base?.id === defaultCourse.id;
  const configured = sheetsConfig.courseSheetId.length > 0;
  const [refreshToken, setRefreshToken] = useState(0);
  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  const fetcher = useCallback(async () => {
    const { course, warnings } = await fetchSheetCourse();
    return { data: course, warnings };
  }, []);

  const state = useSheetData<Course>(
    base ?? defaultCourse,
    COURSE_CACHE_KEY,
    configured,
    !!base && enabled,
    fetcher,
    refreshToken,
  );

  return {
    course: base ? state.data : undefined,
    warnings: state.warnings,
    status: state.status,
    refresh,
  };
}

export interface LiveSponsors {
  /** Every sponsor row (all pipeline stages — filter with lib/sponsors helpers). */
  sponsors: SheetSponsor[];
  warnings: string[];
  status: LiveStatus;
  refresh: () => void;
}

/**
 * A course's sponsors — live from the sponsor sheet when one is connected,
 * the config sponsors (src/config/sponsors/) otherwise. Same contract as
 * getSponsors: every status comes back; use the src/lib/sponsors helpers to
 * pick the active ones.
 */
export function useLiveSponsors(courseId?: string): LiveSponsors {
  const id = courseId ?? defaultCourse.id;
  const configured = sheetsConfig.sponsorSheetId.length > 0;
  // The sponsor sheet belongs to the flagship course; other (future) courses
  // render their config sponsors untouched.
  const enabled = id === defaultCourse.id;
  const [refreshToken, setRefreshToken] = useState(0);
  const refresh = useCallback(() => setRefreshToken((t) => t + 1), []);

  const fetcher = useCallback(async () => {
    const { sponsors, warnings } = await fetchSheetSponsors();
    return { data: sponsors, warnings };
  }, []);

  const state = useSheetData<SheetSponsor[]>(
    configSponsors(id),
    SPONSOR_CACHE_KEY,
    configured,
    enabled,
    fetcher,
    refreshToken,
  );

  return {
    sponsors: state.data,
    warnings: state.warnings,
    status: state.status,
    refresh,
  };
}
