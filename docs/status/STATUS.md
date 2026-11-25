# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-03 complete
- **Branch / HEAD:** `development` at `37dda40` (committing T-M0-03 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M0-03 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test` (`vitest run`) | `Test Files  2 passed (2)`, `Tests  4 passed (4)` (after red check on missing `vectors.js`) | `37dda40` + T-M0-03 |
| `npm.cmd run typecheck` | exit 0 | `37dda40` + T-M0-03 |
| `npm.cmd run lint` (`biome check .`) | `Checked 13 files in 151ms. No fixes applied.` (exit 0) | `37dda40` + T-M0-03 |
| `npm.cmd run build` | exit 0 (`packages/ts/dist/index.js` + `index.d.ts`) | `37dda40` |

## Done recently
- T-M0-03: added `packages/ts/test/version.test.ts`, `packages/ts/test/vectors.ts`, and `packages/ts/test/vectors.test.ts`; verified red-then-green (`4/4` tests).
- T-M0-02 (`37dda40`): root npm workspace and pinned toolchain.
- ADR-0016 (`8d3149f`): re-pinned Node.js to `26.13.1` and npm to `11.20.0`.
- T-M0-01 (`08b339f`): G0 settings, hooks, and guard proof.

## Next step
1. **T-M0-04** (`docs/plan/M0-setup.md`): add contract self-checks (`packages/ts/test/contracts.test.ts`) and dependency pin checks (`packages/ts/test/deps.test.ts`), write tests first, run `npm test`, `npm run typecheck`, `npm run lint` (and **T-M0-06** portability guard is also unblocked).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (T-M0-03).
