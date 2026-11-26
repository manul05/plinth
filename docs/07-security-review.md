# Plinth 0.1.0: security review

- **Status:** Signed off (Gate **G-final**)
- **Date:** 2026-11-26
- **Reviewed commit (`development`):** `7685414`
- **Threat model baseline:** `docs/05-threat-model.md` (TM-01 through TM-36)

---

## 1. Golden vectors, pack tests, and performance budgets (`7685414`)

All 156 runtime vectors, 27 tool vectors (tested via Vitest), and 73 pack tests across 4 packs (38 rule-revision entries) pass at `7685414`:

```text
> npm.cmd run check @ 7685414
lint:        biome check . — Checked 107 files in 283ms. No fixes applied.
build:       tsc -p packages/ts/tsconfig.json — exit 0
typecheck:   tsc -p packages/ts/tsconfig.json --noEmit && tsc -p packages/ts/tsconfig.test.json --noEmit — exit 0
vitest:      Test Files  47 passed (47) | Tests  430 passed (430) (includes 156 runtime + 27 tool vectors and 73 pack tests)
packs:check: packs: up to date
conformance: PASS 156/156
```

Performance and ReDoS budgets (`NFR-2`, `NFR-3`) at `7685414`:

```text
> npm.cmd run test:perf @ 7685414
[perf] canonicalize+digest 10KB median: 1.083 ms (budget <= 5 ms)
[perf] verifyEnvelope Ed25519 median: 7.621 ms (budget <= 25 ms)
[perf] verifyApproval WebAuthn median: 13.559 ms (budget <= 50 ms)
[perf] verifyChain 10,000 events: 535.15 ms (budget <= 3000 ms)
[perf] scan 100062 chars (4 packs) median: 66.984 ms (budget <= 200 ms)
[perf] ReDoS adversarial check (35 active rules x 3 inputs): max 8.191 ms (pk.secret.generic.private_key, budget <= 100 ms)
Test Files  1 passed (1) | Tests  6 passed (6)
```

---

## 2. Mutation checks (`NFR-11`, `docs/testing.md` §6)

All 14 scheduled mutation checks (`MC-1`..`MC-14`) were executed, observed failing the named security test, restored, and logged:

| ID | Protection (`file :: mutation`) | Named test that failed | Task / log |
|---|---|---|---|
| MC-1 | `core/envelope.ts` :: skip type-allowlist check | `k0-env-err-type-not-allowed` (`1 failed \| 55 passed`) | `T-M1-11` (`archive/2026-11.md`) |
| MC-2 | `core/envelope.ts` :: omit `type` from PAE | `k0-sig-signing-input`, `k0-sig-sign-ed25519`, `k0-env-valid-*`, `k0-env-err-*` (`8 failed`) | `T-M1-11` (`archive/2026-11.md`) |
| MC-3 | `core/webauthn.ts` :: skip UV flag check | `k2-approval-uv-off` | `T-M3-09` (`LOG.md`) |
| MC-4 | `core/webauthn.ts` :: skip origin check | `k2-approval-wrong-origin` | `T-M3-09` (`LOG.md`) |
| MC-5 | `core/jcs.ts` :: sort keys with `localeCompare` | `k0-jcs-utf16-order` (`1 failed \| 55 passed`) | `T-M1-11` (`archive/2026-11.md`) |
| MC-6 | `audit/verify.ts` :: skip `prev` link check | `k1-chain-tamper-edit-rehash`, `k1-chain-bad-genesis-prev` | `T-M2-06` (`archive/2026-11.md`) |
| MC-7 | `audit/verify.ts` :: skip checkpoint `head` check | `k1-chain-tamper-full-rewrite` | `T-M2-06` (`archive/2026-11.md`) |
| MC-8 | `approval/verify.ts` :: skip `subject.digest` comparison | `k2-approval-subject-mismatch` | `T-M3-09` (`LOG.md`) |
| MC-9 | `approval/verify.ts` :: skip consumed-id check | `k2-approval-replayed` | `T-M3-09` (`LOG.md`) |
| MC-10 | `approval/registry.ts` :: verify update with new keys | `k2-registry-update-unauthorised` | `T-M3-09` (`LOG.md`) |
| MC-11 | `approval/verify.ts` :: ignore BE flag | `k2-approval-synced-passkey-refused` | `T-M3-09` (`LOG.md`) |
| MC-12 | `detect/redact.ts` :: add fingerprint to PII placeholders | `k5-redact-aadhaar-no-fingerprint` | `T-M5-11` (`LOG.md`) |
| MC-13 | `detect/scan.ts` :: drop `pair_with` check | `pk.secrets.india` `key_secret no key ID nearby` + proximity unit test | `T-M5-11` (`LOG.md`) |
| MC-14 | `rulepack/load.ts` :: skip rules digest check | `load.test.ts::tampered rules file is refused` | `T-M5-11` (`LOG.md`) |

