# Claude Code — read this first

This repo ships a 12-skill handoff library in `.claude/skills/` written by the
project's original engineer. It is the project memory: rules, history, runbooks,
and campaigns. Trust it over guesswork, and keep it current.

**Before making ANY change to this repo, load `holey-buckets-change-control`.**
It classifies your change, names its gate and required evidence, and points to
the right sibling skill (debugging, validation, data safety, launch, etc.).

Quick routing:

- Something looks broken → `holey-buckets-debugging-playbook`
- Validating / writing a PR "Verified" section → `holey-buckets-validation-and-qa`
- Touching `types.ts`, `storage.ts`, or the saved-round shape → `holey-buckets-round-data-safety`
- Launch work (real course data, email capture, domain) → `holey-buckets-launch-campaign`
- "Why is it like this?" / "has this been tried?" → `holey-buckets-history-and-decisions`

House rules that override everything: a course is data, never hardcoded — and
so are sponsors; `branding.ts`, `src/config/courses/*.ts`, and
`src/config/sponsors/*.ts` stay editable by a non-developer;
never silently lose a saved round; every PR carries a "Verified" section
(390px render + `npm run build` + spot checks). Details and rationale live in
the skills, not here — this file is only the pointer.

When a change moves a fact that a skill states, update that skill in the same PR.
