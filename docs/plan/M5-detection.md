# M5 K5 Detection — task cards

**Goal:** all 20 `k5` vectors, the 2 `k1` lint vectors and all 70 pack tests pass; redaction never leaks; Indian formats checked by the owner; ReDoS and speed budgets met.
**Demo:** `detect-file` on a synthetic handoff prints masked findings; `redact` output shows `[REDACTED:github_pat:…6591]` and `[REDACTED:aadhaar]`.
Files: `packages/ts/src/detect/`, tests `packages/ts/test/detect/`.

---

### T-M5-01 · Red skeleton: k5 vectors and pack-test runner
- **Size:** S
- **Depends on:** T-M4-08
- **Covers:** AC-16.1–16.3, AC-17.1–17.4 (failing harness)
- **Read first:** `contracts/spec/k5-detection.md`; `contracts/test-vectors/README.md`
- **Create:** `packages/ts/test/detect/k5-vectors.test.ts`, `packages/ts/test/detect/pack-tests.test.ts`; stubs `packages/ts/src/detect/index.ts`, `validators.ts`, `entropy.ts`, `mask.ts`, `scan.ts`, `redact.ts` with the K5 names from the API file (`MAX_SCAN_INPUT = 1000000 as const` is final now).
- **Modify:** `packages/ts/src/index.ts` (add `export * from './detect/index.js';`)
- **Tests (write first):** `k5-vectors.test.ts`: text = `input.text_parts.join('')` or `input.text_repeat.unit.repeat(input.text_repeat.times)`; packs = `input.packs.map(id => loadPack(BUILTIN_PACKS[id]))`; secret = `hexDecode(input.installation_secret_hex)` when present. Ops: `scan` (`{findings: scan(text, packs, {date, installationSecret?})}` `toEqual(expect)` or error code), `redact` (`toEqual(expect)` or code), `validator` (`verhoeff` → `verhoeffValid`, `gstin` → `gstinValid`, `upi_handle` → `upiHandleValid(value, input.handles)`), `maskSecret`. `pack-tests.test.ts` › `every pack test passes`: for each builtin pack and each test, `scan(input_parts.join(''), [loadPack(pack)], {date: rule.effective_from})` contains a finding with that `rule_id` ⇔ `expect === 'match'`; one `it` per test, named `<rule_id> #<index> <expect>`.
- **Run:** `npm test -- k5 pack-tests` → 20 + 70 failing. Paste.
- **Commit:** `test(detect): add failing k5 vectors and pack-test runner (T-M5-01)`

### T-M5-02 · validators.ts, entropy.ts, mask.ts
- **Size:** S
- **Depends on:** T-M5-01
- **Covers:** AC-17.2 (Verhoeff), rule validators
- **Read first:** `contracts/spec/k5-detection.md` §4
- **Modify:** `validators.ts`, `entropy.ts`, `mask.ts`
- **Steps:** Verhoeff tables exactly:
  ```ts
  const D = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  const P = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,7,8,6,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  // valid: c = 0; for i over digits from the RIGHT (i = 0 for the last digit): c = D[c][P[i % 8][digit]]; valid when c === 0
  ```
  GSTIN per spec §4. `shannonEntropy` over `charCodeAt` counts with `Math.log2`. `maskSecret` per spec (`…` = `'\u2026'`).
- **Tests (write first):** 7 `validator` vectors + `maskSecret` vector; `shannonEntropy('aaaa') === 0`, `shannonEntropy('ab') === 1`; `verhoeffValid('')` false; `verhoeffValid('12a4')` false.
- **Run:** `npm test -- k5`
- **Commit:** `feat(detect): Verhoeff, GSTIN, UPI validators, entropy and masks (T-M5-02)`

