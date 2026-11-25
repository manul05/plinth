# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **M6 Conformance & Packaging in progress** (`T-M6-01`..`T-M6-02` done)
- **Branch / HEAD:** `development` at `e3100e9` + T-M6-02 (`origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M6-02 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`98` files), `typecheck` 0, `vitest` `379/379` (`41` files), `build` 0, `packs:check`, `conformance` `PASS 156/156` | `e3100e9` + T-M6-02 |
| `node packages/ts/dist/tools/conformance.js` | stderr `usage: plinth-conformance <vectors-dir>`, exit `2` | `e3100e9` + T-M6-02 |

## Done recently
- **T-M6-02** (`docs/plan/M6-package.md`): implemented `plinth-conformance` CLI (`PASS 156/156`, 27 tool vectors skipped), added `conformance.test.ts`, and wired `npm run conformance` into `package.json` `check` and `.github/workflows/ci.yml`.

## Next step
1. **T-M6-03** (`docs/plan/M6-package.md`): finalize `packages/ts/package.json` subpath `exports` and `bin`, copy `LICENSE`/`NOTICE`, and add `package.test.ts`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (M6 Packaging & Conformance).
