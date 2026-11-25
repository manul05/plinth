# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-06 and T-M0-07 complete locally; T-M0-05 push + CI runs blocked on GitHub OAuth `workflow` scope
- **Branch / HEAD:** `development` at `7257de7` (committing T-M0-07 locally next; local commits `1d40052`, `7257de7` ahead of `origin/development` `3404b4e`; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M0-07 commit; 3 local commits ahead of `origin/development` awaiting `workflow` scope push.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test` (`vitest run`) | `Test Files  7 passed (7)`, `Tests  22 passed (22)` (`errors.test.ts` 2/2 after red failure) | `7257de7` + T-M0-07 |
| `npm.cmd run typecheck` | exit 0 | `7257de7` + T-M0-07 |
| `npm.cmd run lint` (`biome check .`) | `Checked 19 files in 403ms. No fixes applied.` (exit 0) | `7257de7` + T-M0-07 |
| `npm.cmd run build` | exit 0 (`packages/ts/dist/{index,errors}.{js,d.ts}`) | `7257de7` + T-M0-07 |

## Done recently
- T-M0-07: added `packages/ts/src/errors.ts` (`ERROR_MESSAGES` 97 entries, `PlinthError`), exported from `packages/ts/src/index.ts`, verified red-then-green (`22/22` total tests).
- T-M0-06 (`7257de7`, local): portability guard (`packages/ts/test/portability.test.ts`).
- T-M0-05 (`1d40052`, local): `.github/workflows/ci.yml`, `workflows.test.ts`, `security-scan.yml`, `dependabot.yml` (push rejected without `workflow` OAuth scope).
- T-M0-04 + ADR-0017 (`3404b4e`), T-M0-03 (`57e3b33`), T-M0-02 (`37dda40`), ADR-0016 (`8d3149f`), T-M0-01 (`08b339f`).

## Next step
1. Push `development` (owner runs `git push origin development` or grants `gh auth refresh -s workflow`), run `ci` and `security-scan` via `workflow_dispatch`, verify both green, and mark **T-M0-05** `done`.
2. **T-M0-08** (`docs/plan/M0-setup.md`): close M0 (`npm ci`, `npm run check`, push, CI green), then start **M1 (T-M1-01)**.

## Blocked on / questions for the owner
- Pushing `.github/workflows/ci.yml` (`1d40052`) requires `workflow` OAuth scope (current token has `gist, read:org, repo`).
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"Continue locally"`.