### T-M5-03 · scan.ts: regex rules (secret, PII, phrase), pairing, sort
- **Size:** M
- **Depends on:** T-M5-02
- **Covers:** AC-16.1, AC-16.3, TM-19, TM-22
- **Read first:** `contracts/spec/k5-detection.md` §2 (steps 1–6)
- **Modify:** `packages/ts/src/detect/scan.ts`
- **Steps:** follow §2 exactly. Rules: `packs.flatMap(p => activeRules(p, date).map(r => ({kind: p.manifest.kind, rule: r})))`. Compile each regex once per call with flags `'dgu' + (body.flags ?? '')`. Group offsets from `match.indices[group]`. Build finding objects with members in this order (order does not matter for tests, but keep it): `rule_id, rev, kind, start, end, severity`, then kind-specific members, then `masked_preview`, then `fingerprint` (secret, only with a secret). Keep the pairing marker in a separate `Map<Finding, pair_with>`, never as a member of the returned object. Sort per §2.5 (`(a,b) => a.start-b.start || (b.end-b.start)-(a.end-a.start) || rank(b)-rank(a) || (a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0)`).
- **Tests (write first):** the pack tests for the 3 regex-based packs (`pk.secrets.global` 24, `pk.secrets.india` 16, `pk.pii.india` 14, and the 6 phrase tests of `pk.untrusted-text`); vectors `k5-scan-no-secret-no-fingerprint`, `k5-scan-git-sha-not-instamojo`, `k5-scan-err-too-large`.
- **Run:** `npm test -- pack-tests k5`
- **Commit:** `feat(detect): regex scanning with pairing and stable order (T-M5-03)`

### T-M5-04 · scan.ts: hidden-character runs
- **Size:** S
- **Depends on:** T-M5-03
- **Covers:** AC-16.2, TM-24
- **Read first:** `contracts/spec/k5-detection.md` §2 step 3 first bullet
- **Modify:** `packages/ts/src/detect/scan.ts` (hidden_char branch only)
- **Steps:** loop `i` over the text; `cp = text.codePointAt(i)`; width = `cp > 0xFFFF ? 2 : 1`; a run continues while each next code point is in any range; `masked_preview` = distinct code points in first-seen order as `'U+' + cp.toString(16).toUpperCase().padStart(4, '0')` joined with `,`.
- **Tests (write first):** the 10 hidden-character pack tests; vector `k5-scan-hidden-and-phrases`.
- **Run:** `npm test -- pack-tests k5` → 70/70 pack tests, scan vectors pass
- **Commit:** `feat(detect): report hidden-character runs (T-M5-04)`

### T-M5-05 · redact.ts: placeholders, overlap, fingerprints
- **Size:** M
- **Depends on:** T-M5-04
- **Covers:** AC-17.1–17.5, TM-19, TM-20, TM-21, NFR-6
- **Read first:** `contracts/spec/k5-detection.md` §3
- **Modify:** `packages/ts/src/detect/redact.ts`, `packages/ts/src/detect/scan.ts` (fingerprint: `hexEncode(hmac(sha256, installationSecret, utf8Encode(value)))` — import `hmac` and `sha256` in `core/bytes.ts` and export a helper `hmacSha256Hex(key: Uint8Array, data: Uint8Array): string` from there, so `detect/` does not import noble directly; it is internal: import it in `scan.ts` from `../core/bytes.js` and do **not** re-export it from `core/index.ts`)
- **Create:** `packages/ts/test/detect/redact.test.ts`
- **Steps:** §3 steps 1–5 exactly.
- **Tests (write first):** the 8 `redact` vectors; `redact.test.ts` › `findings never echo the secret`: for every k5 `redact`/`scan` vector, for every part in `text_parts` that is ≥ 16 characters, `JSON.stringify(result)` does not contain that part, and `JSON.stringify(result)` does not contain `2949 1013 6515`; › `PlinthError details never contain input`: `redact('x'.repeat(1000001), packs, …)` error message does not contain `xxxx`.
- **Run:** `npm test -- redact k5` → 20/20 k5 vectors
- **Commit:** `feat(detect): redact secrets and PII with typed placeholders (T-M5-05)`

