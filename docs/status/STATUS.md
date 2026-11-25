# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M3 R1 fixes** (`T-M3-10` done -> moving to `T-M3-11`)
- **Branch / HEAD:** `development` at `353d0fc` (committing T-M3-10 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M3-10 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run lint` | `Checked 67 files in 197ms. No fixes applied.` (exit 0) | `353d0fc` + T-M3-10 |
| `npm.cmd run typecheck` | exit 0 | `353d0fc` + T-M3-10 |
| `npm.cmd test` | `29 passed (29)` files / `213 passed (213)` tests (`k2` 49/49, `verify` 4/4, `store` 4/4) | `353d0fc` + T-M3-10 |
| `npm.cmd run build` | exit 0 | `353d0fc` + T-M3-10 |

## Done recently
- T-M3-10 (`R1-01` High fix, ADR-0019): added `ActionPolicy`, enforcement-side `actionPolicies` and `requesterHumanId` to `verifyApproval` and `verifyAndConsume`, plus 2 new downgrade vectors (`k2-approval-policy-downgrade`, `k2-approval-distinct-downgrade`).

## Next step
1. **T-M3-11** (`docs/plan/M3-approvals.md`): fix High finding `R1-02` (`update_threshold` with distinct approver IDs in `registry.ts` + ADR-0020).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"Option 1 (Recommended)"` (ADR + implementation for T-M3-10, T-M3-11, and T-M3-12).
