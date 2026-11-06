# ADR-0011: Keep the `pk` prefix for specs, types, rule ids and error codes

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
The design used `pk` for "platform kit"; the real name is now Plinth.

## Options
1. **Keep `pk`** (reads as "Plinth kit"): no churn in specs and vectors.
2. **Rename to `plinth`**: longer strings, rewrites every spec id.

## Decision
Keep `pk-sig/1.0`, `pk.audit.checkpoint`, `pk.secret.*`, `PK_*` and so on.

## Consequences
None beyond explaining the prefix in README and contracts/README.
