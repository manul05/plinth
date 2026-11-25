# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-02 complete
- **Branch / HEAD:** `development` at `5fe5c8a` (committing T-M1-02 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-02 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- bytes` | `3/3` passed (after red `3/3` failure) | `5fe5c8a` + T-M1-02 |
| `npm.cmd test -- portability` | `5/5` passed | `5fe5c8a` + T-M1-02 |
| `npm.cmd run typecheck` | exit 0 | `5fe5c8a` + T-M1-02 |
| `npm.cmd run lint` | `Checked 30 files ... No fixes applied.` (exit 0) | `5fe5c8a` + T-M1-02 |
| `npm.cmd run build` | exit 0 | `5fe5c8a` + T-M1-02 |

## Done recently
- T-M1-02: implemented `packages/ts/src/core/bytes.ts` (`b64urlEncode`, `b64urlDecode`, `hexEncode`, `hexDecode`, `utf8Encode`, `sha256Bytes`) and `packages/ts/test/core/bytes.test.ts` (`3/3`).
- T-M1-01 (`5fe5c8a`): red skeleton k0 runner (`56/56` red).
- M0 closed (`5e4bc4b`).

## Next step
1. **T-M1-03** (`docs/plan/M1-core.md`): implement `packages/ts/src/core/json.ts` (strict I-JSON parser) and `packages/ts/test/core/json.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-02).
