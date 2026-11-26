# K5 Detection packs and reference matcher (`pk-detect/1.0`)

**Status:** normative for Plinth 0.1 (2026-10-31). **Vectors:** `contracts/test-vectors/k5/` (20) plus the 70 rule tests inside the packs. **Schemas:** rule bodies in `pk-rulepack.rules.schema.json`; findings in `pk-detect.finding.schema.json`. **API:** subpath `plinth-kit/detect`.

## 1. Packs in 0.1 (sources in `rules/`, MIT)
| Pack | Kind | Rules | Status |
|---|---|---|---|
| `pk.secrets.global` | secret-detection | 12: GitHub classic PAT, fine-grained PAT, OAuth, App token; GitLab PAT; AWS access key ID; Slack bot token; Stripe secret/restricted key; npm token; Anthropic API key; Google API key; PEM private key | experimental; regexes adapted from gitleaks (MIT, attribution in `NOTICE`); provider docs not re-checked |
| `pk.secrets.india` | secret-detection | 8: Razorpay key ID live/test, Razorpay key secret (paired), Cashfree credential (keyword-anchored), MSG91 authkey (keyword-anchored), Zoho OAuth token, Instamojo client secret and client ID (keyword-anchored) | experimental, unverified until owner gate G-K5 (task T-M5-09) |
| `pk.pii.india` | pii-detection | 7: Aadhaar-like (Verhoeff), PAN, Indian mobile, UPI ID, IFSC, GSTIN (checksum), e-mail | experimental, structures unverified against issuing-authority documents |
| `pk.untrusted-text` | untrusted-text | 5 hidden-character classes (zero-width, bidi controls, tag characters, fillers, variation selectors supplement) + 3 phrase heuristics | hidden: stable; phrases: experimental |
Redaction applies `experimental` and `stable` rules alike (a false positive only over-redacts). Products show `verified.state` where they display findings.

## 2. `scan(text, packs, {date, installationSecret?})` — normative
1. `text.length > 1 000 000` (UTF-16 code units, `MAX_SCAN_INPUT`) → throw `PK_DETECT_INPUT_TOO_LARGE`. If `installationSecret` is supplied, length shorter than 32 bytes → throw `PK_DETECT_SECRET_REQUIRED`.
2. Rules = for each pack in the given order, `activeRules(pack, date)` (K4 §4), tagged with the pack kind.
3. For each rule in that order:
   - **Hidden characters** (`class: "hidden_char"`): walk the text by code point (`codePointAt`, astral = 2 code units). A maximal run of consecutive code points that all fall in any `[start, end]` range of the rule is **one** finding: `start`/`end` = UTF-16 offsets of the run (end exclusive), `masked_preview` = the distinct code points in first-seen order written `U+XXXX` (upper-case hex, at least 4 digits) joined by `,`.
   - **Keyword prefilter** (secret rules): if `keywords` is non-empty and none occurs in `text.toLowerCase()`, skip the rule. Keywords are stored lower-case.
   - **Regex** (secret, PII, phrase): `new RegExp(regex, "dgu" + (flags ?? ""))`, iterate `text.matchAll(re)`. Value = group `secret_group` (secret rules) or group 0 (PII, phrase); skip if undefined or empty. Offsets = `match.indices[group]`.
   - Secret rule: if `entropy_min` is present and `shannonEntropy(value) < Number(entropy_min)` skip; if any `allow` pattern (`new RegExp(p, "u")`) tests true on value skip; finding fields `provider, secret_kind, environment, short`, `masked_preview = maskSecret(value)`, and `fingerprint = hex(HMAC-SHA256(installationSecret, UTF-8(value)))` only when a secret was given.
   - PII rule: run the validator on value (`verhoeff`, `gstin`, `upi_handle` with the body's `handles`, `none`; unknown name → throw `PK_DETECT_UNKNOWN_VALIDATOR`); skip if false. `pii_type`; `masked_preview` = `"…" + last 4 characters of value with every non-alphanumeric character removed` when `mask.display = "last4"`, else `"…"`.
   - Phrase rule: `masked_preview` = value, cut to 64 code units + `"…"` if longer.
4. **Pairing:** a secret finding whose rule has `pair_with` is kept only if some finding from a rule listed in `pair_with.rules` lies within `within_chars`, distance = `max(0, other.start − this.end, this.start − other.end)`.
5. **Sort:** start ascending; then length (end − start) descending; then severity rank descending (critical 4, high 3, medium 2, low 1); then rule_id ascending (code-unit order).
6. Every finding has `rule_id, rev, kind ("secret"|"pii"|"untrusted"), start, end, severity, masked_preview`. Raw values are never returned or logged.

## 3. `redact(text, packs, {date, installationSecret})`
1. `installationSecret` missing or shorter than 32 bytes → throw `PK_DETECT_SECRET_REQUIRED`.
2. `scan(...)` with the secret; drop `untrusted` findings (those are reported, never redacted).
3. Walk the sorted list keeping a finding if `end > lastEnd` (`lastEnd` starts at `0`; contained overlaps where `end ≤ lastEnd` are skipped so at a contained overlap the earlier, longer, more severe one wins; vector `k5-redact-overlap-upi-email`). For each kept finding, copy text from `lastEnd` to `max(start, lastEnd)`, emit the placeholder covering `[max(start, lastEnd), end)` so partially overlapping secret or PII tails are never left raw, and set `lastEnd = end`.
4. Placeholders: secret `[REDACTED:<short>:…<first 4 hex of fingerprint>]` (`…` is U+2026); PII `[REDACTED:<pii_type>]` — **PII never gets a fingerprint; Aadhaar is never stored or fingerprinted (UIDAI rule)**.
5. Output = text with each kept span replaced, left to right. Return `{output, findings (kept, each with placeholder), counts: {secret, pii}}`.
- The installation secret is a per-installation random value (Passdown: a Worker secret), never in the repo. The keyed fingerprint stops short secrets being brute-forced from the placeholder.

## 4. Helpers
- `shannonEntropy(s)` = −Σ p·log2(p) over UTF-16 code units (IEEE double). Vectors avoid values near thresholds.
- `maskSecret(v)`: length ≥ 16 → first 4 + `…` + last 2; else `…`.
- `verhoeffValid(s)`: remove spaces and hyphens; must be ≥ 1 digit and only digits; standard Verhoeff tables (d, p, inv as published; vector `k5-verhoeff-wikipedia`: `2363` valid); valid when the running check ends at 0.
- `gstinValid(s)`: matches `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` and the 15th character equals the check character: alphabet `0-9A-Z` (36); for i = 0..13, v = index, factor = 1 if i even else 2, prod = v·factor, sum += floor(prod/36) + prod mod 36; check = alphabet[(36 − sum mod 36) mod 36]. Vector: `27AAPFU0939F1ZV` valid.
- `upiHandleValid(value, handles)`: text after the last `@`, lower-cased, is in `handles`.

## 5. Test strings (a real trap)
Positive test strings are synthetic (generated from SHA-256 of a label, see `contracts/test-vectors/README.md`), never real keys, not even test-mode keys. Strings matching real token formats are stored **split** (`input_parts`, `text_parts`) and joined at test time so the repo never contains a whole token (GitHub push protection once public).
