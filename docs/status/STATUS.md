# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M3 K2 Approvals** in progress (`T-M3-01` done)
- **Branch / HEAD:** `development` at `d20c53e` (committing T-M3-01 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M3-01 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run lint` | `Checked 57 files in 267ms. No fixes applied.` (exit 0) | `d20c53e` + T-M3-01 |
| `npm.cmd run typecheck` | exit 0 | `d20c53e` + T-M3-01 |
| `npm.cmd run build` | exit 0 | `d20c53e` + T-M3-01 |
| `npm.cmd test -- portability` | `1 passed (1)` file / `5 passed (5)` tests | `d20c53e` + T-M3-01 |
| `npm.cmd test -- k2` | `43 failed \| 2 passed (45)` (expected red skeleton; `jwkFromP256Spki` passes) | `d20c53e` + T-M3-01 |

## Done recently
- T-M3-01: added K2 approval module stubs (`packages/ts/src/approval/`), final `policies.ts`, `packages/ts/src/index.ts` re-export, and red golden-vector runner `packages/ts/test/approval/k2-vectors.test.ts` (`43 failed | 2 passed (45)`).

## Next step
1. **T-M3-02** (`docs/plan/M3-approvals.md`): implement `createApprovalRequest`, `matchingCode`, and `decisionPayload` in `packages/ts/src/approval/request.ts` + `packages/ts/test/approval/request.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"start T-M3-01 (reading STATUS.md and M3-approval.md)"`