---

## 3. Portability and runtime dependency checks

- `packages/ts/test/portability.test.ts`: `5/5` passed at `7685414` (no `node:*`, `eval`, `Function`, `require`, `fetch`, `console`, or dev-only packages in library source; `tools/` never imports `repo-tools/`).
- `packages/ts/test/deps.test.ts`: `3/3` passed at `7685414` (exact pins, `package-lock.json` integrity, no unapproved dependencies).
- `npm.cmd ls --omit=dev --all` at `7685414`:

```text
plinth-repo@0.1.0 E:\work\company\products\plinth
`-- plinth-kit@0.1.0 -> .\packages\ts
  +-- @noble/curves@2.4.0
  | `-- @noble/hashes@2.4.0 deduped
  +-- @noble/hashes@2.4.0
  `-- @scure/base@2.4.0
```

---

## 4. Secret and vulnerability scans (`security-scan.yml`)

- **M0 baseline (`30609a8`, run `45593572876`):** `gitleaks v8.30.1` and `osv-scanner v2.7.0` passed with `.gitleaksignore` covering 11 synthetic test-vector fingerprints from `650cc02`.
- **Pre-fix check (`57d51fb`, run `45696241614`):** `gitleaks v8.30.1` flagged 5 synthetic/public matches across 3 unique fingerprints added after M0 (`09d227b` synthetic `sk-ant-` pack test fixture in `packs/pk.secrets.global/tests.json` and `packages/ts/src/packs/builtin.ts`, and `0c2816f` public WebAuthn `authenticator_data` in `contracts/test-vectors/k2/k2-real-windows-hello.json`).
- **Release candidate (`7685414`, run `45766237355`):** **Passed** (`gitleaks v8.30.1`: `81 commits scanned`, `no leaks found`; `osv-scanner v2.7.0`: `No issues found`). Will be re-verified on the `development -> main` release PR in `T-MR-07`.

---

## 5. Spike `T-M3-08` (real WebAuthn authenticator)

- **Outcome A (`0c2816f`, `ADR-0018`):** Captured two real assertions on `http://localhost:8787`:
  1. Windows Hello laptop PIN (`flags 0x05`, `UP+UV`, `BE=false`, low-S) → `contracts/test-vectors/k2/k2-real-windows-hello.json`.
  2. Phone passkey via Google Password Manager (`flags 0x1d`, `UP+UV+BE+BS`, **high-S**) → `contracts/test-vectors/k2/k2-real-phone.json`.
- Both assertions contain only public keys, synthetic `request_digest` (`sha256:abab...`), and signatures over that test payload, and run unconditionally in `k2-vectors.test.ts` and `plinth-conformance`.

---

## 6. Gate `G-K5` (Indian key formats, `T-M5-09`)

- **Outcome b1 (`16ab84d` / `0ebf3fa`, `ADR-0022`):** Tested retired Razorpay and Cashfree Test-mode keys locally outside the repo via `detect-file.js`.
  - `pk.secret.razorpay.key_id_test` and `pk.secret.razorpay.key_secret` matched and were promoted to `rev: 2` (`stable`, `verified.state: 'verified'`).
  - `pk.secret.cashfree.credential` missed `TEST` + 36 hex (`entropy < 4.0`) and `cfsk_ma_test_` (54 chars); revised in `rev: 2` (`stable`, `verified.state: 'verified'`, `entropy_min: '3.5'`, keyword `cfsk_`) with 3 synthetic tests and updated `k4-pack-digests-pk-secrets-india.json`.
  - Live-mode credentials (`rzp_live_`, `PROD`, `cfsk_ma_prod_`) and `msg91`, `zoho`, `instamojo` rules remain `unverified`.

---

## 7. Independent reviews and findings table

