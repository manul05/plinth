# ADR-0024: Enforce Approver Profile and Synced-Passkey Policy on Registry Chain

- **Status:** Accepted
- **Date:** 2026-11-26
- **Decided by:** Manul (owner) + Antigravity
- **Owner approval:** Owner, 2026-11-26: `"option 1"` (fix all Gate R2 findings including R2-02)

## Context

`verifyApproval` checks two signer-level policy invariants on every decision signature:
1. An approver's registered `profile` (`'webauthn'` vs hardware `'android-keystore'` / `'windows-tpm'`) must match the signature algorithm (`'webauthn-ES256'` vs `'ES256'`), returning `PK_APPROVAL_PROFILE_ALG_MISMATCH` otherwise.
2. When the governing registry sets `allow_synced_passkeys: false`, any WebAuthn assertion with backup-eligible (`BE=1`) is rejected with `PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED`.

Gate R2 (`R2-02`, High) identified that `verifyRegistryChain` (`contracts/spec/k2-approval.md` §3 steps 3–4 and `packages/ts/src/approval/registry.ts`) verified envelope signatures using `REGISTRY_POLICY` (`algs: ['ES256', 'webauthn-ES256']`) without enforcing those two invariants on the registry chain signers themselves. As a result, a registry update or genesis envelope could be authorized using a mismatched algorithm/profile or a synced passkey even when `allow_synced_passkeys: false`.

## Options

1. **Leave `verifyRegistryChain` signature-only:** Rely solely on `REGISTRY_POLICY` algorithm allowlisting. Rejected: creates an asymmetric bypass where a `webauthn: false` synced-passkey restriction or hardware profile requirement on approvers can be bypassed when updating the registry itself.
2. **Enforce `PK_APPROVAL_PROFILE_ALG_MISMATCH` and `PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED` in `verifyRegistryChain`:** Apply the same shared signer-policy check in `verifyRegistryChain` (against `p` at `i === 0` and against `previous` at `i > 0`) as `verifyApproval` uses in `verifyDecision`. Update `contracts/spec/k2-approval.md` §3 steps 3–4 accordingly.

## Decision

Option 2. Both genesis (`i === 0`, against the genesis registry `p`) and updates (`i > 0`, against the governing `previous` registry) check every signer in `res.signers` for `profile`/`alg` match and `flags.be` vs `allow_synced_passkeys`.

## Consequences

- Closes the registry-evolution policy bypass (`R2-02`).
- Existing registry test vectors (`allow_synced_passkeys: true`, `webauthn` profile with `webauthn-ES256` and `BE=false`, `ES256` keys with `android-keystore` / `windows-tpm`) remain unaffected.
- `contracts/spec/k2-approval.md` §3 steps 3–4 explicitly specify these checks for cross-runtime conformance.
