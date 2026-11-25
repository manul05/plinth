# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **MR Release** (`T-MR-01`..`T-MR-04` done; `T-MR-05` next)
- **Branch / HEAD:** `development` at `641f8e2` + `T-MR-04` (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- e2e-consumer` | `1/1` passed (`buildSnapshot` → `vendorSnapshot` → `npm install --save-exact` → `sha512-` integrity → `plinth-kit/core` `digest({})` → `verify-snapshot.sh` → `PASS 156/156`) | `641f8e2` + `T-MR-04` |
| `npm.cmd run check` | `lint` 0 (`107` files), `build` 0, `typecheck` 0, `vitest` `414/414` (`47` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `641f8e2` + `T-MR-04` |

## Done recently
- **`T-MR-04` (`E2E-5` scratch consumer):** Created `packages/ts/test/repo-tools/e2e-consumer.test.ts` verifying full tarball vendoring, lockfile `sha512-` integrity, `plinth-kit/core` import, `verify-snapshot.sh`, and `npx --no-install plinth-conformance` (`PASS 156/156`).
- **`T-MR-03` (`641f8e2`):** Implemented `vendorSnapshot`, `"vendor"` script, and 4 tests.
- **`T-MR-02` (`7dd28da`):** Created `scripts/verify-snapshot.sh` and 4 tests.
- **`T-MR-01` (`d9f5b83`):** Implemented `buildSnapshot`, `"snapshot"` script, and 3 tests.

## Next step
1. **`T-MR-05` (Security review document):** Draft `docs/07-security-review.md` following the 9-item checklist in `docs/05-threat-model.md` §7 and request owner sign-off (gate `G-final`).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"1. go with recommendation"` + `"option 1"` (fix all Gate R2 findings before M6 close).
