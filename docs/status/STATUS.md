# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M0 Setup complete** — ready for M1 K0 Core
- **Branch / HEAD:** `development` at `30609a8` (closing T-M0-08 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M0-08 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd ci` | `added 53 packages, and audited 55 packages in 9s`, `found 0 vulnerabilities` | `30609a8` |
| `npm.cmd run check` | `lint` 0 (`Checked 19 files`), `typecheck` 0, `vitest` `22/22` (`7` files), `build` 0 | `30609a8` |
| `npm.cmd run test:perf` | `No test files found, exiting with code 0` | `30609a8` |
| GitHub Actions `ci` (`workflow_dispatch`) | **success** (`fast` 26s, `full` 15s) — https://github.com/manul05/plinth/actions/runs/45593567766 | `30609a8` |
| GitHub Actions `security-scan` (`workflow_dispatch`) | **success** (`gitleaks:v8.30.1` + `osv-scanner:v2.7.0`) — https://github.com/manul05/plinth/actions/runs/45593572876 | `30609a8` |

## Done recently
- T-M0-05 & T-M0-08: added `passWithNoTests: true` in `vitest.perf.config.ts` and `.gitleaksignore` (11 synthetic `650cc02` vector fingerprints); verified `ci` and `security-scan` green on GitHub Actions, `npm ci` and `npm run check` green locally, and closed M0.
- T-M0-07 (`5a8905c`), T-M0-06 (`7257de7`), T-M0-04 + ADR-0017 (`3404b4e`), T-M0-03 (`57e3b33`), T-M0-02 (`37dda40`), ADR-0016 (`8d3149f`), T-M0-01 (`08b339f`).

## Next step
1. **T-M1-01** (`docs/plan/M1-core.md`): Red skeleton for K0 (`k0-vectors.test.ts` + stubs).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"done now you push it"`; `"continue with your recommendation"` (`passWithNoTests: true` + `.gitleaksignore`).
