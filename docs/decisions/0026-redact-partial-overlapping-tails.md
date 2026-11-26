# ADR-0026: Redact Partially Overlapping Tails in `redact()`

- **Status:** Accepted
- **Date:** 2026-11-26
- **Decided by:** Manul (owner) + Antigravity
- **Owner approval:** Owner, 2026-11-26: `"optiion 1"` (approving all `<MR>` security fixes including contract ADRs)

## Context

`contracts/spec/k5-detection.md` §3 step 3 previously instructed `redact()` to drop any finding whose `start < lastEnd`. While this handled contained overlaps (`k5-redact-overlap-upi-email`, where `upi` ends inside `email`), an independent `<MR>` review (`SEC-R3-01`, High) demonstrated a bypass on partial overlaps:

- Input `a@x.<secret>` matches `pk.pii.email` (`0..6`, covering `a@x.sk`) and overlaps the beginning of a secret rule starting at index `4` (`pk.secret.anthropic.api_key`, `pk.secret.slack.bot_token`, or `pk.secret.gitlab.pat`).
- Because `4 < 6`, `redact()` dropped the entire secret finding, emitted `[REDACTED:email]` followed by the raw unredacted secret tail, and reported `counts.secret: 0`.

## Options

1. **Keep `start >= lastEnd`:** Leaves `SEC-R3-01` secret-smuggling bypass open. Rejected.
2. **Skip only fully contained overlaps (`end <= lastEnd`) and redact uncovered tails (`max(start, lastEnd)..end`):** When `finding.end <= lastEnd`, the prior placeholder already covers every character of `finding`, so it is skipped (preserving `k5-redact-overlap-upi-email`). Otherwise, `redact()` emits the prefix up to `max(finding.start, lastEnd)` and replaces `[max(finding.start, lastEnd), finding.end)` with `finding`'s placeholder, setting `lastEnd = finding.end`.

## Decision

Option 2. Update `contracts/spec/k5-detection.md` §3 step 3 and `packages/ts/src/detect/redact.ts` accordingly.

## Consequences

- Closes the partial-overlap secret bypass (`SEC-R3-01`, `TM-19`, `TM-22`): zero raw characters of any detected secret or PII span can remain unredacted.
- Preserves all existing `k5` golden vectors including `k5-redact-overlap-upi-email`.
