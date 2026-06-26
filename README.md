# Holey Buckets App

The official digital companion to **Holey Buckets** — a mobile-first web app
where a group can score a round of bucket golf on their phones or print a paper
scorecard. Built flagship-first for the Osceola, WI course, but architected so a
"course" is just data — the same app works for any future course on any property.

A **Four Irons** game. (Each course carries its own host — Osceola is hosted by
Hello Again Properties.)

> **Status:** Milestone 1 — scaffolded app deploying to Netlify. Scoring,
> leaderboard, results, and PDF features land in the next milestones.

---

## What's here so far

A near-empty but fully-branded Next.js app whose only job right now is to prove
the deploy pipeline works end to end (push → Netlify → live URL). Everything is
set up so features can be added in small, reviewable chunks.

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

## Deploy it (Netlify)

This is the founder-friendly path — once it's set up, you never touch a
terminal to deploy:

1. Push this repo to GitHub (already connected).
2. In [Netlify](https://app.netlify.com), choose **Add new site → Import an
   existing project** and pick this repository.
3. Netlify reads `netlify.toml` automatically — no settings to fill in. Click
   **Deploy**.
4. Every time changes are pushed to the repo, Netlify rebuilds and publishes the
   live site automatically.

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
3. ⬜ Start-a-round flow (group name, add players, pick format).
4. ⬜ Scoring screen (big +/−, bucket-chip toggle, live totals).
5. ⬜ Leaderboard + results + shareable branded image.
6. ⬜ PDF scorecard generator (blank + completed round).
7. ⬜ Email capture + booking link + brand polish.
8. ⬜ PWA + offline support.
