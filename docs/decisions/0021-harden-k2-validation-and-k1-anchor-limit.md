# ADR-0021: Harden K2 validation guards and document K1 anchor limit

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: "Option 1 (Recommended)" (approving R1-03..05/07 fix ADR + implementation)

## Context
R1 identified four medium-severity gaps:
- `R1-03`: `verifyApproval` did not validate `request.subject.digest` or `actualSubjectDigest` as `^sha256:[0-9a-f]{64}$`, allowing `undefined === undefined` in untyped JS callers.
- `R1-04`: `verifyRegistryChain` did not validate all required `RegistryPayload` schema fields (such as `max_ttl_seconds`, `allow_synced_passkeys`, `break_glass`, and approver metadata), and `verifyApproval` step 7 let `NaN` `max_ttl_seconds` disable the TTL check.
- `R1-05`: `verifyBreakGlass` threw `TypeError` on `null` input or missing `registry.break_glass` / `usedDigests` instead of honouring NFR-5 never-throws.
- `R1-07`: `contracts/spec/k1-audit.md` and `docs/05-threat-model.md` did not explicitly warn that passing checkpoints from the same store as the audit events prevents `verifyChain` from detecting tail truncation when the newest checkpoint is also withheld.

## Options
1. **Enforce strict format/schema bounds in K2 verifiers, wrap `verifyBreakGlass` as never-throws, and document the K1 external-anchor trust assumption** without breaking any existing golden vectors.
2. **Defer medium hardening until after M4/M5.**

## Decision
Option 1. Add the format/schema/bounds checks in `verify.ts` and `registry.ts`, make `verifyBreakGlass` fail-closed and never-throws, and document the external checkpoint anchor assumption in `k1-audit.md` and `05-threat-model.md`.

## Consequences
- Untyped JS callers passing `undefined` for `actualSubjectDigest` or omitting `subject.digest` fail closed.
- Registry payloads with missing/invalid `max_ttl_seconds` or required fields fail closed in both `verifyRegistryChain` and `verifyApproval`.
- `verifyBreakGlass` satisfies NFR-5 (`never throws`) with unit tests.
- All 51 `k2` and 19 `k1` existing vectors remain unchanged (`index.json` unchanged).
