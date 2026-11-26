# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **MR Release** (`T-MR-01`..`T-MR-06` done; `T-MR-07` next)
- **Branch / HEAD:** `development` at `fe74e23` + `T-MR-06` (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`107` files), `build` 0, `typecheck` 0, `vitest` `430/430` (`47` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `7685414` |
| `npm.cmd run test:perf` | `6/6` passed (`10 KB` `1.083 ms`, `Ed25519` `7.621 ms`, `WebAuthn` `13.559 ms`, `10k chain` `535.15 ms`, `100 KB scan` `66.984 ms`, `ReDoS` max `8.191 ms`) | `7685414` |
| `security-scan` (`45766237355`) | `gitleaks v8.30.1` (`81` commits, `no leaks found`), `osv-scanner v2.7.0` (`No issues found`) | `7685414` |

## Done recently
- **`T-MR-06` (Release docs):** Updated `README.md` per `docs/testing.md` §11, moved `CHANGELOG.md` entries to `## [0.1.0] - 2026-11-26`, wrote `docs/08-how-i-built-this.md` with exact reproducible counts, and created `docs/releases.md` table header.
- **`T-MR-05` (`fe74e23`):** Signed off `docs/07-security-review.md` (`G-final`) after fixing `SEC-01` and all 11 `<MR>` findings (`SEC-R3-01`..`SEC-R3-11`).

## Next step
1. **`T-MR-07` (Release: merge, tag, snapshot from tag, record pin):** Wait for the owner's exact merge phrase `"now it is time to merge plinth to main"`, open PR `development -> main`, and follow `docs/plan/MR-release.md` `T-MR-07` steps 1–7 (`G-merge`, `G-tag`).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"go with recommendation"` (`SEC-01` + `<MR>`), `"optiion 1"` (fix all 11 `<MR>` findings + ADRs), `"Signed off G-final for release 0.1.0"`.
