---
name: verify
description: Build, launch, and drive the Holey Buckets app to verify a change end-to-end.
---

# Verifying Holey Buckets changes

Next.js 14 app, no backend — everything runs in the browser off config +
localStorage (+ optional Google Sheets fetched client-side).

## Build & launch

```bash
npm install                 # once per container
npm run build               # catches type errors (vitest does NOT typecheck)
npm start                   # production server on :3000
# or: npx next dev -p 3001  # when you need config edits picked up on reload
```

## Drive it (Playwright)

Playwright isn't a project dep — install it in the scratchpad dir, and use the
preinstalled browser:

```js
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
```

Flows worth driving:
- **Course page** `/course` — hero, hole list, distances, pars, sponsors.
- **Play loop** — `/start` → fill "e.g. The Bachelor Party" placeholder +
  "Player 1" → `Start round` button → `/play/<id>`; stepper buttons are
  `Add a stroke for <name>`; hole jump strip buttons are `Go to hole <n>`.
- **Admin panel** — `/admin/<adminKey from src/config/sheets.ts>`; a wrong key
  must show only "There's nothing at this address."

## Gotchas

- Many labels are CSS-uppercased — match `innerText` case-insensitively.
- To exercise the **live Google Sheets path** without a real sheet: set
  `courseSheetId`/`sponsorSheetId` in `src/config/sheets.ts` to any non-empty
  string, run the dev server, and `page.route("https://docs.google.com/**", …)`
  to serve fixture CSV (see `sheetCsvUrl` in src/lib/sheets.ts for the URL
  shape; the Course Info tab request contains `Course%20Info`). Serve HTML
  instead to test the failure/fallback path. Revert the config after.
- Sheet data is cached in localStorage (`holeybuckets:sheets:*`) — use a fresh
  browser context to test cold-start behavior.
