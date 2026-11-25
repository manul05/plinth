# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-01 complete, Node/npm re-pinned (ADR-0016)
- **Branch / HEAD:** `development` at `08b339f` (committing ADR-0016 next; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none after ADR-0016 commit; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `sh scripts/install-hooks.sh --check` (Git Bash) | `OK: hooks active (core.hooksPath=.githooks).` | `08b339f` |
| G0 GitHub settings (`gh repo view`, `gh api`, `gh issue list`) | Private (`manul05/plinth`), `defaultBranchRef=development`, `mergeCommitAllowed=true`, `squashMergeAllowed=false`, `rebaseMergeAllowed=false`, `deleteBranchOnMerge=false`, Actions perms `read`, `vulnerability-alerts` HTTP 204, `automated-security-fixes` `enabled=true`, Issue #1 ALARM closed | `08b339f` |
| T-M0-01 step 5 guard proof (`git push origin development:main`) | Unapproved: `BLOCKED: push to protected ref 'refs/heads/main'` (`no owner approval`). Wrong SHA (`deadbee`): `BLOCKED` (`OWNER_APPROVES_PUSH names a different commit than d674bf9`). `origin/refs/heads/main` unchanged at `650cc02` | `08b339f` |
| Installed toolchain (`node -v`, `npm.cmd -v`) | Node `v26.13.1`, npm `11.20.0` (matches ADR-0016 pins) | `08b339f` |
| `sh scripts/check-doc-sizes.sh` | Exited 0 | `08b339f` |

## Done recently
- T-M0-01 (`08b339f`): verified and fixed remaining G0 settings on `manul05/plinth`, activated local `.githooks`, and proved the `pre-push` guard against `origin`.
- ADR-0016: re-pinned Plinth's Node.js/npm toolchain from `24.16.0`/`11.13.0` to `26.13.1`/`11.20.0` across `START-HERE.md`, `README.md`, `03-spec.md`, `04-architecture.md`, and `M0-setup.md`.

## Next step
1. **T-M0-02** (`docs/plan/M0-setup.md`): create root npm workspace and pinned toolchain (`package.json`, `.nvmrc`, `tsconfig*.json`, `biome.json`, `vitest*.config.ts`, `packages/ts/*`, `package-lock.json`, `.gitignore`), run `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` because only the owner edits `AGENTS.md`.
- Dependabot PR #2 (`Bump actions/checkout from 4 to 7` into `development`) is open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"G0 GitHub settings - you do it"`, `"Guard proof & commit - yes"`, `"Node/npm decision - re-pin Plinth to 26.13.1 / 11.20.0"`.