### T-M5-06 · compile-packs runs pack tests
- **Size:** S
- **Depends on:** T-M5-05
- **Covers:** AC-13.3 (tests pass at compile), compile step 7
- **Read first:** `contracts/spec/k4-rulepack.md` §3 step 7, §6
- **Modify:** `packages/ts/src/repo-tools/compile-packs.ts` (step 7; script mode now uses `runTests:true`), `packages/ts/test/rulepack/k4-vectors.test.ts` (no change needed: it passes `runTests:false`)
- **Create:** `packages/ts/test/repo-tools/compile-tests.test.ts`, fixture dir `packages/ts/test/fixtures/bad-pack/pk.test.bad/{pack.yaml,rules.yaml,tests.yaml}` — a copy of `rules/pk.pii.india/*.yaml` with `id`/`pack_id` changed to `pk.test.bad` and the first test's `expect` flipped from `'match'` to `'no_match'`.
- **Tests (write first):** compiling the fixture dir with `runTests:true` throws `PK_RULEPACK_TEST_FAILED` whose detail contains `pk.pii.in.aadhaar`; compiling `rules/` with `runTests:true` returns `{packs:4, rules:35, tests:70, differing:[]}` in check mode.
- **Run:** `npm test -- compile-tests`; `npm run packs:check` → `packs: up to date`
- **Commit:** `feat(rulepack): run every rule test during compilation (T-M5-06)`

### T-M5-07 · audit/lint.ts: lintPersonalData
- **Size:** S
- **Depends on:** T-M5-05
- **Covers:** AC-18.1, TM-18
- **Read first:** `contracts/spec/k1-audit.md` §6 (second bullet)
- **Create:** `packages/ts/src/audit/lint.ts`, `packages/ts/test/audit/lint.test.ts`
- **Modify:** `packages/ts/src/audit/index.ts` (export `lintPersonalData`)
- **Tests (write first):** the 2 `lintPersonalData` vectors (`rule_ids` = `findings.map(f => f.rule_id)`); `lintPersonalData` on an event whose `data.mobile` is `'+91 98765 43210'` → `['pk.pii.in.mobile']`.
- **Run:** `npm test -- lint k1` → 21/21 k1 vectors
- **Commit:** `feat(audit): personal-data lint for audit events (T-M5-07)`

### T-M5-08 · repo-tools/detect-file.ts (owner's masked scanner)
- **Size:** S
- **Depends on:** T-M5-05
- **Covers:** AC-21.1 (tool), NFR-6, TM-19
- **Create:** `packages/ts/src/repo-tools/detect-file.ts`, `packages/ts/test/repo-tools/detect-file.test.ts`
- **Interface (exact):** `export function detectFileReport(text: string, date: string): string[]` — one line per finding of `scan(text, all four builtin packs, {date})` (no secret): `${rule_id} rev ${rev} ${kind} ${start}-${end} ${masked_preview}`; when there are none, `['no findings']`. Script mode: `node packages/ts/dist/repo-tools/detect-file.js <path>` reads the file as UTF-8, uses today's date `localDate(timestampFromMs(Date.now()), 'Asia/Kolkata')`, prints the lines, exits 0; missing argument → stderr `usage: detect-file <path>` exit 2.
- **Tests (write first):** › `output never contains the secret`: for the text of vector `k5-redact-razorpay-pair`, lines are exactly `['pk.secret.razorpay.key_id_live rev 1 secret 16-39 rzp_…iW', 'pk.secret.razorpay.key_secret rev 1 secret 60-84 <maskSecret of the 24-char secret>']` (compute the second preview in the test with `maskSecret`), and no line contains any `text_parts` element of length ≥ 14; `detectFileReport('hello', '2026-11-01')` → `['no findings']`.
- **Commit:** `feat(detect): masked file scanner for owner checks (T-M5-08)`

