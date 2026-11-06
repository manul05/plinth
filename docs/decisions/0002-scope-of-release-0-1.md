# ADR-0002: Release 0.1 contains K0, K1, K2, K4 and K5

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Owner (programme decisions log, 2026-10-31)
- **Owner approval:** Programme decisions log 2026-10-31 records: build order Passdown first; Plinth specs and vectors first, code inside the first consumer (log entry, not a verbatim chat quote)

## Context
The platform-kit draft assigns K0, K1, K4, K5 to 0.1 and says K2 moves into 0.1 if Baton (now Passdown) is first. The owner chose Passdown first on 2026-10-31.

## Options
1. **K0, K1, K4, K5 only**: Passdown could not ship its push gate.
2. **K0, K1, K2, K4, K5**: everything Passdown Phase 1 needs.
3. **Add K3/K6 too**: no consumer needs them in Passdown Phase 1.

## Decision
Ship K0, K1, K2, K4, K5 (TypeScript) plus `docs/patterns/two-hands-ux.md`; K3, K6, K7 and other languages are later releases.

## Consequences
Six build milestones (M0–M6) plus release; 177 vectors cover the five components. K6 retention value stays in Passdown config until 0.2.
