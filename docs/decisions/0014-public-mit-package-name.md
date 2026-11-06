# ADR-0014: Public once tested, MIT, package name `plinth-kit`

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Owner (programme decisions log, 2026-10-31)
- **Owner approval:** Programme decisions log 2026-10-31 records: "Plinth repo goes public once tested"; MIT for kits (log entry, not a verbatim chat quote)

## Context
npm name `plinth` is taken (0.0.2, checked 2026-10-31); `plinth-kit` and `@plinth/kit` returned 404.

## Options
1. **`plinth-kit`** unscoped.
2. **Scoped** name: needs an npm org later.

## Decision
Licence MIT from the first commit; package name `plinth-kit`; repo made public by the owner after release 0.1.0 (gate G-public, T-MR-08).

## Consequences
The name may be taken by someone else before any npm publish; vendoring does not depend on it.
