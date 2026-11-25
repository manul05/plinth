# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-08 complete (**56/56 k0 vectors passing**)
- **Branch / HEAD:** `development` at `2af0a1f` (committing T-M1-08 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-08 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`Checked 37 files`), `typecheck` 0, `vitest` `100/100` (`15` files, `k0-vectors` `56/56`, `envelope` `3/3`), `build` 0 | `2af0a1f` + T-M1-08 |

## Done recently
- T-M1-08: implemented fail-closed `verifyEnvelope` for Ed25519 and ES256 (with `lowS: false` and normative 8-step check order) in `packages/ts/src/core/envelope.ts`, added internal `verifyWebauthnSignature` stub in `webauthn.ts`, and added `packages/ts/test/core/envelope.test.ts` (`3/3` + `56/56` k0 vectors).
- T-M1-07 (`2af0a1f`), T-M1-06 (`ab14c55`), T-M1-05 (`38ada80`), T-M1-04 (`2747dd2`), T-M1-03 (`2005404`), T-M1-02 (`bcdea05`), T-M1-01 (`5fe5c8a`).

## Next step
1. **T-M1-09** (`docs/plan/M1-core.md`): implement WebAuthn-ES256 signature entries (`verifyWebauthnSignature` and `signatureFromAssertion` in `packages/ts/src/core/webauthn.ts` + `packages/ts/test/core/webauthn.test.ts`; **T-M1-10** `ids.ts` is also unblocked).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-08).
