# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-04 complete
- **Branch / HEAD:** `development` at `57e3b33` (committing T-M0-04 + ADR-0017 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M0-04 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd test` (`vitest run`) | `Test Files  4 passed (4)`, `Tests  13 passed (13)` (17 schemas compile strict, 177 vectors valid, 5 keys + `test-kids.json` match, 183 `index.json` SHA-256 hashes match, 74 error codes in 97 `errors.json`, ASCII-only, deps + lockfile pins match) | `57e3b33` + T-M0-04 |
| `npm.cmd run typecheck` | exit 0 | `57e3b33` + T-M0-04 |
| `npm.cmd run lint` (`biome check .`) | `Checked 15 files in 89ms. No fixes applied.` (exit 0) | `57e3b33` + T-M0-04 |
| `npm.cmd run build` | exit 0 | `37dda40` |

## Done recently
- T-M0-04 + ADR-0017: added `packages/ts/test/contracts.test.ts` and `packages/ts/test/deps.test.ts`; fixed `jwk.schema.json` `"not"` blocks (declaring `"properties": { "d": {} }` per owner OK) so all 17 schemas compile under Ajv `strict: true`.
- T-M0-03 (`57e3b33`): version test and golden-vector loader (`4/4` tests).
- T-M0-02 (`37dda40`): root npm workspace and pinned toolchain.
- ADR-0016 (`8d3149f`): re-pinned Node.js to `26.13.1` and npm to `11.20.0`.
- T-M0-01 (`08b339f`): G0 settings, hooks, and guard proof.

## Next step
1. **T-M0-05** (`docs/plan/M0-setup.md`): CI, security-scan, and Dependabot workflows (and **T-M0-06** portability guard and **T-M0-07** errors module are also unblocked).

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"cotinue"` (T-M0-04); `"continue with your recommendation"` (ADR-0017 + `jwk.schema.json` strictRequired fix).
