# ADR-0015: The subject digest is defined by each product, not by Plinth

- **Status:** Accepted
- **Date:** 2026-11-07
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-07: "Yes, reword it"

## Context
`contracts/spec/k2-approval.md` section 1 said Passdown computes `subject.digest` as `digest({kind:"git-commit", repo, ref, sha})` (SHA-256 of the pk-JCS object). Passdown defines it as `"sha256:" + hex(SHA-256(UTF8(repo + "\n" + ref + "\n" + sha)))` (Passdown ADR-0021). Plinth's vectors use the JCS form (checked: `sha256:83c9ceb7…` is the SHA-256 of the JCS of that object).

## Options
1. **Reword the sentence** so the product defines the digest and both forms are shown as examples.
2. **Make Passdown use the JCS form**: changes Passdown's contracts, gate and several cards.

## Decision
Option 1. Plinth never computes the subject digest; `verifyApproval` compares `subject.digest === actualSubjectDigest` as strings (K2 step 6). Wording change only: no behaviour, schema, API or vector changes.

## Consequences
No vector, hash or code changes. Products must state their digest definition in their own docs and test the recompute step with negative vectors (as Passdown does).
