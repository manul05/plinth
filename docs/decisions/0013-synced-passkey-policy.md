# ADR-0013: Synced-passkey policy per realm via the BE flag

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Owner (programme decisions log, 2026-10-31)
- **Owner approval:** Programme decisions log 2026-10-31 records: "Synced passkeys allowed for solo tools, device-bound keys for business and regulated products" (log entry, not a verbatim chat quote)

## Context
A synced passkey can be used from any device signed in to the same cloud account.

## Options
1. **Per-realm `allow_synced_passkeys`, decided from the assertion's BE flag**.
2. **Per-approver registration flag only**: can go stale.
3. **Never allow synced**: blocks Passdown on a phone browser.

## Decision
Registry field `allow_synced_passkeys`; when false, an assertion with BE (0x08) set fails `PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED`. Passdown realms use true; GPO Ledger, AuthSunset, Hearth, Pagerline use false.

## Consequences
Vectors k2-approval-synced-passkey-refused/allowed; mutation check MC-11.
