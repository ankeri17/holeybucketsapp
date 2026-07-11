"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { holePar, coursePar } from "@/lib/course";
import { useLiveCourse, useLiveSponsors, type LiveStatus } from "@/lib/liveData";
import { holeSponsor, validateSponsors } from "@/lib/sponsors";
import type { SheetSponsor } from "@/lib/sheets";
import { sheetsConfig } from "@/config/sheets";

/**
 * ============================================================================
 * ADMIN PANEL  —  the maintenance dashboard for course staff.
 * ============================================================================
 *
 * Lives at /admin/<adminKey> (see src/config/sheets.ts). There are no
 * accounts: the full URL is the key, and the actual editing happens in the
 * Google Sheets themselves — which are protected by the owner's normal
 * Google login. This page is the mission control around that:
 *
 *   - shows whether the app is reading the live sheets, a cached copy, or
 *     the built-in fallback (and exactly why, when something's wrong)
 *   - previews the course and sponsors the way the app will show players
 *   - flags data problems (missing distances, double-sold holes, …)
 *   - tracks which holes still need photos
 *   - links straight into the sheets and the Drive photos folder to edit
 * ----------------------------------------------------------------------------
 */

export default function AdminPage() {
  const params = useParams<{ key: string }>();

  // The "login": the secret part of the URL must match. A wrong key gets a
  // dead-end page with no hints.
  if (params.key !== sheetsConfig.adminKey) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center text-brand-stone">
        <p>There&apos;s nothing at this address.</p>
      </main>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const {
    course,
    warnings: courseWarnings,
    status: courseStatus,
    refresh: refreshCourse,
  } = useLiveCourse();
  const {
    sponsors,
    status: sponsorStatus,
    refresh: refreshSponsors,
  } = useLiveSponsors();

  if (!course) return null; // can't happen for the default course

  // Same rule as activeSponsors in lib/sponsors, kept as SheetSponsor[] so
  // the rows can show their pipeline stage.
  const live = sponsors.filter((s) => s.status === "active");

  // The same loud validation the config sponsors get at build time (double-
  // sold holes, a holeId that isn't on the course, duplicate ids) — but for
  // sheet data it can't be allowed to crash a page, so it lands here as a
  // warning instead.
  const sponsorWarnings: string[] = [];
  try {
    validateSponsors(course.id, sponsors, course);
  } catch (err) {
    sponsorWarnings.push(err instanceof Error ? err.message : String(err));
  }

  const holesWithPhotos = course.holes.filter((h) => h.teePhoto).length;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-16 pt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-ink">
            Course admin
          </h1>
          <p className="mt-1 text-brand-stone">
            {course.name} · {course.location}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-brand-deepPine underline"
        >
          View the app →
        </Link>
      </header>

      {/* ------------------------------------------------ data connections */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <StatusCard
          title="Course sheet"
          status={courseStatus}
          onRefresh={refreshCourse}
          editUrl={sheetsConfig.links.courseWorksheet}
          summary={`${course.holes.length} holes · par ${coursePar(course)}`}
        />
        <StatusCard
          title="Sponsor sheet"
          status={sponsorStatus}
          onRefresh={refreshSponsors}
          editUrl={sheetsConfig.links.sponsorTracker}
          summary={
            sponsorStatus.configured
              ? `${live.length} live in the app · ${sponsors.length} in the pipeline`
              : "No sponsors shown in the app yet"
          }
        />
      </section>

      {(!courseStatus.configured || !sponsorStatus.configured) && <SetupCard />}

      {/* --------------------------------------------------- data warnings */}
      {(courseWarnings.length > 0 || sponsorWarnings.length > 0) && (
        <section className="mt-4 rounded-2xl border border-brand-penalty/40 bg-brand-penalty/5 p-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.06em] text-brand-penalty">
            Worth a look
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-ink">
            {[...courseWarnings, ...sponsorWarnings].map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ----------------------------------------------------- the course */}
      <section className="mt-8">
        <SectionHeader
          title="Course"
          hint="Players see this on the course page and while scoring."
          action={
            <Link
              href="/course"
              className="text-sm font-semibold text-brand-deepPine underline"
            >
              Preview as a player →
            </Link>
          }
        />
        <div className="mt-3 overflow-x-auto rounded-2xl border border-brand-line bg-brand-card shadow-sm">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs font-semibold uppercase tracking-wide text-brand-stone">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2 text-right">Yards</th>
                <th className="px-3 py-2 text-right">Par</th>
                <th className="px-3 py-2">Hazards / notes</th>
                <th className="px-3 py-2">Photo</th>
                <th className="px-3 py-2">Sponsor</th>
              </tr>
            </thead>
            <tbody>
              {course.holes.map((hole) => (
                <tr key={hole.number} className="border-b border-brand-line/60 last:border-0">
                  <td className="px-3 py-2 font-bold text-brand-ink">{hole.number}</td>
                  <td className="px-3 py-2 font-semibold text-brand-ink">
                    {hole.name ?? <Missing />}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {hole.distanceYards ?? <Missing />}
                  </td>
                  <td className="px-3 py-2 text-right">{holePar(hole)}</td>
                  <td className="max-w-[16rem] px-3 py-2 text-brand-stone">
                    {[hole.hazards, hole.note].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {hole.teePhoto ? (
                      <span className="font-bold text-brand-primary">✓</span>
                    ) : (
                      <span className="text-brand-stone">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-brand-stone">
                    {holeSponsor(sponsors, hole.number)?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-brand-stone">
          To change hole names, distances, or anything above: edit the course
          sheet, then refresh here. Course-wide info (start point, house rules,
          out of bounds) lives on its Course Info tab.
        </p>
      </section>

      {/* ------------------------------------------------------- sponsors */}
      <section className="mt-8">
        <SectionHeader
          title="Sponsors"
          hint='Only rows with status "Active" (or "Renewed") appear in the app.'
        />
        {sponsors.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-brand-line bg-brand-card p-4 text-sm text-brand-stone">
            {sponsorStatus.configured
              ? "No sponsor rows found in the sheet yet."
              : "Connect the sponsor sheet to show sponsors in the app — see setup above."}
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {live.map((sponsor) => (
                <SponsorRow key={sponsor.id} sponsor={sponsor} />
              ))}
              {live.length === 0 && (
                <p className="rounded-2xl border border-brand-line bg-brand-card p-4 text-sm text-brand-stone">
                  Nothing live yet — set a sponsor&apos;s Status to
                  &quot;Active&quot; in the sheet once their logo is in and the
                  sign is up.
                </p>
              )}
            </div>
            <PipelineSummary sponsors={sponsors} />
          </>
        )}
      </section>

      {/* --------------------------------------------------------- photos */}
      <section className="mt-8">
        <SectionHeader
          title="Photos"
          hint={`${holesWithPhotos} of ${course.holes.length} holes have a tee photo.`}
          action={
            <a
              href={sheetsConfig.links.photosFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand-deepPine underline"
            >
              Open the photos folder →
            </a>
          }
        />
        <ol className="mt-3 list-decimal space-y-1.5 rounded-2xl border border-brand-line bg-brand-card p-4 pl-9 text-sm text-brand-ink">
          <li>
            Upload the photo to the{" "}
            <a
              href={sheetsConfig.links.photosFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-deepPine underline"
            >
              Course Photos folder
            </a>{" "}
            in Google Drive.
          </li>
          <li>
            Right-click the photo → <b>Share</b> → set to{" "}
            <b>Anyone with the link</b> → <b>Copy link</b>.
          </li>
          <li>
            Paste that link into a <b>Photo URL</b> column on the Hole Details
            tab of the course sheet (add the column once if it isn&apos;t
            there). The app turns Drive links into images automatically.
          </li>
          <li>
            For the big course photo at the top of the course page, add a row
            named <b>Hero photo URL</b> to the Course Info tab.
          </li>
        </ol>
      </section>

      {/* ------------------------------------------------- about this page */}
      <footer className="mt-10 border-t border-brand-line pt-4 text-xs text-brand-stone">
        <p>
          <b>About this page:</b> the address of this page is the key — anyone
          with the full URL can see it (players can&apos;t stumble onto it, and
          search engines are told to ignore it). Editing always happens in
          Google Sheets behind your normal Google login. To change the key,
          edit <code>adminKey</code> in <code>src/config/sheets.ts</code> and
          share the new link with staff.
        </p>
      </footer>
    </main>
  );
}

/* ----------------------------------------------------------------------------
 * Pieces
 * ------------------------------------------------------------------------- */

function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 className="font-display text-xl font-extrabold text-brand-ink">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-sm text-brand-stone">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** One data connection: where the data is coming from + refresh/edit actions. */
function StatusCard({
  title,
  status,
  summary,
  onRefresh,
  editUrl,
}: {
  title: string;
  status: LiveStatus;
  summary: string;
  onRefresh: () => void;
  editUrl: string;
}) {
  const badge = !status.configured
    ? { label: "Not connected — using built-in data", tone: "bg-brand-line text-brand-stone" }
    : status.error
      ? { label: "Can't reach the sheet", tone: "bg-brand-penalty/15 text-brand-penalty" }
      : status.source === "live"
        ? { label: "Live from Google Sheets", tone: "bg-brand-primary/15 text-brand-deepPine" }
        : status.source === "cached"
          ? { label: "Showing last saved copy…", tone: "bg-brand-sunshine/40 text-brand-ink" }
          : { label: "Built-in data", tone: "bg-brand-line text-brand-stone" };

  return (
    <div className="rounded-2xl border border-brand-line bg-brand-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-bold text-brand-ink">{title}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge.tone}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-brand-stone">{summary}</p>
      {status.fetchedAt && !status.error && (
        <p className="mt-1 text-xs text-brand-stone">
          Updated {new Date(status.fetchedAt).toLocaleString()}
        </p>
      )}
      {status.error && (
        <p className="mt-2 rounded-xl bg-brand-penalty/5 p-2 text-xs text-brand-penalty">
          {status.error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-brand-primary px-3 py-1.5 text-sm font-bold text-white active:bg-brand-deepPine"
        >
          Edit in Google Sheets
        </a>
        {status.configured && (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-brand-line px-3 py-1.5 text-sm font-bold text-brand-ink active:bg-brand-cream"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

/** Shown until both sheet IDs are filled in — the one-time hookup steps. */
function SetupCard() {
  return (
    <section className="mt-4 rounded-2xl border-2 border-dashed border-brand-primary/40 bg-brand-primary/5 p-4">
      <h2 className="font-display font-bold text-brand-ink">
        One-time setup: connect the Google Sheets
      </h2>
      <p className="mt-1 text-sm text-brand-stone">
        Until a sheet is connected, the app runs happily on the course data
        built into it — connecting just means edits in the sheet show up in
        the app on their own.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-brand-ink">
        <li>
          Open the worksheet in Google Drive. If the name ends in{" "}
          <b>.xlsx</b>, use <b>File → Save as Google Sheets</b> first.
        </li>
        <li>
          <b>Share</b> → General access → <b>Anyone with the link</b> →{" "}
          <b>Viewer</b>.
        </li>
        <li>
          Copy the long ID from the address bar (between <code>/d/</code> and{" "}
          <code>/edit</code>) and paste it into{" "}
          <code>src/config/sheets.ts</code> (<code>courseSheetId</code> /{" "}
          <code>sponsorSheetId</code>) — or send it to whoever tends the code.
        </li>
      </ol>
      <p className="mt-3 rounded-xl bg-brand-sunshine/25 p-3 text-xs text-brand-ink">
        <b>For the sponsor sheet:</b> the full tracker has sponsor emails and
        phone numbers in it, and link-sharing would expose those. Make a small
        separate sheet with just <i>Business Name, Tier, Status, Hole #,
        Website, Logo URL</i> and share that one instead. The app never reads
        contact columns either way.
      </p>
    </section>
  );
}

function SponsorRow({ sponsor }: { sponsor: SheetSponsor }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-line bg-brand-card px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        {sponsor.logoUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={sponsor.logoUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
          />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-brand-ink">{sponsor.name}</p>
          {sponsor.url && (
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-brand-deepPine underline"
            >
              {sponsor.url}
            </a>
          )}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-bold text-brand-deepPine">
        {sponsor.tier === "hole" ? `Hole ${sponsor.holeId ?? "?"}` : "Digital"}
      </span>
    </div>
  );
}

/**
 * Counts of everyone NOT live in the app, grouped by the tracker's own
 * pipeline stage ("2 lead · 1 verbal yes"), so this doubles as a glance at
 * sponsor sales.
 */
function PipelineSummary({ sponsors }: { sponsors: SheetSponsor[] }) {
  const counts = new Map<string, number>();
  for (const sponsor of sponsors) {
    if (sponsor.status === "active") continue;
    const stage = sponsor.pipeline.toLowerCase();
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return (
    <p className="mt-3 text-sm text-brand-stone">
      Also in the pipeline:{" "}
      {[...counts.entries()]
        .map(([stage, count]) => `${count} ${stage}`)
        .join(" · ")}
      .
    </p>
  );
}

function Missing() {
  return <span className="font-semibold text-brand-penalty">missing</span>;
}
