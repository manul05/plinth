# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M1 K0 Core** — T-M1-01 complete (56 red k0 vector tests)
- **Branch / HEAD:** `development` at `5e4bc4b` (committing T-M1-01 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M1-01 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- k0` | `Tests  56 failed (56)` (expected red skeleton) | `5e4bc4b` + T-M1-01 |
| `npm.cmd run typecheck` | exit 0 | `5e4bc4b` + T-M1-01 |
| `npm.cmd run lint` | exit 0 (after fixing `envelope.ts` line wrap) | `5e4bc4b` + T-M1-01 |
| `npm.cmd test -- packages/ts/test/portability.test.ts` | `5/5` passed | `5e4bc4b` + T-M1-01 |
| GitHub Actions `ci` (`workflow_dispatch`) | **success** — https://github.com/manul05/plinth/actions/runs/45594433624 | `5e4bc4b` |

## Done recently
- T-M1-01: created `packages/ts/test/core/k0-vectors.test.ts` and stubbed all 9 files in `packages/ts/src/core/`, re-exported in `packages/ts/src/index.ts`; verified `56/56` failing k0 vector tests and clean typecheck/lint.
- M0 closed (`5e4bc4b`): `ci` and `security-scan` green.

## Next step
1. **T-M1-02** (`docs/plan/M1-core.md`): implement `packages/ts/src/core/bytes.ts` (`b64urlEncode`, `b64urlDecode`, `hexEncode`, `hexDecode`, `utf8Encode`, `sha256Bytes`) and `packages/ts/test/core/bytes.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M1-01).
