# Plinth: docs index

Where everything is. Agents: read `status/STATUS.md` first, then only the sections you need.
Never put absolute local paths (`F:\...`, `C:\Users\...`) in any doc: the repo must make sense on any machine.

| # | Doc | What it holds | State |
|---|---|---|---|
| 00 | `00-index.md` | This map | live |
| 01 | `01-research.md` | Platform-kit design sections, copied verbatim (history) | done |
| 02 | `02-brainstorm.md` | Purpose, components, consumers, decisions (short form) | done |
| 03 | `03-spec.md` | Personas, user stories, acceptance criteria with exact values, NFRs, India rules | done (Stage 3) |
| 04 | `04-architecture.md` | Pinned stack, repo tree, data model, interfaces, flows, conventions | done (Stage 3) |
| 05 | `05-threat-model.md` | Assets, STRIDE table TM-01…TM-36 with tests and tasks, data inventory | done (Stage 3) |
| 06 | `06-plan.md` | Milestones, gates, 65-task table, coverage matrix, owner questions, §10 checklist | done (Stage 3) |
| – | `plan/M0-setup.md` … `plan/MR-release.md` | Full task cards per milestone | done (Stage 3) |
| – | `testing.md` | Test strategy, commands, mutation checks, CI, release checklist, demo script | done (Stage 3) |
| – | `consuming.md` | How Passdown (and later products) vendor a hash-pinned snapshot | done (Stage 3) |
| – | `patterns/two-hands-ux.md` | UX and logging pattern for dangerous actions | done (Stage 3) |
| – | `design/design-brief.md` | States that Phase 1 has no UI | done |
| 07 | `07-security-review.md` | Security review at release | not started (T-MR-05) |
| 08 | `08-how-i-built-this.md` | "How I built this with AI" | not started (T-MR-06) |
| – | `releases.md` | Release pins (`sums_sha256`, tarball hash) | not started (T-MR-06) |
| – | `do-not-break.md` | Deliberate behaviours that look like bugs | live |
| – | `decisions/` | ADRs 0001–0014; index in `decisions/README.md` | live |
| – | `status/STATUS.md`, `status/LOG.md`, `status/archive/` | Handoff and history | live |
| – | `../contracts/` | Specs, API, schemas, errors, golden vectors (source of truth) | done (Stage 3) |
| – | `../rules/` | Rule-pack YAML sources (4 packs, 35 rules, 70 tests) | done (Stage 3) |

Programme-wide context (portfolio rules, shared packs) lives in the portfolio index repo `portfolio`.
Everything Plinth needs from there has been copied into this repo.
