# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-10 complete
- **Branch / HEAD:** `development` at `251b07f` (committing T-M1-10 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-10 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- ids` | `3/3` passed (after red `3/3` failure) | `251b07f` + T-M1-10 |
| `npm.cmd test -- portability` | `5/5` passed | `251b07f` + T-M1-10 |
| `npm.cmd run typecheck` | exit 0 | `251b07f` + T-M1-10 |
| `npm.cmd run lint` | `Checked 39 files ... No fixes applied.` (exit 0) | `251b07f` + T-M1-10 |
| `npm.cmd run build` | exit 0 | `251b07f` + T-M1-10 |

## Done recently
- T-M1-10: implemented `newUuidV7`, `newNonce`, `isTimestamp`, and `timestampFromMs` in `packages/ts/src/core/ids.ts` and added `packages/ts/test/core/ids.test.ts` (`3/3`).
- T-M1-09 (`251b07f`), T-M1-08 (`fbfe196`), T-M1-07 (`2af0a1f`), T-M1-06 (`ab14c55`), T-M1-05 (`38ada80`), T-M1-04 (`2747dd2`), T-M1-03 (`2005404`), T-M1-02 (`bcdea05`), T-M1-01 (`5fe5c8a`).

## Next step
1. **T-M1-11** (`docs/plan/M1-core.md`): M1 close — mutation checks `MC-1`, `MC-2`, `MC-5`, add `DNB-002` to `docs/do-not-break.md`, and run `npm.cmd run check`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-10).
