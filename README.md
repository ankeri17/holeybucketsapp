# Holey Buckets App

The official digital companion to **Holey Buckets** — a mobile-first web app
where a group can score a round of bucket golf on their phones or print a paper
scorecard. Built flagship-first for the Osceola, WI course, but architected so a
"course" is just data — the same app works for any future course on any property.

A **Four Irons** game. (Each course carries its own host — Osceola is hosted by
Hello Again Properties.)

> **Status:** Milestones 1–6 shipped — the full play loop works end to end:
> start a round, score it hole by hole, see live standings, share a branded
> result card, and print blank or completed PDF scorecards. Next up: email
> capture + booking link (7) and PWA/offline (8).

---

## What's here so far

The complete MVP play loop, all running on the player's phone with no backend:
the landing page, a course preview, the start-a-round flow, the scoring screen
(with chip-in bonus, penalty counter, and per-ball tracking), a live
leaderboard, branded results with a shareable image, and PDF scorecards.

## The two files you'll most likely want to edit

You don't need to be a developer to change these:

1. **`src/config/branding.ts`** — the app's name, tagline, colors, parent brand,
   and the "Book your round" button link. Change it here and the whole app
   re-skins. It's heavily commented.
2. **`src/config/courses/osceola.ts`** — the Osceola holes (names, distances,
   hazards, notes). It's the one file to edit to set up the real course; the
   values in there now are placeholders until the owner's worksheet arrives.
   Dropping in the real layout is a one-file change — nothing else moves.

## Run it on your computer

You need [Node.js](https://nodejs.org) (version 18 or newer) installed. Then, in
a terminal inside this folder:

```bash
npm install      # one-time: download what the app needs
npm run dev      # start the app locally
```

Open <http://localhost:3000> in your browser. The page reloads as you edit.

For development there are also:

```bash
npm test         # run the scoring/round/storage tests
npm run lint     # check code style
```

Every pull request runs these automatically (see `.github/workflows/ci.yml`),
so a broken change can't reach the live site.

## House rules (as the app enforces them)

The scoring rules live in one file — `src/lib/scoring.ts` — and every screen,
the PDF, and the share image read from it. As encoded today:

- **Every hole is a par 3.**
- **Hole score** = strokes taken, **minus 1** if you chipped the ball into the
  bucket, **plus 1 per penalty** (foliage, water, out of bounds, lost ball).
- A hole score can be **zero** (chip in on your very first throw), but never
  below zero.
- **Lowest total wins** (Stroke Play). Ties share a rank, golf style.
- Landing on a hole records **par for everyone by default**; scores stay
  marked as "assumed par" (shown in italics on the scorecard) until someone
  actually adjusts them.
- **Balls used/lost** is a separate per-player tally for venues that charge
  per ball — it never affects the score.

If any of these don't match how the game is really played, the fix goes in
`src/lib/scoring.ts` (and its tests in `src/lib/scoring.test.ts`).

## Known constraints (fine for the MVP, by design)

- **One course.** The start flow always uses the default course; a course
  picker arrives with Phase 2's owner-created courses.
- **The scorecard assumes 18 holes** (a front nine and a back nine). A course
  with a different hole count will render, but the OUT/IN split will look odd.
- **Rounds live on one phone.** There's no backend, so a group shares one
  scoring phone. The round survives refreshes and can be resumed from the
  landing page, but it can't be viewed from another device.
- **No analytics yet** — decide on a lightweight option before launch if
  measuring the share-card word-of-mouth loop matters.

## Launch checklist

Things to do before pointing real players at this:

- [ ] Replace the placeholder holes in `src/config/courses/osceola.ts` with
      the owner's real course worksheet (names, paces, hazards, photos).
- [ ] Drop the real course + tee photos into `public/courses/grayduck/`.
- [ ] Point `siteUrl` in `src/config/branding.ts` at the real domain — it's
      baked into every shared result image, permanently.
- [ ] Set the real booking/contact URL in `bookingCta` (used by Milestone 7).
- [ ] Confirm the house rules above with the owner — especially the
      zero-score chip-in and default-to-par behaviors.

## Deploy it (Netlify)

This is the founder-friendly path — once it's set up, you never touch a
terminal to deploy:

1. Push this repo to GitHub (already connected).
2. In [Netlify](https://app.netlify.com), choose **Add new site → Import an
   existing project** and pick this repository.
3. Netlify reads `netlify.toml` automatically — no settings to fill in. Click
   **Deploy**.
4. **Netlify publishes from the `main` branch.** Day-to-day work merges into
   the default working branch; to release, open a pull request from the
   working branch into `main` and merge it — Netlify rebuilds and publishes
   the live site automatically on every merge to `main`.

## Tech choices (plain English)

- **Next.js + React + TypeScript** — a popular, well-supported foundation for
  web apps.
- **Tailwind CSS** — styling done with small utility classes, fast to tweak.
- **No backend / no database / no logins (for now)** — a round is kept in your
  phone's own storage, so there's nothing to host or pay for yet. A lightweight
  backend comes later (Phase 2) for saved leaderboards and owner-created courses.

## Roadmap (build order)

1. ✅ Scaffold + deploy a near-empty app to Netlify.
2. ✅ Course data model + placeholder Osceola course from config (view at `/course`).
3. ✅ Start-a-round flow (group name, add players, pick format).
4. ✅ Scoring screen (big +/−, bucket-chip toggle, foliage penalty, live totals).
5. ✅ Branded results + final scorecard + shareable image.
6. ✅ PDF scorecard generator (blank + completed round).
7. ⬜ Email capture + booking link + brand polish.
8. ⬜ PWA + offline support.