- **R1 (`2026-11-25`, Antigravity Claude Opus 5.5, M0–M3):** `0` critical, `2` high (`R1-01`, `R1-02`), `5` medium (`R1-03`..`R1-07`; `R1-06` resolved by `0c2816f`), `10` low (`R1-08`..`R1-17`).
- **R2 (`2026-11-26`, independent session, M0–M6 up to `71d83a1`):** `1` critical (`R2-01`), `2` high (`R2-02`, `R2-03`), `5` medium (`R2-04`..`R2-08`), `5` low (`R2-09`..`R2-13`).
- **`<MR>` (`2026-11-26`, independent session, M0–MR up to `d339a7c`):** `0` critical, `3` high (`SEC-R3-01`..`SEC-R3-03`), `4` medium (`SEC-R3-04`..`SEC-R3-07`), `4` low (`SEC-R3-08`..`SEC-R3-11`). All 11 findings fixed and verified at `bf79814`, `a5bc9ac`, and `7685414` (`430/430` unit/integration tests, `6/6` perf tests, `PASS 156/156`).

| ID | severity | where | status |
|---|---|---|---|
| R1-01 | high | `packages/ts/src/approval/verify.ts`, `store.ts` | fixed @ `3c8d0bd` (`ADR-0019`, `T-M3-10`) with `k2-approval-policy-downgrade` & `k2-approval-distinct-downgrade` |
| R1-02 | high | `packages/ts/src/approval/registry.ts` | fixed @ `3ddbc0c` (`ADR-0020`, `T-M3-11`) with `k2-registry-update-threshold-*` & `registry.test.ts` |
| R1-03 | medium | `packages/ts/src/approval/verify.ts` | fixed @ `a237d0e` (`ADR-0021`, `T-M3-12`) with `verify.test.ts` |
| R1-04 | medium | `packages/ts/src/approval/registry.ts`, `verify.ts` | fixed @ `a237d0e` (`ADR-0021`, `T-M3-12`) with `registry.test.ts` & `verify.test.ts` |
| R1-05 | medium | `packages/ts/src/approval/breakglass.ts` | fixed @ `a237d0e` (`ADR-0021`, `T-M3-12`) with `breakglass.test.ts` |
| R1-06 | medium | `packages/ts/test/approval/real-assertion.test.ts` | fixed @ `0c2816f` (`ADR-0018`) with unconditional `k2-real-*` vectors |
| R1-07 | medium | `contracts/spec/k1-audit.md`, `docs/05-threat-model.md` | fixed @ `a237d0e` (`ADR-0021`, `T-M3-12`) documenting external anchor limit |
| R1-08..17 | low | M0–M3 modules | deferred/tracked into M6 hardening (`5fd9845`, `2de253e`) |
| R2-01 | critical | `packages/ts/package.json` (`files` missing `dist/version.*`) | fixed @ `04dcfc0` (`T-M6-05`) with `package.test.ts` packed-import check |
| R2-02 | high | `packages/ts/src/approval/registry.ts`, `contracts/spec/k2-approval.md` | fixed @ `62392eb` (`ADR-0024`, `T-M6-06`) with `registry.test.ts` |
| R2-03 | high | `package.json`, `.github/workflows/ci.yml`, `docs/testing.md` | fixed @ `d2504af` (`build` moved before `typecheck` and `test`) |
| R2-04..08 | medium | `audit/verify.ts`, `approval/registry.ts`, `approval/verify.ts`, tests | fixed @ `5fd9845` (`T-M6-07`) with `verify.test.ts`, `registry.test.ts`, `webauthn.test.ts`, `redact.test.ts` |
| R2-09..13 | low | `core/envelope.ts`, `detect/scan.ts`, `audit/{event,jsonl}.ts`, `rulepack/*`, docs | fixed @ `2de253e` (`ADR-0025`, `T-M6-08`) & `d2504af` (`E2E-3` prune) |
| SEC-01 | medium | `.gitleaksignore` (`09d227b` synthetic fixture, `0c2816f` public `authenticator_data`) | fixed @ `d339a7c` (verified by `security-scan` runs `45720444195` & `45766237355`) |
| SEC-R3-01 | high | `packages/ts/src/detect/redact.ts`, `contracts/spec/k5-detection.md` | fixed @ `bf79814` (`ADR-0026`) with `redact.test.ts` partial-overlap secret tests |
| SEC-R3-02 | high | `scripts/verify-snapshot.sh`, `packages/ts/src/repo-tools/vendor.ts` | fixed @ `bf79814` with `verify-snapshot.test.ts` & `vendor.test.ts` symlink/nested-sums tests |
| SEC-R3-03 | high | `packages/ts/src/repo-tools/snapshot.ts`, `package.test.ts`, `e2e-consumer.test.ts` | fixed @ `bf79814` (`shell: true` removed) with `snapshot.test.ts` space-in-path test |
| SEC-R3-04 | medium | `packages/ts/src/rulepack/asof.ts`, `contracts/spec/k4-rulepack.md` | fixed @ `a5bc9ac` (`ADR-0027`) with `k4-vectors.test.ts` invalid/empty date tests |
| SEC-R3-05 | medium | `packages/ts/src/repo-tools/vendor.ts` | fixed @ `a5bc9ac` with `vendor.test.ts` traversal & malformed `PLINTH_VERSION` tests |
| SEC-R3-06 | medium | `packages/ts/src/audit/lint.ts`, `contracts/spec/k1-audit.md` | fixed @ `a5bc9ac` (`ADR-0027`) with `lint.test.ts` nested `data.prev` PII test |
| SEC-R3-07 | medium | `snapshot.ts`, `vendor.ts`, `verify-snapshot.sh`, `docs/consuming.md` | fixed @ `bf79814`/`a5bc9ac` with `snapshot.test.ts` & `verify-snapshot.test.ts` CRLF pin test |
| SEC-R3-08 | low | `approval/verify.ts`, `core/envelope.ts` | fixed @ `7685414` with `approval/verify.test.ts` & `core/envelope.test.ts` |
| SEC-R3-09 | low | `packages/ts/src/repo-tools/yaml-subset.ts` | fixed @ `7685414` with `k4-vectors.test.ts` non-string YAML key tests |
| SEC-R3-10 | low | `packages/ts/src/core/envelope.ts`, `contracts/spec/k0-core.md` | fixed @ `7685414` (`{zip215: false}`, `ADR-0027`) with `core/envelope.test.ts` identity-key test |
| SEC-R3-11 | low | `audit/verify.ts`, `tools/conformance.ts`, `docs/{03-spec,05-threat-model,06-plan}.md` | fixed @ `bf79814`/`7685414` with `audit/verify.test.ts`, `conformance.test.ts`, `verify-snapshot.test.ts` |

