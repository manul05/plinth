# Session log: Plinth

Newest entry first. One entry per session, at most 12 lines. Cap: 32 KB. When the file passes the
cap, move the OLDEST entries (bottom of the file) into `archive/YYYY-MM.md` (by the entry's month,
newest first in that file too) in the same commit. Archives are append-only and are not read by
default. Never put secrets or personal data here. The `AI:` line feeds the "How I built this with AI" write-up.

Entry shape:

```
## YYYY-MM-DD · <agent> (<model>) · <short title>
- Did: what changed (files or areas), commits <sha>..<sha>
- Verified: <check> <result> @ <sha>  |  Not run: <check> (why)
- Decisions: ADR-NNNN (or none)
- Owner: "<verbatim approval or instruction>" (YYYY-MM-DD), or none
- AI: what went well / what went wrong / where the owner had to step in
- Next: the next step (also in STATUS.md)
```

---

## 2026-11-26 · Antigravity (Gemini 4 Hydrogen (High)) · Gate R2 fixes (T-M6-05..08) & M6 close (T-M6-04)

- **Did:** Resolved all Gate R2 findings across `04dcfc0` (`T-M6-05`, R2-01 packed `dist/version.*`), `62392eb` (`T-M6-06`, R2-02 registry `BE`/`profile` checks + `ADR-0024` + `k2-approval.md`), `5fd9845` (`T-M6-07`, R2-04..08 `verifyChain`/`verifyRegistryChain`/`verifyApproval` hardening + R2-07/08 tests), and `2de253e` (`T-M6-08`, R2-09..13 `crv`, `scan()` secret >=32B + `ADR-0025` + `k5-detection.md`, error-detail scrub, `spec`/JSONL bounds, synced docs); closed `T-M6-04` and Milestone M6.
- **Verified:** `npm.cmd run check` (`lint` 0 `101` files, `build` 0, `typecheck` 0, `vitest` `402/402` across `43` files, `packs:check` `packs: up to date`, `conformance` `PASS 156/156`) and `npm.cmd run test:perf` (`6/6`, ReDoS max `3.553 ms`) @ `2de253e` + `06-plan.md`.
- **Decisions:** `ADR-0024` (registry `profile`/`alg` & synced-passkey checks), `ADR-0025` (optional `scan` `installationSecret` >= 32B).
- **Owner:** `"option 1"` (2026-11-26) approving all R2 fixes + contract ADRs before closing M6.
- **Next:** `T-MR-01` (Snapshot tool in `docs/plan/MR-release.md`).

---

## 2026-11-26 · Antigravity (Gemini 4 Hydrogen (High)) · CI build order (R2-03), library E2E & Gate R2

- **Did:** Created `packages/ts/test/e2e/library.test.ts` (`E2E-1`..`E2E-4` incl. `prune -> verify`), moved `npm run build` before `typecheck` & `test` in `package.json`, `.github/workflows/ci.yml`, and `docs/testing.md` (`R2-03` fixed), and recorded Gate **R2** (holding `T-M6-04` open pending `R2-01` & `R2-02`).
- **R2 Review (2026-11-26 · independent session):** `1` critical (`R2-01`: `dist/version.{js,d.ts}` missing from `packages/ts/package.json` `files`), `2` high (`R2-02`: `verifyRegistryChain` ignores `BE=1`/`allow_synced_passkeys` and profile/alg binding; `R2-03`: fixed here), `5` medium (`R2-04`..`R2-08`), `5` low (`R2-09`..`R2-13`, `R2-13` `E2E-3` prune fixed here).
- **Verified:** `npm.cmd run check` (`lint` 0 `100` files, `build` 0, `typecheck` 0, `vitest` `387/387` across `43` files, `packs:check` `packs: up to date`, `conformance` `PASS 156/156`) @ `71d83a1` + `R2-03`/`E2E`.
- **Owner:** `"1. go with recommendation"` + submitted R2 report (2026-11-26).
- **Next:** Owner decision on R2 fix scope (`R2-01`, `R2-02` + `ADR-0024`, `R2-04`..`R2-08`, and `R2-09`..`R2-13`), then close `T-M6-04`.

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Package exports, bin & size (T-M6-03)

