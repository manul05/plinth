# ADR-0005: Crypto via @noble/curves, @noble/hashes and @scure/base; accept high-S

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
The kit must produce byte-identical Ed25519 output and verify ES256 the same way in Node, browsers and Workers. Licences and versions checked 2026-10-31 (`npm view`): all MIT, 2.4.0.

## Options
1. **noble + scure**: audited, pure JS, synchronous, identical on all runtimes.
2. **WebCrypto**: async, Ed25519 support uneven across runtimes, no strict DER control.
3. **node:crypto**: Node only.

## Decision
`@noble/curves` 2.4.0 (`ed25519`, `p256` from `nist.js`), `@noble/hashes` 2.4.0 (`sha256`, `hmac`), `@scure/base` 2.4.0 (`base64urlnopad`, `base32nopad`). P-256 verification always passes `{ lowS: false }` (noble rejects high-S by default; authenticators and other languages may emit high-S; verified in scratch 2026-10-31).

## Consequences
Three runtime dependencies, pinned exactly. Signatures are never identifiers, so ECDSA malleability is harmless (TM-04).
