# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M5 K5 Detection in progress** (`T-M5-01`..`T-M5-05` done)
- **Branch / HEAD:** `development` at `c23fc26` + T-M5-05 (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M5-05 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run lint` | `88` files checked, 0 errors | `c23fc26` + T-M5-05 |
| `npm.cmd run typecheck` | passed (0 errors) | `c23fc26` + T-M5-05 |
| `npm.cmd test -- redact k5 pack-tests` | `3 passed (3)` files / `96 passed (96)` tests (`20/20` `k5`, `70/70` pack tests) | `c23fc26` + T-M5-05 |

## Done recently
- **T-M5-05** (`docs/plan/M5-detection.md`): added `hmacSha256Hex` in `core/bytes.ts`, secret fingerprints in `scan.ts`, `redact.ts` with typed placeholders and overlap resolution, and `redact.test.ts`.

## Next step
1. **T-M5-06** (`docs/plan/M5-detection.md`): run pack tests during `compile-packs`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development (stop at T-M5-09 / owner gate G-K5)."`
