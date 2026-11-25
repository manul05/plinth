# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M2 K1 Audit Log** — T-M2-01 complete
- **Branch / HEAD:** `development` at `e4f5541` (committing T-M2-01 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M2-01 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- k1` | `18 failed | 1 passed (19)` (`k1-genesis-prev` pass; expected red) | `e4f5541` + T-M2-01 |
| `npm.cmd test -- portability` | `5/5` passed | `e4f5541` + T-M2-01 |
| `npm.cmd run typecheck` | exit 0 | `e4f5541` + T-M2-01 |
| `npm.cmd run lint` | `Checked 45 files in 162ms. No fixes applied.` (exit 0) | `e4f5541` + T-M2-01 |
| `npm.cmd run build` | exit 0 | `e4f5541` + T-M2-01 |

## Done recently
- T-M2-01: added M2 audit stubs under `packages/ts/src/audit/`, exported from `packages/ts/src/index.ts`, and added `packages/ts/test/audit/k1-vectors.test.ts` (`18 failed | 1 passed`).
- M1 complete (`T-M1-01`..`T-M1-11`, closed at `e4f5541`).

## Next step
1. **T-M2-02** (`docs/plan/M2-audit.md`): implement `eventHash` and `appendEvent` in `packages/ts/src/audit/event.ts` with `packages/ts/test/audit/event.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M2-01 to T-M2-06 one by one"` (executing M2 sequentially).