### T-M5-09 · OWNER GATE G-K5: real Indian test-mode key formats
- **Size:** S
- **Depends on:** T-M5-08
- **Covers:** AC-21.1, TM-22, US-21
- **Owner, in plain English (about 30 minutes):** (1) create free accounts at Razorpay and Cashfree and switch both dashboards to **Test mode**; (2) generate test API keys; (3) in Notepad create `C:\Users\<you>\Documents\plinth-keys-check.txt` (**outside** the repo) with one line per value written exactly as you would paste it in a config file, for example `RAZORPAY_KEY_ID=…`, `RAZORPAY_KEY_SECRET=…`, `x-client-id: …`, `x-client-secret: …`; (4) in Git Bash in the repo: `npm run build && node packages/ts/dist/repo-tools/detect-file.js ~/Documents/plinth-keys-check.txt`; (5) paste the printed lines (they are masked) into the chat; (6) delete the file and revoke/regenerate the test keys in both dashboards.
- **Agent:** never ask for, read or print the key values. Compare the pasted lines with the expected rule ids.
- **Outcome A — each key line produced the expected rule** (`razorpay.key_id_test`, `razorpay.key_secret`, `cashfree.credential` for both id and secret): create rule revision 2 for those rules in `rules/pk.secrets.india/rules.yaml` with `verified: {state:'verified', by:'owner gate G-K5', at:'<date>', note:'Matched a real test-mode key from the provider dashboard; value never stored.'}`, `status: 'stable'`, `effective_from` = the date, rev 1 gets `effective_until` = the same date, add a `changes` entry; `npm run packs:build`; **this changes the k4 `compilePackDigests` vector for `pk.secrets.india`**: ask the owner in chat for OK, then write ADR-0016 "Verified Indian key formats", regenerate that vector's expected digests with the compiler output and refresh `contracts/test-vectors/index.json` (the one-off script goes into the ADR text).
- **Outcome B — a key was missed or matched the wrong rule:** paste the masked line, write in LOG which rule and what the masked preview shows (prefix and length only), and STOP: the owner decides whether to (b1) adjust the regex in a new rule revision (agent proposes the exact new regex plus a synthetic positive and negative test), or (b2) keep the rule `experimental` and note the gap in `docs/05-threat-model.md` TM-22.
- **Outcome C — the owner cannot create test accounts now:** rules stay `experimental/unverified`; record "G-K5 deferred" in LOG and STATUS; continue (Passdown still redacts with experimental rules).
- **Done when:** one outcome recorded with date and the owner's quote.
- **Commit:** `docs: record gate G-K5 result for Indian key formats (T-M5-09)` (plus the rule revision commit in Outcome A)

### T-M5-10 · Performance and ReDoS budgets
- **Size:** S
- **Depends on:** T-M5-05, T-M3-07, T-M2-05
- **Covers:** NFR-2, NFR-3, TM-23
- **Create:** `packages/ts/test/perf/budgets.perf.ts`, `packages/ts/test/fixtures/perf-10kb.json` (generated in the test's `beforeAll` instead if you prefer: an object with 200 members `k000`…`k199`, each the string `'v'.repeat(40)` → about 10 KB; write it in the test, do not commit a file)
- **Tests (write first):** measure with `performance.now()`; median of 50 runs unless stated:
  - canonicalize+digest of the 10 KB object ≤ 5 ms;
  - `verifyEnvelope` of `k0-env-valid-ed25519` ≤ 5 ms;
  - `verifyApproval` of `k2-approval-valid-webauthn` ≤ 20 ms;
  - `verifyChain` of 10,000 events built with `appendEvent` + one checkpoint at the end (single run) ≤ 3,000 ms;
  - `scan` of 100 KB text (the `k5-redact-mixed` text repeated to ≥ 100,000 characters) with all 4 packs ≤ 200 ms;
  - › `no rule exceeds 100 ms on adversarial input`: for each active rule alone (a pack copy holding only that rule, same digests recomputed is not needed: call the internal `scanRules(text, [rule], kind, opts)` if you exported one, otherwise build a `LoadedPack` object directly `{manifest, rules:[rule]}`) on `'a'.repeat(50000)`, `'0'.repeat(50000)`, `'-----BEGIN '.repeat(4545)` → each ≤ 100 ms.
- **Run:** `npm run test:perf` on the owner's old PC → paste the numbers
- **Stop and ask the owner if:** a budget fails (do not change the numbers).
- **Commit:** `test(perf): enforce speed and ReDoS budgets (T-M5-10)`

### T-M5-11 · M5 close: mutation checks and status
- **Size:** S
- **Depends on:** T-M5-06, T-M5-07, T-M5-09, T-M5-10
- **Covers:** NFR-11 (MC-12, MC-13, MC-14)
- **Steps:** three mutation checks; `npm run check`; add to `docs/do-not-break.md`:
  ```
  ## DNB-004: PII placeholders have no fingerprint
  - Where: packages/ts/src/detect/redact.ts
  - Rule: PII placeholders are exactly [REDACTED:<pii_type>]; Aadhaar is never fingerprinted or stored
  - Why: UIDAI rule and DPDP minimisation; a fingerprint would make identifiers linkable
  - Test: k5-redact-aadhaar-no-fingerprint
  ```
- **Done when:** logged · check green · STATUS "Next step: T-M6-01"
- **Commit:** `docs: close milestone M5 with mutation checks (T-M5-11)`
