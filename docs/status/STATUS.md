# Status

- **Updated:** 2026-11-26 (Dependabot triage)
- **Stage:** Phase 1 (`0.1.0`) **COMPLETE** — repository public; ready for Passdown to vendor
- **Branch & HEAD:** `development` at `9329d9c` + docs commit (`origin/main` and tag `v0.1.0` at `5cd5e6fc493e045a2741f3febc9b7d6ee3425d13`)
- **Last verified checks:**
  - PR #4 (`5d670c1`, `@types/node` `26.6.6`, 29 days old per `ADR-0008`) kept; PR #3 (`b298c1b`, `biome` `2.6.8` / `vite` `8.3.8` / `vitest` `5.1.1`) reverted in `9329d9c` (failed 14-day cooldown, 75 Biome YAML errors, `deps.test.ts` `5.0.5` pin, and local Windows Application Control block on `biome.exe 2.6.8`).
  - Full check @ `9329d9c` + `docs/04-architecture.md`: `lint` (`107` files, 0), `build` 0, `typecheck` 0, `vitest run --maxWorkers=4` (`47/47` files, `430/430`), `packs:check` (`packs: up to date`), `conformance` (`PASS 156/156`), `test:perf` (`6/6`, ReDoS max `19.794 ms`).
  - `T-MR-08` pre-public `security-scan` (`45775678369`) green; `G-public` verified via `gh api` (public repo, `main` ruleset, secret scanning + push protection + private vulnerability reporting enabled).
- **Milestones:** `M0`–`M6` and `MR` (`T-MR-01`–`T-MR-08`) all `done`.
- **Next step:** Phase 1 complete. Begin Passdown vendoring using the `v0.1.0` pins in [docs/releases.md](../releases.md) (wait until after `2026-12-02` for any intentional `biome`/`vitest` upgrade past the `ADR-0008` 14-day cooldown).
- **Blockers:** None (no open Dependabot PRs).
- **Questions for the owner:** Whether to sync post-release updates (`docs/releases.md`, `SECURITY.md`, `README.md`, `@types/node` `26.6.6`) to `main` via PR now or fold them into the next release cycle.
