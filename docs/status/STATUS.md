# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M3 K2 Approvals + R1 High/Medium fixes complete** -> ready for **M4 K4 Rule Packs**
- **Branch / HEAD:** `development` at `3ddbc0c` (committing T-M3-12 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M3-12 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run lint` | `Checked 67 files in 360ms. No fixes applied.` (exit 0) | `3ddbc0c` + T-M3-12 |
| `npm.cmd run typecheck` | exit 0 | `3ddbc0c` + T-M3-12 |
| `npm.cmd test` | `29 passed (29)` files / `219 passed (219)` tests (`k0` 56/56, `k1` 19/19, `k2` 51/51, `real-assertion` 2/2) | `3ddbc0c` + T-M3-12 |
| `npm.cmd run build` | exit 0 | `3ddbc0c` + T-M3-12 |

## Done recently
- T-M3-12 (`R1-03..05/07` Medium fixes, ADR-0021): enforced `^sha256:[0-9a-f]{64}$` digest checks on `subject.digest` and `actualSubjectDigest`, full `RegistryPayload` schema validation and `max_ttl_seconds` bounds (60–86400), never-throws `verifyBreakGlass`, and K1 external checkpoint anchor limit in `k1-audit.md` and `05-threat-model.md`.
- All R1 Critical/High/Medium findings (`R1-01`..`R1-07`) resolved and verified (`29 files / 219 tests`).

## Next step
1. **T-M4-01** (`docs/plan/M4-rulepack.md`): red skeleton `k4` vector runner and `packages/ts/src/rulepack/` stubs.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"Option 1 (Recommended)"` (ADR + implementation for T-M3-10, T-M3-11, and T-M3-12 — all complete).
