# ADR-0025: Reject Short Optional installationSecret in scan()

- **Status:** Accepted
- **Date:** 2026-11-26
- **Decided by:** Manul (owner) + Antigravity
- **Owner approval:** Owner, 2026-11-26: `"option 1"` (fix all Gate R2 findings including R2-10)

## Context

`redact(text, packs, { date, installationSecret })` requires `installationSecret` to be at least 32 bytes (`PK_DETECT_SECRET_REQUIRED`, `contracts/spec/k5-detection.md` §3 step 1). In contrast, `scan(text, packs, { date, installationSecret? })` makes `installationSecret` optional (omitting `fingerprint` when absent), and previously accepted any `Uint8Array` length—including weak short secrets—without validation (`R2-10`, Low).

## Options

1. **Leave `scan()` unvalidated when `installationSecret` is provided:** Callers passing a weak or truncated secret silently get weak HMAC-SHA256 fingerprints. Rejected.
2. **Enforce `length >= 32` whenever `installationSecret` is supplied to `scan()`:** Keep `installationSecret` optional, but throw `PK_DETECT_SECRET_REQUIRED` if `opts.installationSecret !== undefined` and it is not a `Uint8Array` of at least 32 bytes. Document in `contracts/spec/k5-detection.md` §2 step 1.

## Decision

Option 2. Matches `redact()`'s secret-strength invariant whenever a secret is provided while preserving secretless scanning when `installationSecret` is omitted.

## Consequences

- Prevents accidental use of short/weak HMAC keys in `scan()` (`R2-10`).
- Existing secretless `scan` calls (`installationSecret` omitted) and 32-byte `scan` vectors are unaffected.
- `contracts/spec/k5-detection.md` §2 step 1 states the normative check.