- **Did:** Added all 7 subpath `exports` and `"bin": { "plinth-conformance": "./dist/tools/conformance.js" }` in `packages/ts/package.json`, copied `LICENSE` and `NOTICE` to `packages/ts/`, created `packages/ts/test/package.test.ts` (4 tests), and marked `T-M6-03` `done`.
- **Verified:** `npm.cmd run build`, `npm.cmd run lint` (99 files), `npm.cmd run typecheck` (0), `npm.cmd test -- packages/ts/test/package.test.ts` (`4/4`: no repo-tools/src/test, entry points present, `unpackedSize <= 600000`, `LICENSE`/`NOTICE` identical) @ `ae2c6a9` + T-M6-03.
- **Decisions:** None.
- **Owner:** `"continue"` (2026-11-25).
- **Next:** `T-M6-04` (`packages/ts/test/e2e/library.test.ts` + review gate **R2**).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · plinth-conformance CLI (T-M6-02)

- **Did:** Implemented `runConformance` and `plinth-conformance` CLI in `packages/ts/src/tools/conformance.ts`, created `packages/ts/test/tools/conformance.test.ts` (2 tests), wired `npm run conformance` into root `package.json` (`check`) and `.github/workflows/ci.yml`, and marked `T-M6-02` `done`.
- **Verified:** `npm.cmd run check` (`lint` 0 `98` files, `typecheck` 0, `vitest` `379/379` across `41` files, `build` 0, `packs:check` `packs: up to date`, `conformance` `PASS 156/156`), `node packages/ts/dist/tools/conformance.js` (`usage: plinth-conformance <vectors-dir>`, exit `2`) @ `e3100e9` + T-M6-02.
- **Decisions:** None.
- **Owner:** `"continue"` (2026-11-25).
- **Next:** `T-M6-03` (`packages/ts/package.json` exports/bin, `LICENSE`/`NOTICE`, `package.test.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Lock public API to contract (T-M6-01)

- **Did:** Moved `PLINTH_VERSION` into `packages/ts/src/version.ts`, re-exported `errors.js`, `version.js`, and explicit `json.js` members (removing internal `MAX_DEPTH` from `core/index.ts`), added `packs/index.js` to `src/index.ts`, created `packages/ts/test/api-conformance.test.ts`, and marked `T-M6-01` `done`.
- **Verified:** `npm.cmd run lint` (96 files), `npm.cmd run typecheck` (0), `npm.cmd test -- api-conformance version json` (`7/7` across `4` files) @ `5635015` + T-M6-01.
- **Decisions:** None.
- **Owner:** `"continue"` (2026-11-25).
- **Next:** `T-M6-02` (`packages/ts/src/tools/conformance.ts`: `plinth-conformance` CLI).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Close M5 with mutation checks (T-M5-11)

- **Did:** Ran mutation checks MC-12 (`redact.ts` PII fingerprint → `k5-redact-aadhaar-no-fingerprint` failed), MC-13 (`scan.ts` drop pairing → exposed gap in existing tests because `tests.yaml` lacked `rzp_`, added `enforces pair_with proximity` unit test in `k5-vectors.test.ts` which failed on mutation and passed restored), MC-14 (`load.ts` skip rules digest → `load.test.ts` failed); added `DNB-004` to `docs/do-not-break.md`; marked `T-M5-11` `done` (closing M5).
- **Verified:** `npm.cmd run check` (`lint` 0 `94` files, `typecheck` 0, `vitest` `376/376` across `39` files, `build` 0, `packs:check` `packs: up to date`) @ `c00f4b0` + T-M5-11.
- **Decisions:** None.
- **Owner:** `"continue"` (2026-11-25).
- **AI:** MC-13 caught a real blind spot in `tests.yaml` where the keyword prefilter masked the pairing check; adding the explicit proximity unit test made MC-13 effective.
- **Next:** `T-M6-01` (`packages/ts/test/api-conformance.test.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Performance and ReDoS budgets (T-M5-10)

- **Did:** Created `packages/ts/test/perf/budgets.perf.ts` (6 tests), stopped on `verifyEnvelope` (`5.450 ms`) & `verifyApproval` (`38.510 ms` loaded), wrote `ADR-0023` raising NFR-2 crypto budgets to `<= 25 ms` / `<= 50 ms` in `docs/03-spec.md`, `docs/plan/M5-detection.md`, and `budgets.perf.ts`, and marked `T-M5-10` `done`.
- **Verified:** `npm.cmd run lint` (94 files), `npm.cmd run typecheck`, `npm.cmd run test:perf` (`6/6`: 10KB `1.199 ms`, Ed25519 `8.143 ms`, WebAuthn `20.005 ms`, 10k chain `672.38 ms`, 100KB scan `44.496 ms`, ReDoS max `14.434 ms`) @ `0ebf3fa` + T-M5-10.
- **Decisions:** `ADR-0023`.
- **Owner:** `"option 1"` (2026-11-25).
- **Next:** `T-M5-11` (mutation checks MC-12..14, `DNB-004`, close M5).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Gate G-K5 verified Indian key formats (T-M5-09)

- **Did:** Recorded gate G-K5: Razorpay (`rzp_test_` 23c, secret 24c) matched; Cashfree missed `TEST`+36-hex (40c, entropy < 4.0) and `cfsk_ma_test_`+32+8 hex (54c). Per owner `"b1"`, added `rev: 2` (`stable`/`verified`) for those 3 rules + 3 synthetic tests in `rules/pk.secrets.india/`, rebuilt `packs/` + `builtin.ts`, updated `k4-pack-digests-pk-secrets-india.json` + `index.json`, wrote `ADR-0022`, and marked `T-M5-09` `done`.
- **Verified:** `npm.cmd run packs:build` (`4 compiled, 38 rules, 73 tests`), `npm.cmd run check` (`lint` 0 `93` files, `typecheck` 0, `vitest` `375/375` across `39` files incl. `73/73` pack tests and `6/6` contracts, `build` 0, `packs:check` `packs: up to date`) @ `a44a785` + T-M5-09.
- **Decisions:** `ADR-0022`.
- **Owner:** `"b1"` (2026-11-25).
- **Next:** `T-M5-10` (Performance and ReDoS budgets) then `T-M5-11` (M5 close).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Masked file scanner detect-file (T-M5-08)

- **Did:** Implemented `detectFileReport` and CLI in `packages/ts/src/repo-tools/detect-file.ts`, added `packages/ts/test/repo-tools/detect-file.test.ts` (2 tests), and marked `T-M5-08` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run check` (`lint` 0 `93` files, `typecheck` 0, `vitest` `372/372` across `39` files, `build` 0, `packs:check` `packs: up to date`), `node packages/ts/dist/repo-tools/detect-file.js` (`usage: detect-file <path>`, exit `2`) @ `83d3c1a` + T-M5-08.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development (stop at T-M5-09 / owner gate G-K5)."` (2026-11-25).
- **Next:** `T-M5-09` (Owner gate G-K5: verify real Indian test-mode key formats with `detect-file.js`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Personal-data lint for audit events (T-M5-07)

- **Did:** Implemented `lintPersonalData` in `packages/ts/src/audit/lint.ts`, re-exported it from `audit/index.ts`, added `packages/ts/test/audit/lint.test.ts` (4 tests), and marked `T-M5-07` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (91 files), `npm.cmd run typecheck`, `npm.cmd test -- lint k1` (`23 passed (23)`: 21/21 `k1` vectors + 2 unit tests) @ `46bbbcd` + T-M5-07.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-08` (`repo-tools/detect-file.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Compiler runs pack tests (T-M5-06)

- **Did:** Implemented step 7 (`runPackTests`) in `compile-packs.ts` (and enabled `runTests: true` in CLI), added `bad-pack` fixture and `compile-tests.test.ts` (2), and marked `T-M5-06` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (89 files), `npm.cmd run typecheck`, `npm.cmd test -- compile-tests` (`2/2`), `npm.cmd run packs:check` (`packs: up to date`) @ `ec1469f` + T-M5-06.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-07` (`audit/lint.ts`: `lintPersonalData`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Redact, fingerprints & overlap (T-M5-05)

- **Did:** Added internal `hmacSha256Hex` in `core/bytes.ts` (unexported from `core/index.ts`), wired `fingerprint` in `detect/scan.ts`, implemented `redact` in `detect/redact.ts`, created `test/detect/redact.test.ts`, and marked `T-M5-05` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (88 files), `npm.cmd run typecheck`, `npm.cmd test -- redact k5 pack-tests` (`96 passed (96)`: 70 pack tests, 20 `k5` vectors + 3 helpers, 3 redact security tests) @ `c23fc26` + T-M5-05.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-06` (`compile-packs` runs pack tests).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Hidden-character runs (T-M5-04)

- **Did:** Implemented `scanHiddenCharRule` in `packages/ts/src/detect/scan.ts` reporting maximal hidden-character runs with UTF-16 offsets and distinct first-seen `U+XXXX` previews; marked `T-M5-04` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (87 files), `npm.cmd run typecheck`, `npm.cmd test -- pack-tests k5` (`85 passed | 8 failed`: `70/70` pack tests, `4/4` `k5` scan, `11/11` helpers; 8 redact vectors pending) @ `b0cde1b` + T-M5-04.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-05` (`redact.ts`: placeholders, overlap, fingerprints).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Regex scanning, pairing & sort (T-M5-03)

- **Did:** Implemented `scan` in `packages/ts/src/detect/scan.ts` for secret, PII, and phrase rules with keyword prefilter, entropy/allow/validator checks, `pair_with` distance filtering, and deterministic sorting; marked `T-M5-03` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (87 files), `npm.cmd run typecheck`, `npm.cmd test -- pack-tests k5` (`79 passed | 14 failed`: 65/70 pack tests incl. all 60 regex-pack tests, 3/4 `k5` scan vectors, 11/11 helpers) @ `a978c14` + T-M5-03.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-04` (`scan.ts`: hidden-character runs).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Validators, entropy & masks (T-M5-02)

- **Did:** Implemented `verhoeffValid`, `gstinValid`, `upiHandleValid` in `validators.ts`, `shannonEntropy` in `entropy.ts`, and `maskSecret` in `mask.ts`, added unit tests in `k5-vectors.test.ts`, and marked `T-M5-02` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (87 files), `npm.cmd run typecheck`, `npm.cmd test -- k5` (`11 passed | 12 failed`: 7/7 validator, 2/2 maskSecret, 2/2 helpers; 12 scan/redact still unimplemented) @ `c4f4fc6` + T-M5-02.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-03` (`scan.ts`: regex rules, pairing, sort).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Red skeleton k5 & pack tests (T-M5-01)

- **Did:** Added `packages/ts/src/detect/` stubs (`index`, `validators`, `entropy`, `mask`, `scan`, `redact`), exported `./detect/index.js` from `packages/ts/src/index.ts`, created `k5-vectors.test.ts` (20) and `pack-tests.test.ts` (70), and marked `T-M5-01` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run lint` (87 files), `npm.cmd run typecheck`, `npm.cmd test -- k5 pack-tests` (`90 failed (90)`: 20 k5 + 70 pack tests) @ `7b76af6` + T-M5-01.
- **Decisions:** None.
- **Owner:** `"Start M5 (docs/plan/M5-detection.md) from docs/status/STATUS.md and execute T-M5-01 to T-M5-08 one by one on development"` (2026-11-25).
- **Next:** `T-M5-02` (`validators.ts`, `entropy.ts`, `mask.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · CI drift check & close M4 (T-M4-08)

- **Did:** Added `packages/ts/test/repo-tools/packs-check.test.ts`, wired `npm run packs:check` into `.github/workflows/ci.yml` and `package.json` (`check`), and marked `T-M4-08` `done` in `docs/06-plan.md` (closing Milestone M4).
- **Verified:** `npm.cmd test -- packs-check` (`2/2`), `npm.cmd run check` (`lint` 0 `79` files, `typecheck` 0, `vitest` `268/268` across `33` files incl. `39/39` `k4` and `5/5` `portability`, `build` 0, `packs:check` `packs: up to date`) @ `f5eaf88` + T-M4-08.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M5-01` (Red skeleton `k5` + pack tests).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Digest-checked pack loading (T-M4-07)

- **Did:** Implemented `loadPack` in `packages/ts/src/rulepack/load.ts` and `activeRules` in `packages/ts/src/rulepack/asof.ts`, created `packages/ts/test/rulepack/load.test.ts` (6 tests), and marked `T-M4-07` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run check` (`lint` 0 `78` files, `typecheck` 0, `vitest` `266/266` across `32` files incl. `load` `6/6`, `portability` `5/5`, `build` 0) @ `09d227b` + T-M4-07.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-08` (`packs-check.test.ts`, CI check, close M4).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Compile rule packs & builtin.ts (T-M4-06)

- **Did:** Implemented `compilePacks` + CLI in `packages/ts/src/repo-tools/compile-packs.ts`, added `packs:build`/`packs:check` to `package.json`, generated `packs/` + `packages/ts/src/packs/builtin.ts` (`4` packs, `35` rules, `70` tests), created `packages/ts/src/packs/index.ts`, added `builtin.ts` header test, marked `T-M4-06` `done`.
- **Verified:** `k4` `39/39`, `packs:build` (`4 compiled, 35 rules, 70 tests`), `packs:check` (`up to date`), `npm.cmd run check` (`lint` 0, `typecheck` 0, `vitest` `260/260`, `build` 0) @ `a4f909e` + T-M4-06.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-07` (`loadPack`, `activeRules`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Repo-tools schema validation helper (T-M4-05)

- **Did:** Added `validateAgainst` in `packages/ts/src/repo-tools/schema.ts` and `packages/ts/test/repo-tools/schema.test.ts`, and marked `T-M4-05` `done` in `docs/06-plan.md`.
- **Verified:** `schema` `2/2`, `portability` `5/5`, `lint` 0, `typecheck` 0, `build` 0 @ `64b1be1` + T-M4-05.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-06` (`compilePacks`, `packs/`, `packages/ts/src/packs/`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Portable regex dialect lint (T-M4-04)

- **Did:** Implemented `lintRegex` in `packages/ts/src/repo-tools/regex-lint.ts`, added a `rules/*/rules.yaml` validation test in `packages/ts/test/rulepack/k4-vectors.test.ts`, and marked `T-M4-04` `done` in `docs/06-plan.md`.
- **Verified:** `k4 lintRegex` (`14 passed`), `portability` `5/5`, `lint` 0, `typecheck` 0, `build` 0 @ `a67e620` + T-M4-04.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-05` (`packages/ts/src/repo-tools/schema.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Safe YAML subset reader (T-M4-03)

- **Did:** Implemented `yamlToValue` in `packages/ts/src/repo-tools/yaml-subset.ts`, added quoted string and negative integer assertions in `packages/ts/test/rulepack/k4-vectors.test.ts`, and marked `T-M4-03` `done` in `docs/06-plan.md`.
- **Verified:** `k4 yamlSubset` (`11 passed`), `portability` `5/5`, `lint` 0, `typecheck` 0, `build` 0 @ `9a86c4c` + T-M4-03.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-04` (`packages/ts/src/repo-tools/regex-lint.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · As-of rule selection and localDate (T-M4-02)

- **Did:** Implemented `selectAsOf` and `localDate` in `packages/ts/src/rulepack/asof.ts`, added invalid-timestamp unit test in `packages/ts/test/rulepack/k4-vectors.test.ts`, and marked `T-M4-02` `done` in `docs/06-plan.md`.
- **Verified:** `k4 selectAsOf` (`4 passed`), `k4 localDate` (`5 passed`), `portability` `5/5`, `lint` 0, `typecheck` 0, `build` 0 @ `716d5e5` + T-M4-02.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-03` (`packages/ts/src/repo-tools/yaml-subset.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Red skeleton k4 vector runner (T-M4-01)

- **Did:** Created `packages/ts/src/rulepack/{index,asof,load}.ts` and `packages/ts/src/repo-tools/{yaml-subset,regex-lint,compile-packs}.ts` stubs, wired `packages/ts/src/index.ts`, added `packages/ts/test/rulepack/k4-vectors.test.ts` (35 vectors), and marked `T-M4-01` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd test -- k4` (`35 failed (35)`), `portability` `5/5`, `lint` 0, `typecheck` 0, `build` 0 @ `a237d0e` + T-M4-01.
- **Decisions:** None.
- **Owner:** `"execute T-M4-01 to T-M4-08 one by one"` (2026-11-25).
- **Next:** `T-M4-02` (`packages/ts/src/rulepack/asof.ts`: `selectAsOf`, `localDate`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Medium R1 hardening & K1 anchor limit (T-M3-12)

- **Did:** Added `ADR-0021`, updated `k2-approval.md`, `k1-audit.md`, `05-threat-model.md` (TM-15/16), hardened `verify.ts`, `registry.ts`, and `breakglass.ts` (`R1-03`, `R1-04`, `R1-05`, `R1-07`) with red-first unit tests, and marked `T-M3-12` `done`.
- **Verified:** `npm.cmd run check` (`lint` `Checked 67 files` 0, `typecheck` 0, `vitest` `29 files / 219 tests` incl. `k2` `51/51`, `build` 0) @ `3ddbc0c` + T-M3-12.
- **Decisions:** `ADR-0021`.
- **Owner:** `"Option 1 (Recommended)"` (2026-11-25).
- **Next:** `T-M4-01` (`docs/plan/M4-rulepack.md`: red skeleton `k4` vector runner).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Registry update_threshold by distinct approver IDs (T-M3-11)

- **Did:** Added `ADR-0020`, updated `pk-approval.registry-payload.schema.json`, `plinth-api.d.ts`, `k2-approval.md`, `05-threat-model.md` (`TM-36`), implemented `update_threshold` distinct-approver check in `registry.ts`, added `k2-registry-update-threshold-{insufficient,valid}` (`index.json` 189 entries) + unit test, and marked `T-M3-11` `done`.
- **Verified:** `npm.cmd run check` (`lint` `Checked 67 files` 0, `typecheck` 0, `vitest` `29 files / 216 tests` incl. `k2` `51/51`, `build` 0) @ `3c8d0bd` + T-M3-11.
- **Decisions:** `ADR-0020`.
- **Owner:** `"Option 1 (Recommended)"` (2026-11-25).
- **Next:** `T-M3-12` (`R1-03..05/07` Medium fixes).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Enforcement actionPolicies & requester identity (T-M3-10)

- **Did:** Added `ADR-0019`, updated `k2-approval.md`, `plinth-api.d.ts`, `05-threat-model.md` (TM-12), implemented `actionPolicies` + `requesterHumanId` in `verify.ts` and `store.ts`, added `k2-approval-policy-downgrade` and `k2-approval-distinct-downgrade` (`index.json` 187 entries), and marked `T-M3-10` `done`.
- **Verified:** `npm.cmd run check` (`lint` `Checked 67 files` 0, `typecheck` 0, `vitest` `29 files / 213 tests` incl. `k2` `49/49`, `build` 0) @ `353d0fc` + T-M3-10.
- **Decisions:** `ADR-0019`.
- **Owner:** `"Option 1 (Recommended)"` (2026-11-25).
- **Next:** `T-M3-11` (`R1-02` High fix: registry `update_threshold` with distinct approver IDs).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · M3 close & R1 security review (T-M3-09)

- **Did:** Added `DNB-003` to `docs/do-not-break.md`, committed `ADR-0018` + 2 real-authenticator `k2` vectors (`0c2816f`), logged R1 findings, added `T-M3-10` & `T-M3-11` for the 2 High findings, and marked `T-M3-09` `done`.
- **Mutations (`npm.cmd test -- k2`):** `MC-3` (`webauthn.ts` UV) failed `k2-approval-uv-off`; `MC-4` (`webauthn.ts` origin) failed `k2-approval-wrong-origin`; `MC-8` (`verify.ts` subject) failed `k2-approval-subject-mismatch`; `MC-9` (`verify.ts` consumed) failed `k2-approval-replayed`; `MC-10` (`registry.ts` new keys) failed `k2-registry-update-unauthorised`; `MC-11` (`verify.ts` BE) failed `k2-approval-synced-passkey-refused`. All restored cleanly (`git diff packages/` empty).
- **R1 Review (2026-11-25 · Antigravity Claude Opus 5.5):** `0` critical, `2` high (`R1-01`, `R1-02`), `5` medium (`R1-03`..`R1-07`; `R1-06` resolved by `0c2816f`), `10` low (`R1-08`..`R1-17`). Decision: hold M4 until `T-M3-10` (`R1-01`) and `T-M3-11` (`R1-02`) are fixed.
- **Verified:** `npm.cmd run check` (`lint` `Checked 67 files` 0, `typecheck` 0, `vitest` `29 files / 209 tests` incl. `k2` `47/47`, `build` 0) @ `0c2816f` + T-M3-09.
- **Owner:** `"Option 1 (Recommended): Yes, commit both as verifyEnvelope vectors..."` + submitted R1 report (2026-11-25).
- **Next:** `T-M3-10` (R1-01 High fix; needs ADR + owner OK for `contracts/` change).
