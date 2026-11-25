# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M4 K4 Rule Packs** in progress (`T-M4-02` done)
- **Branch / HEAD:** `development` at `716d5e5` (committing T-M4-02 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M4-02 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- k4 -t k4 selectAsOf` | `4 passed \| 32 skipped (36)` | `716d5e5` + T-M4-02 |
| `npm.cmd test -- k4 -t k4 localDate` | `5 passed \| 31 skipped (36)` | `716d5e5` + T-M4-02 |
| `npm.cmd test -- portability` | `1 passed (1)` file / `5 passed (5)` tests | `716d5e5` + T-M4-02 |
| `npm.cmd run lint` | exit 0 | `716d5e5` + T-M4-02 |
| `npm.cmd run typecheck` | exit 0 | `716d5e5` + T-M4-02 |
| `npm.cmd run build` | exit 0 | `716d5e5` + T-M4-02 |

## Done recently
- T-M4-02: implemented `selectAsOf` and `localDate` in `packages/ts/src/rulepack/asof.ts` and added invalid-timestamp negative test (`PK_ENCODING_INVALID`) in `k4-vectors.test.ts`.

## Next step
1. **T-M4-03** (`docs/plan/M4-rulepack.md`): implement YAML safe subset reader (`packages/ts/src/repo-tools/yaml-subset.ts`).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M4-01 to T-M4-08 one by one"`
