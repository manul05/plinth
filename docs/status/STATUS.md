# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M4 K4 Rule Packs** in progress (`T-M4-06` done)
- **Branch / HEAD:** `development` at `a4f909e` (committing T-M4-06 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M4-06 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- k4` | `39 passed (39)` | `a4f909e` + T-M4-06 |
| `npm.cmd run packs:build` | `packs: 4 compiled, 35 rules, 70 tests` | `a4f909e` + T-M4-06 |
| `npm.cmd run packs:check` | `packs: up to date` | `a4f909e` + T-M4-06 |
| `npm.cmd run check` | `lint` 0 (`77` files), `typecheck` 0, `vitest` `260/260` (`31` files), `build` 0 | `a4f909e` + T-M4-06 |

## Done recently
- T-M4-06: implemented `compilePacks` and CLI in `packages/ts/src/repo-tools/compile-packs.ts`, added `packs:build` / `packs:check` scripts in `package.json`, compiled all 4 packs (`35` rules, `70` tests) into `packs/` and `packages/ts/src/packs/builtin.ts`, and created `packages/ts/src/packs/index.ts`.

## Next step
1. **T-M4-07** (`docs/plan/M4-rulepack.md`): implement `loadPack` (`packages/ts/src/rulepack/load.ts`) and `activeRules` (`packages/ts/src/rulepack/asof.ts`).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M4-01 to T-M4-08 one by one"`
