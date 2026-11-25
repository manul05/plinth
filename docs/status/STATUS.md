# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M4 K4 Rule Packs** in progress (`T-M4-01` done)
- **Branch / HEAD:** `development` at `a237d0e` (committing T-M4-01 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M4-01 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- k4` | `35 failed (35)` (expected red skeleton) | `a237d0e` + T-M4-01 |
| `npm.cmd test -- portability` | `1 passed (1)` file / `5 passed (5)` tests | `a237d0e` + T-M4-01 |
| `npm.cmd run lint` | exit 0 | `a237d0e` + T-M4-01 |
| `npm.cmd run typecheck` | exit 0 | `a237d0e` + T-M4-01 |
| `npm.cmd run build` | exit 0 | `a237d0e` + T-M4-01 |

## Done recently
- T-M4-01: added `packages/ts/src/rulepack/{index,asof,load}.ts` stubs, `packages/ts/src/repo-tools/{yaml-subset,regex-lint,compile-packs}.ts` stubs, `packages/ts/src/index.ts` re-export, and red `k4-vectors.test.ts` (`35 failed (35)`).

## Next step
1. **T-M4-02** (`docs/plan/M4-rulepack.md`): implement `selectAsOf` and `localDate` in `packages/ts/src/rulepack/asof.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M4-01 to T-M4-08 one by one"`
