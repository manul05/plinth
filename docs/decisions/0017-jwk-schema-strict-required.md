# ADR-0017: Declare property "d" inside "not" in jwk.schema.json for Ajv strict mode

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: "continue with your recommendation" (in response to Option 1: fix `jwk.schema.json` with ADR-0017)

## Context
`contracts/schemas/jwk.schema.json` used `"not": { "required": ["d"] }` in both `oneOf` branches without declaring `"d"` under `"properties"`. Under Ajv `8.20.0` with `{ strict: true, allErrors: true }` (as required by T-M0-04), `strictRequired` throws `strict mode: required property "d" is not defined at "https://plinth.invalid/schemas/jwk.schema.json#/oneOf/0/not" (strictRequired)`, which also prevents `pk-approval.registry-payload.schema.json` and `test-key.schema.json` from compiling.

## Options
1. **Fix `jwk.schema.json`** by adding `"properties": { "d": {} }` inside both `"not"` blocks.
2. **Relax the test** by passing `strictRequired: false` to Ajv in `contracts.test.ts`.

## Decision
Option 1. Add `"properties": { "d": {} }` inside both `"not"` blocks in `contracts/schemas/jwk.schema.json`, preserving exact validation semantics while keeping Ajv `strict: true` intact.

## Consequences
All 17 schemas compile under Ajv `strict: true`. No test vectors or `index.json` hashes change (`index.json` covers `contracts/test-vectors/` only).
