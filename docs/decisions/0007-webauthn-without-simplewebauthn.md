# ADR-0007: Verify WebAuthn assertions in the kit without SimpleWebAuthn

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
K2 needs to verify assertions offline at the enforcement point (git hook) and in Workers. Assertion verification needs no CBOR; registration (attestation, COSE keys) does.

## Options
1. **Own assertion verifier** (11 ordered checks, P-256 DER via noble) + `jwkFromP256Spki` for keys from the browser's `getPublicKey()`.
2. **@simplewebauthn/server**: more surface and dependencies; designed around server sessions, not offline envelopes.

## Decision
The kit verifies `webauthn-ES256` signature entries (k0-core.md §7). Registration ceremonies, attestation and passkey sign-in stay in products.

## Consequences
Spike T-M3-08 proves it against a real authenticator; `signCount` is left to online products.
