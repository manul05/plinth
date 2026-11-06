# ADR-0010: Consumers vendor a hash-pinned snapshot

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Owner (programme decisions log, 2026-10-31)
- **Owner approval:** Programme decisions log 2026-10-31 records: "Projects consume a hash-pinned snapshot" (log entry, not a verbatim chat quote)

## Context
Repos are private (no registry without tokens); submodules confuse agents; the PC is formatted after Stage 3, so each repo must be self-contained.

## Options
1. **Vendored snapshot**: npm tarball + contracts + packs + `SHA256SUMS`, pinned by `plinth.pin` and npm lockfile integrity.
2. **GitHub Packages**: needs a PAT even for reading.
3. **Submodule**: detached HEAD and pointer mistakes.

## Decision
Snapshot and vendor tools per `docs/consuming.md`; pin = SHA-256 of `SHA256SUMS`; consumer CI runs `verify-snapshot.sh` and `plinth-conformance`.

## Consequences
Consumers add `vendor/plinth/** -text` to `.gitattributes` (the vendor tool does it). Publishing to npmjs.com is an open owner question (Q3).
