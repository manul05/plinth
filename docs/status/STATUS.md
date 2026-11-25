# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-04 complete (22/56 k0 vectors passing)
- **Branch / HEAD:** `development` at `2005404` (committing T-M1-04 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-04 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- jcs` | `2/2` passed (after red `2/2` failure) | `2005404` + T-M1-04 |
| `npm.cmd test -- k0 -t "k0 parseAndCanonicalize"` | `22 passed | 34 skipped (56)` | `2005404` + T-M1-04 |
| `npm.cmd test -- portability` | `5/5` passed | `2005404` + T-M1-04 |
| `npm.cmd run typecheck` | exit 0 | `2005404` + T-M1-04 |
| `npm.cmd run lint` | `Checked 32 files ... No fixes applied.` (exit 0) | `2005404` + T-M1-04 |
| `npm.cmd run build` | exit 0 | `2005404` + T-M1-04 |

## Done recently
- T-M1-04: implemented `packages/ts/src/core/jcs.ts` (`canonicalize`, `digest`, `digestBytes`, `GENESIS_DIGEST`) and `packages/ts/test/core/jcs.test.ts` (`2/2`); all 22 `k0 parseAndCanonicalize` vectors pass.
- T-M1-03 (`2005404`), T-M1-02 (`bcdea05`), T-M1-01 (`5fe5c8a`).

## Next step
1. **T-M1-05** (`docs/plan/M1-core.md`): implement `packages/ts/src/core/keys.ts` and `test-kids.ts` (thumbprint, `kidOf`, `jwkFromP256Spki`, `ed25519PublicJwk`, `TEST_KIDS`, `isTestKid`), turning the 7 `kidOf` k0 vectors + 2 `jwkFromP256Spki` k2 vectors green (plus **T-M1-06** `der.ts` and **T-M1-10** `ids.ts` are unblocked).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-04).
