# ADR-0008: Exact version pins with a 14-day publish cooldown

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
Supply-chain attacks often ship as brand-new versions. Zero budget means no paid scanning.

## Options
1. **Exact pins, versions ≥ 14 days old at pin time, lockfile**.
2. **Caret ranges**: drift between machines.
3. **Latest always**: highest exposure to fresh malicious releases.

## Decision
Every dependency pinned exactly; the chosen version was published at least 14 days before it was pinned (check with `npm view <pkg> time`). Biome 2.6.x (2026-10-21 onwards) was therefore skipped for 2.5.15.

## Consequences
Dependabot PRs older than 14 days only; `test/deps.test.ts` checks exact pins.
