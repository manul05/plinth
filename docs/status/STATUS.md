# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M2 K1 Audit Log** — T-M2-02 complete
- **Branch / HEAD:** `development` at `ffdad7d` (committing T-M2-02 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M2-02 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test -- event` | `4/4` passed (after red `4/4` failure) | `ffdad7d` + T-M2-02 |
| `npm.cmd test -- k1 -t "k1 eventHash"` | `1/1` passed (`k1-event-hash`; `18 skipped`) | `ffdad7d` + T-M2-02 |
| `npm.cmd test -- portability` | `5/5` passed | `ffdad7d` + T-M2-02 |
| `npm.cmd run typecheck` | exit 0 | `ffdad7d` + T-M2-02 |
| `npm.cmd run lint` | `Checked 46 files in 260ms. No fixes applied.` (exit 0) | `ffdad7d` + T-M2-02 |
| `npm.cmd run build` | exit 0 | `ffdad7d` + T-M2-02 |

## Done recently
- T-M2-02: implemented `eventHash` and `appendEvent` in `packages/ts/src/audit/event.ts` and added `packages/ts/test/audit/event.test.ts` (`4/4`).
- T-M2-01 (`ffdad7d`): k1 vector runner and M2 stubs.

## Next step
1. **T-M2-03** (`docs/plan/M2-audit.md`): implement `serializeExport` and `parseExport` in `packages/ts/src/audit/jsonl.ts` with `packages/ts/test/audit/jsonl.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"execute T-M2-01 to T-M2-06 one by one"` (executing M2 sequentially).
