# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-03 complete
- **Branch / HEAD:** `development` at `bcdea05` (committing T-M1-03 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-03 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- json` | `3/3` passed (after red `3/3` failure) | `bcdea05` + T-M1-03 |
| `npm.cmd test -- portability` | `5/5` passed | `bcdea05` + T-M1-03 |
| `npm.cmd run typecheck` | exit 0 | `bcdea05` + T-M1-03 |
| `npm.cmd run lint` | `Checked 31 files ... No fixes applied.` (exit 0) | `bcdea05` + T-M1-03 |
| `npm.cmd run build` | exit 0 | `bcdea05` + T-M1-03 |

## Done recently
- T-M1-03: implemented strict I-JSON parser in `packages/ts/src/core/json.ts` (`parseJson`, `MAX_DEPTH = 64`) and `packages/ts/test/core/json.test.ts` (`3/3`).
- T-M1-02 (`bcdea05`): `bytes.ts` (`3/3`).
- T-M1-01 (`5fe5c8a`): red skeleton k0 runner (`56/56` red).

## Next step
1. **T-M1-04** (`docs/plan/M1-core.md`): implement `packages/ts/src/core/jcs.ts` (`canonicalize`, `digest`, `digestBytes`, `GENESIS_DIGEST`) and `packages/ts/test/core/jcs.test.ts`, turning all 22 `parseAndCanonicalize` k0 vectors green.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-03).
