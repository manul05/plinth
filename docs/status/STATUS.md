# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M6 Conformance & Packaging CLOSED** (`T-M6-01`..`T-M6-08` all `done`; all Gate R2 findings resolved)
- **Branch / HEAD:** `development` at `2de253e` + M6 close (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`101` files), `build` 0, `typecheck` 0, `vitest` `402/402` (`43` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `2de253e` + `06-plan.md` |
| `npm.cmd run test:perf` | `6/6` passed (`ReDoS` max `3.553 ms`) | `2de253e` + `06-plan.md` |

## Done recently
- **R2-01 (`T-M6-05`, `04dcfc0`):** Added `dist/version.{js,d.ts}` to `packages/ts/package.json` `files` and verified all packed `dist/` relative imports resolve.
- **R2-02 (`T-M6-06`, `62392eb`):** Enforced shared `profile`/`alg` and `BE`/`allow_synced_passkeys` checks in `verifyRegistryChain` (`ADR-0024`, `contracts/spec/k2-approval.md` §3).
- **R2-04..R2-08 (`T-M6-07`, `5fd9845`):** Hardened `verifyChain`, `verifyRegistryChain`, `verifyApproval` input/policy bounds, strengthened `R2-07` substring non-echo tests, added `R2-08` negative tests.
- **R2-09..R2-13 (`T-M6-08`, `2de253e`):** Added `crv` check, optional `scan()` secret length check (`ADR-0025`, `contracts/spec/k5-detection.md` §2), scrubbed raw input from `PlinthError.detail`, protected `spec`/extra-key audit bounds, synced doc/test counts (`156/156`, `38` rules / `73` tests, `TM-36`), closed `T-M6-04`.

## Next step
1. **`T-MR-01` (Snapshot tool):** Implement release snapshot builder and `SHA256SUMS` generation per `docs/plan/MR-release.md`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"1. go with recommendation"` + `"option 1"` (fix all Gate R2 findings including `contracts/` updates via ADRs before closing M6).
