# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **MR Release** (`T-MR-01`..`T-MR-02` done; `T-MR-03` next)
- **Branch / HEAD:** `development` at `d9f5b83` + `T-MR-02` (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- verify-snapshot` | `4/4` passed (`valid snapshot passes`, `tampered byte fails`, `pin mismatch fails`, `unlisted file fails`) | `d9f5b83` + `T-MR-02` |
| `npm.cmd run check` | `lint` 0 (`104` files), `build` 0, `typecheck` 0, `vitest` `409/409` (`45` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `d9f5b83` + `T-MR-02` |

## Done recently
- **`T-MR-02` (`verify-snapshot.sh`):** Created `scripts/verify-snapshot.sh` (LF) and 4 TDD tests in `packages/ts/test/repo-tools/verify-snapshot.test.ts` (including Windows Git `sh.exe` fallback when `sh` is not on PowerShell `PATH`).
- **`T-MR-01` (`d9f5b83`):** Implemented `buildSnapshot` and CLI in `packages/ts/src/repo-tools/snapshot.ts`, added `"snapshot"` script in `package.json`, and added 3 TDD tests in `packages/ts/test/repo-tools/snapshot.test.ts`.

## Next step
1. **`T-MR-03` (`repo-tools/vendor.ts`):** Implement consumer vendoring tool (`vendorSnapshot` + `plinth.pin` + `.gitattributes`) per `docs/plan/MR-release.md`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"1. go with recommendation"` + `"option 1"` (fix all Gate R2 findings before M6 close).
