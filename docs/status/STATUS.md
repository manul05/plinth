# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **MR Release** (`T-MR-01` done; `T-MR-02` next)
- **Branch / HEAD:** `development` at `0a41451` + `T-MR-01` (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`103` files), `build` 0, `typecheck` 0, `vitest` `405/405` (`44` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `0a41451` + `T-MR-01` |
| `npm.cmd run snapshot -- --tag v0.1.0 --allow-dirty` | `sums_sha256=8721ad0072272bd58056b0e462ea010607f5ec6ee1fb34124e69ab729f5d0ba9`, `tarball_sha256=82fea4deff0c9ed27765343f04c991e826399a03215bac406c6790fc7b37a1a2` | `0a41451` + `T-MR-01` |

## Done recently
- **`T-MR-01` (Snapshot tool):** Implemented `buildSnapshot` and CLI in `packages/ts/src/repo-tools/snapshot.ts`, added `"snapshot"` script in `package.json`, and added 3 TDD tests in `packages/ts/test/repo-tools/snapshot.test.ts` (skips missing `scripts/verify-snapshot.sh` only when `allowDirty` is true until `T-MR-02` creates it).
- **M6 close (`0a41451`):** Resolved all Gate R2 findings (`T-M6-05`..`T-M6-08`) and closed Milestone M6.

## Next step
1. **`T-MR-02` (`scripts/verify-snapshot.sh`):** Create consumer-side snapshot verification script and `packages/ts/test/repo-tools/verify-snapshot.test.ts` per `docs/plan/MR-release.md`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"1. go with recommendation"` + `"option 1"` (fix all Gate R2 findings before M6 close).
