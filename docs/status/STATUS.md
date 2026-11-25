# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M3 K2 Approvals** in progress (`T-M3-02` done)
- **Branch / HEAD:** `development` at `f4b9743` (committing T-M3-02 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M3-02 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- request` | `1 passed (1)` file / `4 passed (4)` tests | `f4b9743` + T-M3-02 |
| `npm.cmd test -- k2` | `41 failed \| 4 passed (45)` (`matchingCode` 2/2, `jwkFromP256Spki` 2/2) | `f4b9743` + T-M3-02 |
| `npm.cmd test -- portability` | `1 passed (1)` file / `5 passed (5)` tests | `f4b9743` + T-M3-02 |
| `npm.cmd run lint` | `Checked 58 files in 391ms. No fixes applied.` (exit 0) | `f4b9743` + T-M3-02 |
| `npm.cmd run typecheck` | exit 0 | `f4b9743` + T-M3-02 |
| `npm.cmd run build` | exit 0 | `f4b9743` + T-M3-02 |

## Done recently
- T-M3-02: implemented `createApprovalRequest`, `matchingCode`, and `decisionPayload` in `packages/ts/src/approval/request.ts` with unit tests in `packages/ts/test/approval/request.test.ts` (`4/4` passed, `k2` `matchingCode` `2/2` passed).

## Next step
1. **T-M3-03** (`docs/plan/M3-approvals.md`): implement `verifyRegistryChain` and `trustedKeysFromRegistry` in `packages/ts/src/approval/registry.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M3-02 to T-M3-09 one by one"`
