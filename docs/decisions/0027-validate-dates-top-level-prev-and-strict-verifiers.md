# ADR-0027: Harden K4 Dates, K1 Lint/Checkpoint Checks, and Ed25519 Verification

- **Status:** Accepted
- **Date:** 2026-11-26
- **Decided by:** Manul (owner) + Antigravity
- **Owner approval:** Owner, 2026-11-26: `"optiion 1"` (approving all `<MR>` security fixes including contract ADRs)

## Context

The `<MR>` independent security review identified four specification-level fail-open or bypass gaps:

1. **`SEC-R3-04` (Medium):** `selectAsOf()` and `activeRules()` in `contracts/spec/k4-rulepack.md` §4 compared `date` as an unvalidated raw string. Passing `""`, `undefined`, or `"15-11-2026"` caused `activeRules()` to return `[]`, failing open in `redact()` and `lintPersonalData()`.
2. **`SEC-R3-06` (Medium):** `lintPersonalData()` in `contracts/spec/k1-audit.md` §6 skipped any object member named `prev` at every nesting depth, letting PII inside `event.data.prev` bypass the lint.
3. **`SEC-R3-10` (Low):** `verifyEnvelope()` in `contracts/spec/k0-core.md` §6 step 6h called `ed25519.verify()` with `@noble/curves`'s default `{ zip215: true }`, which accepts small-order/identity Ed25519 points with trivial signatures if ever placed in `trustedKeys`.
4. **`SEC-R3-11` (Low):** `verifyChain()` in `contracts/spec/k1-audit.md` §5 C.1 checked `typeof p.ts === "string"` rather than `isTimestamp(p.ts)`, accepting non-timestamp strings despite `pk-audit.checkpoint-payload.schema.json`.

## Decision

1. Require `date` in `selectAsOf()` and `activeRules()` (`k4-rulepack.md` §4) to be a valid calendar `YYYY-MM-DD` string, throwing `PK_ENCODING_INVALID` (`detail: "date"`) otherwise.
2. Restrict the `prev` key skip in `lintPersonalData()` (`k1-audit.md` §6) to top-level `event.prev` (`depth === 0`), so nested `data.prev` values are scanned.
3. Pass `{ zip215: false }` to `ed25519.verify()` (`k0-core.md` §6 step 6h) to reject small-order/non-canonical Ed25519 verification.
4. Require checkpoint `p.ts` in `verifyChain()` (`k1-audit.md` §5 C.1) to pass `isTimestamp(p.ts)`.

## Consequences

- Closes fail-open `date` bypass (`SEC-R3-04`), nested `prev` lint bypass (`SEC-R3-06`), Ed25519 small-order acceptance (`SEC-R3-10`), and malformed checkpoint `ts` acceptance (`SEC-R3-11`).
- All existing K0, K1, K4, and K5 golden test vectors remain unaffected.
