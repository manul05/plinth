# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **MR Release** (`T-MR-01`..`T-MR-03` done; `T-MR-04` next)
- **Branch / HEAD:** `development` at `7dd28da` + `T-MR-03` (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- vendor` | `4/4` passed (`plinth.pin`, `.gitattributes` idempotent, tampered snapshot refused, missing `package.json` refused) | `7dd28da` + `T-MR-03` |
| `npm.cmd run check` | `lint` 0 (`106` files), `build` 0, `typecheck` 0, `vitest` `413/413` (`46` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `7dd28da` + `T-MR-03` |

## Done recently
- **`T-MR-03` (`repo-tools/vendor.ts`):** Implemented `vendorSnapshot` and CLI in `packages/ts/src/repo-tools/vendor.ts`, added `"vendor"` script to `package.json`, and added 4 TDD tests in `packages/ts/test/repo-tools/vendor.test.ts`.
- **`T-MR-02` (`7dd28da`):** Created `scripts/verify-snapshot.sh` and `packages/ts/test/repo-tools/verify-snapshot.test.ts` (4 tests).
- **`T-MR-01` (`d9f5b83`):** Implemented `buildSnapshot` and CLI in `packages/ts/src/repo-tools/snapshot.ts`, `"snapshot"` script, and 3 tests.

## Next step
1. **`T-MR-04` (E2E-5 scratch consumer):** Create `packages/ts/test/repo-tools/e2e-consumer.test.ts` to test `buildSnapshot` → `vendorSnapshot` → `npm install --save-exact` → `plinth-kit/core` import → `verify-snapshot.sh` → `npx plinth-conformance` per `docs/plan/MR-release.md`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"1. go with recommendation"` + `"option 1"` (fix all Gate R2 findings before M6 close).
