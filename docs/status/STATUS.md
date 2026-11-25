# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M5 K5 Detection in progress** (`T-M5-01`..`T-M5-09` done)
- **Branch / HEAD:** `development` at `a44a785` + T-M5-09 (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M5-09 commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run packs:build` | `packs: 4 compiled, 38 rules, 73 tests` | `a44a785` + T-M5-09 |
| `npm.cmd run check` | `lint` 0 (`93` files), `typecheck` 0, `vitest` `375/375` (`39` files), `build` 0, `packs:check` (`packs: up to date`) | `a44a785` + T-M5-09 |

## Done recently
- **T-M5-09 · Owner gate G-K5 (`ADR-0022`):** Razorpay `key_id_test` and `key_secret` matched; Cashfree missed `TEST`+36-hex (entropy < 4.0) and `cfsk_ma_test_`+32+8 hex (prefix). Per owner `"b1"`, promoted all 3 rules to `rev: 2` (`stable`/`verified`), added 3 synthetic Cashfree tests, rebuilt packs, and refreshed `k4-pack-digests-pk-secrets-india.json` + `index.json`.

## Next step
1. **T-M5-10** (`docs/plan/M5-detection.md`): performance and ReDoS budgets (`packages/ts/test/perf/budgets.perf.ts`).
2. **T-M5-11** (`docs/plan/M5-detection.md`): M5 close, mutation checks (`MC-12`..`MC-14`), and `DNB-004`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"b1"` (ADR-0022 + Cashfree rule revision + K4 digest vector update for gate G-K5).
