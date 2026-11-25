# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M4 K4 Rule Packs complete** (`T-M4-01`..`T-M4-08` done); ready for **M5 K5 Detection**
- **Branch / HEAD:** `development` at `f5eaf88` (committing and pushing T-M4-08 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M4-08 commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- packs-check` | `1 passed (1)` file / `2 passed (2)` tests | `f5eaf88` + T-M4-08 |
| `npm.cmd run check` | `lint` 0 (`79` files), `typecheck` 0, `vitest` `268/268` (`33` files), `build` 0, `packs:check` (`packs: up to date`) | `f5eaf88` + T-M4-08 |

## Done recently
- Completed **M4 K4 Rule Packs (`T-M4-01`..`T-M4-08`)**: all 35 `k4` golden vectors passing, 4 rule packs (`35` rules, `70` tests) compiled cleanly into `packs/` and `packages/ts/src/packs/builtin.ts`, `loadPack` and `activeRules` tested, `packs-check.test.ts` added, and `npm run packs:check` wired into `.github/workflows/ci.yml` and `package.json` `check`.

## Next step
1. **T-M5-01** (`docs/plan/M5-detection.md`): red skeleton for `k5` golden vectors and compiled rule-pack test suite.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M4-01 to T-M4-08 one by one"`
