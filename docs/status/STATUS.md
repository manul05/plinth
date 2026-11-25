# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M5 K5 Detection in progress** (`T-M5-01` done)
- **Branch / HEAD:** `development` at `7b76af6` + T-M5-01 (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M5-01 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run lint` | `87` files checked, 0 errors | `7b76af6` + T-M5-01 |
| `npm.cmd run typecheck` | passed (0 errors) | `7b76af6` + T-M5-01 |
| `npm.cmd test -- k5 pack-tests` | `2 failed (2)` files / `90 failed (90)` tests (20 k5 + 70 pack tests, expected red) | `7b76af6` + T-M5-01 |

## Done recently
- **T-M5-01** (`docs/plan/M5-detection.md`): created `packages/ts/src/detect/` stubs, re-exported from `packages/ts/src/index.ts`, and added `k5-vectors.test.ts` (20) + `pack-tests.test.ts` (70).

## Next step
1. **T-M5-02** (`docs/plan/M5-detection.md`): implement `validators.ts`, `entropy.ts`, and `mask.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development (stop at T-M5-09 / owner gate G-K5)."`
