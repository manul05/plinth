# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **MR Release** (`T-MR-01`..`T-MR-05` done; `T-MR-06` next)
- **Branch / HEAD:** `development` at `7685414` + `T-MR-05` (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`107` files), `build` 0, `typecheck` 0, `vitest` `430/430` (`47` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `7685414` |
| `npm.cmd run test:perf` | `6/6` passed (`10 KB` `1.083 ms`, `Ed25519` `7.621 ms`, `WebAuthn` `13.559 ms`, `10k chain` `535.15 ms`, `100 KB scan` `66.984 ms`, `ReDoS` max `8.191 ms`) | `7685414` |
| `security-scan` (`45766237355`) | `gitleaks v8.30.1` (`81` commits, `no leaks found`), `osv-scanner v2.7.0` (`No issues found`) | `7685414` |

## Done recently
- **`T-MR-05` (Security review & `G-final`):** Completed `docs/07-security-review.md` (`SEC-01` @ `d339a7c`; `<MR>` independent review `SEC-R3-01`..`SEC-R3-11` all fixed across `bf79814`, `a5bc9ac`, `7685414` with `ADR-0026`/`ADR-0027`), signed off by owner (`G-final`).
- **`T-MR-01`..`T-MR-04` (`d9f5b83`..`57d51fb`):** Snapshot builder, `verify-snapshot.sh`, `vendorSnapshot`, and `E2E-5` scratch consumer.

## Next step
1. **`T-MR-06` (README, CHANGELOG 0.1.0, How I built this, `docs/releases.md`):** Update `README.md` per `docs/testing.md` §11, update `CHANGELOG.md` for `0.1.0`, write `docs/08-how-i-built-this.md`, and create `docs/releases.md` table header per `docs/plan/MR-release.md`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"go with recommendation"` (`SEC-01` + `<MR>` review), `"optiion 1"` (fix all 11 `<MR>` findings + contract ADRs), `"Signed off G-final for release 0.1.0"`.
