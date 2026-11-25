# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-06 complete locally (T-M0-05 push pending workflow scope)
- **Branch / HEAD:** `development` at `1d40052` (local, ahead of `origin/development` `3404b4e`; committing T-M0-06 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** local commits ahead of `origin/development` (`1d40052` T-M0-05 pending `workflow` OAuth scope push + Actions runs).

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test` (`vitest run`) | `Test Files  6 passed (6)`, `Tests  20 passed (20)` (`portability.test.ts` 5/5) | `1d40052` + T-M0-06 |
| `npm.cmd run typecheck` | exit 0 | `1d40052` + T-M0-06 |
| `npm.cmd run lint` (`biome check .`) | `Checked 17 files ... No fixes applied.` (exit 0) | `1d40052` + T-M0-06 |
| `npm.cmd run build` | exit 0 | `1d40052` |

## Done recently
- T-M0-06: added `packages/ts/test/portability.test.ts` guarding library code against `node:*`, `eval`, `new Function`, `require`, `fetch`, `console`, tool-only imports, and `tools/` importing `repo-tools/`.
- T-M0-05 (`1d40052`, local only): added `.github/workflows/ci.yml`, `packages/ts/test/workflows.test.ts`, updated `security-scan.yml` and `dependabot.yml`; push blocked on GitHub OAuth `workflow` scope.
- T-M0-04 + ADR-0017 (`3404b4e`), T-M0-03 (`57e3b33`), T-M0-02 (`37dda40`), ADR-0016 (`8d3149f`), T-M0-01 (`08b339f`).

## Next step
1. **T-M0-07** (`docs/plan/M0-setup.md`): add `packages/ts/src/errors.ts`, `packages/ts/test/errors.test.ts`, export from `packages/ts/src/index.ts`.
2. Push `development` (owner pushes or grants `workflow` scope) and run `ci` + `security-scan` workflows to finish **T-M0-05** and **T-M0-08**.

## Blocked on / questions for the owner
- Pushing `.github/workflows/ci.yml` (`1d40052`) requires `workflow` OAuth scope (or owner push from terminal).
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"Continue locally"` (proceed locally with T-M0-06 and T-M0-07 while T-M0-05 push awaits `workflow` scope).
