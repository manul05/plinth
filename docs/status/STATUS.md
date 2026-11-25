# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M6 Conformance & Packaging in progress** (`T-M6-01` done)
- **Branch / HEAD:** `development` at `5635015` + T-M6-01 (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M6-01 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run lint` | `96` files checked, 0 errors | `5635015` + T-M6-01 |
| `npm.cmd run typecheck` | passed (0 errors) | `5635015` + T-M6-01 |
| `npm.cmd test -- api-conformance version json` | `4 passed (4)` files / `7 passed (7)` tests | `5635015` + T-M6-01 |

## Done recently
- **T-M6-01** (`docs/plan/M6-package.md`): locked all 6 subpath exports and root `index.ts` to `contracts/api/plinth-api.d.ts` via `api-conformance.test.ts` (and moved `MAX_DEPTH` out of `core/index.ts`).

## Next step
1. **T-M6-02** (`docs/plan/M6-package.md`): implement `packages/ts/src/tools/conformance.ts` (`plinth-conformance` CLI).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (M6 Packaging & Conformance).
