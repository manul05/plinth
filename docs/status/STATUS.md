# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-05 complete (29/56 k0 vectors passing)
- **Branch / HEAD:** `development` at `2747dd2` (committing T-M1-05 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-05 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- keys` | `5/5` passed (after red `5/5` failure) | `2747dd2` + T-M1-05 |
| `npm.cmd test -- k0 -t "k0 kidOf"` | `7 passed | 49 skipped (56)` | `2747dd2` + T-M1-05 |
| `npm.cmd test -- portability` | `5/5` passed | `2747dd2` + T-M1-05 |
| `npm.cmd run typecheck` | exit 0 | `2747dd2` + T-M1-05 |
| `npm.cmd run lint` | `Checked 34 files ... No fixes applied.` (exit 0) | `2747dd2` + T-M1-05 |
| `npm.cmd run build` | exit 0 | `2747dd2` + T-M1-05 |

## Done recently
- T-M1-05: created `packages/ts/src/core/test-kids.ts`, implemented `packages/ts/src/core/keys.ts` (`thumbprintMembers`, `kidOf`, `jwkFromP256Spki`, `ed25519PublicJwk`, `isTestKid`), and added `packages/ts/test/core/keys.test.ts` (`5/5` + `7/7` k0 kidOf).
- T-M1-04 (`2747dd2`), T-M1-03 (`2005404`), T-M1-02 (`bcdea05`), T-M1-01 (`5fe5c8a`).

## Next step
1. **T-M1-06** (`docs/plan/M1-core.md`): implement strict DER ↔ P1363 in `packages/ts/src/core/der.ts` and `packages/ts/test/core/der.test.ts` (6 DER k0 vectors + 4 unit tests).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-05).
