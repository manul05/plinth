# ADR-0006: Own strict JSON parser and pk-JCS canonicaliser

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
pk-JCS forbids non-integers and null and needs duplicate-key and lone-surrogate rejection on raw text; `JSON.parse` keeps the last duplicate and cannot see `1.0` vs `1`.

## Options
1. **Own parser + canonicaliser** (~200 lines, fully specified, 22 vectors).
2. **`canonicalize` npm package (Apache-2.0)**: canonicalises but does not enforce the profile or parse strictly.
3. **JSON.parse + checks**: cannot detect duplicates or `1.0`.

## Decision
Implement `parseJson` and `canonicalize` per `contracts/spec/k0-core.md` §2–§3. The `canonicalize` package was used only to cross-check the vectors in Stage 3.

## Consequences
One more module to get right; the vectors and the UTF-16 ordering mutation check (MC-5) cover it.
