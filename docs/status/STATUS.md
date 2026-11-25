# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-02 complete
- **Branch / HEAD:** `development` at `8d3149f` (committing T-M0-02 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after T-M0-02 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd install` / `npm.cmd ls` | 53 packages added, 0 vulnerabilities; all 8 devDeps + `@noble/curves`/`@noble/hashes`/`@scure/base` 2.4.0 match pins | `8d3149f` + T-M0-02 |
| `npm.cmd run lint` (`biome check .`) | `Checked 10 files in 87ms. No fixes applied. Found 1 info.` (exit 0; `!contracts` excluded in `biome.json`) | `8d3149f` + T-M0-02 |
| `npm.cmd run typecheck` | `tsc -p packages/ts/tsconfig.json --noEmit && tsc -p packages/ts/tsconfig.test.json --noEmit` (exit 0) | `8d3149f` + T-M0-02 |
| `npm.cmd run build` | `tsc -p packages/ts/tsconfig.json` (exit 0; `packages/ts/dist/index.js` + `index.d.ts` emitted) | `8d3149f` + T-M0-02 |
| `sh scripts/install-hooks.sh --check` | `OK: hooks active (core.hooksPath=.githooks).` | `08b339f` |

## Done recently
- T-M0-02: created root npm workspace, `.nvmrc` (`26.13.1`), `tsconfig*.json`, `biome.json` (`!contracts` excluded with owner OK), `vitest*.config.ts`, `packages/ts/` skeleton, `package-lock.json`, and `.gitignore` outputs.
- ADR-0016 (`8d3149f`): re-pinned Node.js to `26.13.1` and npm to `11.20.0`.
- T-M0-01 (`08b339f`): G0 settings, hooks, and guard proof.

## Next step
1. **T-M0-03** (`docs/plan/M0-setup.md`): add version test (`packages/ts/test/version.test.ts`), vector loader (`packages/ts/test/vectors.ts`), and vector loader tests (`packages/ts/test/vectors.test.ts`), write tests first and run `npm test`, `npm run typecheck`, `npm run lint`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"continue"` (start T-M0-02); `"continue with your recommendation"` (exclude `!contracts` in `biome.json` and format only new files).
