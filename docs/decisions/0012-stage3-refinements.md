# ADR-0012: Refinements of the platform-kit draft made in Stage 3

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
Writing exact algorithms and vectors exposed details the draft left open or that conflicted with its own rules.

## Options
1. Each refinement below versus keeping the draft text.

## Decision
Adopted: (1) `entropy_min` is a decimal **string** ("3.5") because pk-JCS forbids non-integers; (2) `pair_with.rules` is a list (Razorpay has live and test key IDs); (3) registry `break_glass` entries have no `used` flag (a signed registry cannot track use; the verifier store does); (4) `webauthn-ES256` verification lives in core `verifyEnvelope` (keys carry `rp_id`/`origins`); (5) registry carries `allow_synced_passkeys`; (6) PII placeholders never carry a fingerprint (all PII, not only Aadhaar); (7) regex dialect is an escape whitelist (no `\d \w \s`, they differ across engines); (8) hidden-character rules are code point ranges, not regexes; (9) finding offsets are UTF-16 code units (same in JS, .NET, JVM); (10) checkpoint `count` = `seq + 1`; (11) verifier results add `at_seq`/`cause`/`status`; (12) Indian mobile accepts a 5+5 split; (13) only `Asia/Kolkata` and `UTC` time zones in 0.1.

## Consequences
The specs in `contracts/spec/` are normative; `docs/01-research.md` stays as history.
