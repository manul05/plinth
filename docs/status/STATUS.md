# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-06 complete (35/56 k0 vectors passing)
- **Branch / HEAD:** `development` at `38ada80` (committing T-M1-06 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-06 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- der` | `4/4` passed (after red `4/4` failure) | `38ada80` + T-M1-06 |
| `npm.cmd test -- k0 -t "k0 (p1363ToDer|derToP1363)"` | `6 passed | 50 skipped (56)` | `38ada80` + T-M1-06 |
| `npm.cmd test -- portability` | `5/5` passed | `38ada80` + T-M1-06 |
| `npm.cmd run typecheck` | exit 0 | `38ada80` + T-M1-06 |
| `npm.cmd run lint` | `Checked 35 files ... No fixes applied.` (exit 0) | `38ada80` + T-M1-06 |
| `npm.cmd run build` | exit 0 | `38ada80` + T-M1-06 |

## Done recently
- T-M1-06: implemented `p1363ToDer` and strict `derToP1363` in `packages/ts/src/core/der.ts` and `packages/ts/test/core/der.test.ts` (`4/4` unit + `6/6` k0 DER vectors).
- T-M1-05 (`38ada80`), T-M1-04 (`2747dd2`), T-M1-03 (`2005404`), T-M1-02 (`bcdea05`), T-M1-01 (`5fe5c8a`).

## Next step
1. **T-M1-07** (`docs/plan/M1-core.md`): implement `signingInput`, `signEd25519`, `createEnvelope` in `envelope.ts` and `webauthnChallenge` in `webauthn.ts`, plus `packages/ts/test/core/envelope-sign.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-06).
