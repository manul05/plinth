# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-07 complete (37/56 k0 vectors passing)
- **Branch / HEAD:** `development` at `ab14c55` (committing T-M1-07 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-07 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- envelope-sign` | `2/2` passed (after red `2/2` failure) | `ab14c55` + T-M1-07 |
| `npm.cmd test -- k0 -t "k0 sign"` | `2 passed | 54 skipped (56)` | `ab14c55` + T-M1-07 |
| `npm.cmd test -- portability` | `5/5` passed | `ab14c55` + T-M1-07 |
| `npm.cmd run typecheck` | exit 0 | `ab14c55` + T-M1-07 |
| `npm.cmd run lint` | `Checked 36 files ... No fixes applied.` (exit 0) | `ab14c55` + T-M1-07 |
| `npm.cmd run build` | exit 0 | `ab14c55` + T-M1-07 |

## Done recently
- T-M1-07: implemented `signingInput`, `webauthnChallenge`, `signEd25519`, and `createEnvelope` in `packages/ts/src/core/envelope.ts` and added `packages/ts/test/core/envelope-sign.test.ts` (`2/2` unit + `2/2` k0 signing vectors).
- T-M1-06 (`ab14c55`), T-M1-05 (`38ada80`), T-M1-04 (`2747dd2`), T-M1-03 (`2005404`), T-M1-02 (`bcdea05`), T-M1-01 (`5fe5c8a`).

## Next step
1. **T-M1-08** (`docs/plan/M1-core.md`): implement `verifyEnvelope` for Ed25519 and ES256 in `packages/ts/src/core/envelope.ts` and `packages/ts/test/core/envelope.test.ts` (bringing k0 vectors to `56/56`).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-07).