Threat model coverage: all 36 rows (`TM-01`..`TM-36`) in `docs/05-threat-model.md` §3 map to verified tests except `TM-33` (accepted documented limit below) and `TM-09` (accepted residual risk mitigated by subject binding and short TTL, tested by `k2-approval-ttl-too-long`).

---

## 8. Honest limits (`contracts/spec/k2-approval.md` §6 and consumer duties)

Copied from `contracts/spec/k2-approval.md` §6 (consumers MUST copy these into their own threat model):

- Synced passkeys are not device-bound; realms needing "only this phone" MUST set `allow_synced_passkeys: false`.
- Whoever controls the enforcement point (local admin on the PC running the git hook) can skip verification. K2 protects against a compromised server or requester, not a compromised verifier (`TM-33`).
- Solo fallback (hold-to-confirm, typed reason, undo window without a second key) is a UX pattern (`docs/patterns/two-hands-ux.md`), logged as `"assurance": "single-person"`, not K2.

Additional kit boundaries from `docs/05-threat-model.md`:

- **Cross-verifier replay (`TM-09`):** Single-use replay protection relies on the enforcement point's `ConsumedIdStore`; a second verifier with a separate store is bounded only by `subject.digest` and short TTL (`max_ttl_seconds`).
- **Audit tail truncation (`TM-16`):** `verifyChain` detects tail truncation only against an externally anchored checkpoint supplied by the caller.
- **Audit PII (`TM-18`):** `lintPersonalData` is a test-time lint, not runtime enforcement.
- **Detection & handoff quarantine (`TM-22`, `TM-24`):** Rule-based scanning and hidden-character/phrase checks are defence-in-depth heuristics; consumers must quarantine flagged untrusted text.
- **Test keys (`TM-29`):** Consumers must check `isTestKid` in CI/startup to refuse `contracts/test-vectors/keys/` in production registries.

---

## 9. Not checked

- **Live-mode Indian keys and untested providers:** Only Razorpay and Cashfree Test-mode keys were checked in Gate `G-K5`; live keys and `msg91`, `zoho`, `instamojo` rules are untested against real accounts.
- **Fuzzing & external audit:** No long-running fuzzing campaign or third-party human security audit was performed.
- **Other language bindings:** C# (`0.3`) and Kotlin (`0.5`) bindings are not built in Phase 1 (`0.1.0`).
- **Release tag & PR checks:** `development -> main` PR, `v0.1.0` tag snapshot reproducibility check (`T-MR-07`), and GitHub secret scanning / push protection (`T-MR-08`) occur after `T-MR-06`.

---

## 10. Owner sign-off (Gate `G-final`)

- **Approved:** `Owner, 2026-11-26: "Signed off G-final for release 0.1.0"`
