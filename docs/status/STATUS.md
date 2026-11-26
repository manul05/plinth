# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-26 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), **0.1.0 released; Passdown can vendor** (`T-MR-01`..`T-MR-07` done; `T-MR-08` next)
- **Branch / HEAD:** `development` at `7c57a5a` + `T-MR-07` (`origin/main` and tag `v0.1.0` at `5cd5e6f`)
- **Uncommitted or unapplied work:** none after commit and push; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `npm.cmd run check` | `lint` 0 (`107` files), `build` 0, `typecheck` 0, `vitest` `430/430` (`47` files; `156` runtime + `27` skipped tool vectors), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`) | `7c57a5a` |
| `npm.cmd run test:perf` | `6/6` passed (`ReDoS` max `3.637 ms`) | `7c57a5a` |
| PR #5 (`ci` + `security-scan`) | `fast` (`34s`), `full` (`11s`), `security-scan` (`19s`) all pass | `7c57a5a` |
| Reproducible `v0.1.0` snapshot (Run 1 & Run 2) | `sums_sha256=35039eb008cd6a683e264005d33e223b7a877d6a91df23f8aab547e0cca92aec`, `tarball_sha256=13928bb9016250dd8fa298c33b30d4f7f4340c8176ae4c6a5e8497f9f6f54e2d` (identical across runs), `zip_sha256=363faaf78b5568262fb899665ec4fde9d28006c35603beae42d4619e7163eb28` | `5cd5e6f` (`v0.1.0`) |

## Done recently
- **`T-MR-07` (Release `v0.1.0`):** Opened PR #5 (`development -> main`, merged by owner at `5cd5e6f`), published `v0.1.0` release with `plinth-0.1.0-snapshot.zip`, verified identical `sums_sha256` & `tarball_sha256` across two clean-worktree builds, and recorded pins in `docs/releases.md`.

## Next step
1. **`T-MR-08` (Going public, gate `G-public`):** Run `security-scan` manually, audit `docs/status/` & ADRs for personal data, hand off public GitHub settings steps to owner, and update `SECURITY.md` & README badges per `docs/plan/MR-release.md`.

## Blocked on / questions for the owner
- Note: `AGENTS.md` line 8 still reads `Node 24.16.0` (owner-only file).
- Dependabot PRs #2, #3, #4 (into `development`) are open on GitHub.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-26: `"now it is time to merge plinth to main"`, merged PR #5 (`5cd5e6f`), published release `v0.1.0` with `plinth-0.1.0-snapshot.zip`.
