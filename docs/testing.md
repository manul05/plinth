# Plinth 0.1: testing

**Status:** Stage 3, v1.0 (2026-10-31).

## 1. Pyramid and tools (versions: `docs/04-architecture.md` §2)
| Layer | What | Tool | Where |
|---|---|---|---|
| Contract tests | Every schema compiles; every vector validates; `index.json` hashes; errors list; API surface | Vitest 5.0.5 + Ajv 8.20.0 | `packages/ts/test/contracts.test.ts`, `test/api-conformance.test.ts` |
| Golden vectors | 177 vectors driven by op (150 runtime, 27 tool) | Vitest | `test/core/k0-vectors.test.ts`, `test/audit/k1-vectors.test.ts`, `test/approval/k2-vectors.test.ts`, `test/rulepack/k4-vectors.test.ts`, `test/detect/k5-vectors.test.ts` |
| Unit tests | Behaviour not covered by vectors (never-throws, round trips, CLI output, concurrency) | Vitest | `test/<module>/*.test.ts` |
| Pack tests | 70 `match` / `no_match` tests from the four packs | Vitest + compiler | `test/detect/pack-tests.test.ts` |
| Integration (E2E for a library) | Build → pack → snapshot → vendor into a scratch consumer → install tarball → import → conformance | Vitest spawning `npm`/`sh` | `test/repo-tools/e2e-consumer.test.ts` (T-MR-04) |
| Performance | NFR-2, NFR-3 | Vitest, separate config | `test/perf/*.perf.ts`, `npm run test:perf` |
| Static | Types, lint, format, doc sizes | `tsc` 7.0.2, Biome 2.5.15, `scripts/check-doc-sizes.sh` | CI fast job |
| Security scans | Secrets in history, vulnerable deps | gitleaks v8.30.1, osv-scanner v2.7.0 | `security-scan.yml` |

**Coverage:** no percentage target (conventions §13). Instead: 100 % of vectors, every AC mapped in `06-plan.md` §8, and the mutation checks in §6.

## 2. Commands (all from the repo root)
| Command | Does | Expected on success |
|---|---|---|
| `npm ci` | install exact lockfile | `added N packages` and no `ERR!` |
| `npm run typecheck` | `tsc -p packages/ts/tsconfig.json --noEmit` and `tsc -p packages/ts/tsconfig.test.json --noEmit` | no output, exit 0 |
| `npm run lint` | `biome check .` | `Checked N files … No fixes applied.` exit 0 |
| `npm test` | `vitest run` (main config) | `Test Files  N passed`, exit 0 |
| `npm run test:perf` | `vitest run --config vitest.perf.config.ts` | all perf tests pass |
| `npm run build` | `tsc -p packages/ts/tsconfig.json` → `packages/ts/dist/` | exit 0 |
| `npm run packs:build` / `npm run packs:check` | compile packs / check no drift | `packs: 4 compiled, 35 rules, 70 tests passed` / `packs: up to date` |
| `npm run conformance` | `node packages/ts/dist/tools/conformance.js contracts/test-vectors` (after build) | `PASS 150/150` |
| `npm run check` | typecheck + lint + test + build + packs:check + conformance (full local check before a PR) | every step exit 0 |

## 3. Fixtures and the real-data plan
- **Synthetic only in the repo.** Keys: RFC 8032 / RFC 6979 test keys and two hash-derived P-256 keys, all `TEST-ONLY`. Secrets: generated from SHA-256 labels, stored split. PII: synthetic Aadhaar-like `2949 1013 6515` (valid Verhoeff, not a known number), PAN `ABCPE1234F`, mobile `+91 98765 43210`, names Priya/Ramesh/Ravi. See `contracts/test-vectors/README.md`.
- **Real data, outside the repo:**
  1. *Real authenticator* (spike T-M3-08): the owner's Windows Hello and phone passkey sign a TEST payload on `http://localhost:8787`; the resulting assertion contains no secret (public key, signature) and may be committed as a vector if the spike card says so.
  2. *Real Indian test-mode keys* (gate G-K5, T-M5-09): created by the owner in Razorpay and Cashfree **test mode**, kept in a file outside the repo, scanned with `detect-file`; only rule ids and masked previews are pasted.
  3. *Real consumer:* Passdown's own handoffs, after Passdown vendors 0.1 (its plan).
- Public demos use the synthetic vectors only.

## 4. End-to-end scenarios (library) → ACs
| Scenario | Steps | ACs |
|---|---|---|
| E2E-1 Sign, verify, tamper | sign Ed25519 envelope → verify → flip payload → `PK_SIG_INVALID` | AC-4.1–4.3 |
| E2E-2 Passkey approval round trip | build request → challenge → (synthetic) assertion → decision → `verifyAndConsume` valid → again → replayed | AC-5.1, AC-9.1, AC-11.1, AC-11.3 |
| E2E-3 Audit lifecycle | append 5 → checkpoint → export/parse → verify → prune → verify | AC-6.1, AC-7.1, AC-8.1, AC-8.2 |
| E2E-4 Redact a handoff | load 4 builtin packs → redact mixed text → placeholders, counts | AC-15.1, AC-17.1–17.3 |
| E2E-5 Consumer vendoring | snapshot → vendor into temp consumer → `npm install` tarball → `import { digest } from 'plinth-kit/core'` works → `verify-snapshot.sh` OK → conformance PASS 150/150 | AC-19.1, AC-20.1, AC-20.2 |
E2E-1…4 live in `test/e2e/library.test.ts` (T-M6-04); E2E-5 in `test/repo-tools/e2e-consumer.test.ts` (T-MR-04).

## 5. Security tests → threats
Every TM row in `docs/05-threat-model.md` §3 names its test and task. Negative vectors cover: forged (flipped sig/payload), wrong type, wrong kid, unknown alg, alg not allowed, expired, not yet valid, replayed, wrong subject (wrong SHA), wrong origin/rpId, UV/UP off, self-approval, rollback, unauthorised registry change, break-glass reuse, tampered chain (8 kinds), tampered pack, tampered snapshot.

## 6. Mutation checks (NFR-11) — do each, watch a named test fail, restore, log in `docs/status/LOG.md`
| # | Protection (file :: what to break) | Test that must fail | Task |
|---|---|---|---|
| MC-1 | `core/envelope.ts` :: skip the type-allowlist check | `k0-env-err-type-not-allowed` | T-M1-11 |
| MC-2 | `core/envelope.ts` :: build PAE without the type string | `k0-env-err-wrong-type` | T-M1-11 |
| MC-3 | `core/webauthn.ts` :: skip the UV flag check | `k2-approval-uv-off` | T-M3-09 |
| MC-4 | `core/webauthn.ts` :: skip the origin check | `k2-approval-wrong-origin` | T-M3-09 |
| MC-5 | `core/jcs.ts` :: sort keys with `localeCompare` | `k0-jcs-utf16-order` | T-M1-11 |
| MC-6 | `audit/verify.ts` :: skip the prev-link check | `k1-chain-tamper-edit-rehash` | T-M2-06 |
| MC-7 | `audit/verify.ts` :: skip checkpoint head comparison | `k1-chain-tamper-full-rewrite` | T-M2-06 |
| MC-8 | `approval/verify.ts` :: skip the subject digest comparison | `k2-approval-subject-mismatch` | T-M3-09 |
| MC-9 | `approval/verify.ts` :: skip the consumed-id check | `k2-approval-replayed` | T-M3-09 |
| MC-10 | `approval/registry.ts` :: verify update with the new registry's keys | `k2-registry-update-unauthorised` | T-M3-09 |
| MC-11 | `approval/verify.ts` :: ignore the BE flag | `k2-approval-synced-passkey-refused` | T-M3-09 |
| MC-12 | `detect/redact.ts` :: add a fingerprint to PII placeholders | `k5-redact-aadhaar-no-fingerprint` | T-M5-11 |
| MC-13 | `detect/scan.ts` :: drop the pair check | `pk.secrets.india` pack test `key_secret no key ID nearby` | T-M5-11 |
| MC-14 | `rulepack/load.ts` :: skip the digest check | `load.test.ts::tampered rules file is refused` | T-M5-11 |

## 7. CI (free-minutes budget, conventions §12)
`.github/workflows/ci.yml` (written in T-M0-05):
- **fast** (push to `development`, docs-only changes ignored; ubuntu-latest; timeout 10 min): `npm ci` → `npm run lint` → `npm run build` → `npm run typecheck` → `npm test` → `npm run packs:check` → `npm run conformance` → `sh scripts/check-doc-sizes.sh`. Expected ≈ 2 min.
- **full** (PR into `main` and manual; timeout 15 min): fast steps + `npm run test:perf` + `npm pack --dry-run --json` size check (in T-M6-03 test) + E2E consumer test. Expected ≈ 6 min.
- `security-scan.yml` on PRs into `main` and manual. `main-alarm.yml` from the skeleton.
- Budget: ≈ 116 min/month while private (04-architecture §9); 0 after going public.

## 8. Strong-model review gates (R1 after M3, R2 after M6)
Owner pastes into Claude (or the strongest model available) in a fresh session with the repo attached:
> You are reviewing the Plinth repository as an independent security reviewer. Read contracts/spec/*.md, docs/03-spec.md, docs/05-threat-model.md and docs/06-plan.md §8 (coverage matrix). Then read the code under packages/ts/src and the tests under packages/ts/test for milestones up to <M3|M6>. For every AC and TM in scope, check that the code implements the spec order exactly and that the named test really exercises it. List findings as: ID, severity (critical/high/medium/low), file, what is wrong, how to fix. Do not trust STATUS.md or LOG.md claims; run `npm run check` yourself and paste the result lines.
Record the result (date, model, findings count by severity, decision) in `docs/status/LOG.md`. Critical/high findings become fix tasks before the next milestone.

## 9. Release checklist (T-MR-07)
1. `npm run check` green on `development` HEAD; result lines pasted with SHA.
2. CI `fast` and `full`, and `security-scan`, green on the PR head SHA.
3. `CHANGELOG.md` has `## [0.1.0] - <date>`; `packages/ts/package.json` version `0.1.0`; `PLINTH_VERSION` `0.1.0`.
4. `docs/07-security-review.md` complete and owner sign-off quoted.
5. R2 review recorded; no open critical/high findings.
6. Owner merge phrase quoted in the PR; owner merged; owner created tag `v0.1.0` on the merge commit.
7. Snapshot built from the tag in a clean worktree; `SHA256SUMS` digest and tarball SHA-256 recorded in `docs/releases.md`.
8. Snapshot attached to the GitHub Release by the owner (drag the zip made in T-MR-07 step 6) with its SHA-256 in the notes.

## 10. Demo video script (≤ 3 minutes, owner records; real commands, synthetic data)
1. (0:00–0:20) "Plinth is the shared trust layer under my portfolio: one set of rules for hashing, signing, audit logs, approvals and redaction, proven by 177 golden test files." Show `contracts/test-vectors/` tree.
2. (0:20–0:50) Terminal: `npm run conformance` → `PASS 150/150`. Edit a copy of one vector's expected digest → `FAIL k0-jcs-sort-basic …`.
3. (0:50–1:30) Redaction: run `node packages/ts/dist/repo-tools/detect-file.js demo/handoff.txt` on a synthetic handoff containing a split-joined GitHub token, an Aadhaar-like number and a zero-width character → show masked lines; then show `redact` output with `[REDACTED:github_pat:…6591]` and `[REDACTED:aadhaar]` (no fingerprint).
4. (1:30–2:20) Approvals: open the spike page, approve with Windows Hello (fingerprint), show `valid: true`; replay → `PK_APPROVAL_REPLAYED`; change the commit SHA → `PK_APPROVAL_SUBJECT_MISMATCH`.
5. (2:20–2:50) Audit: edit one event in an export → `PK_AUDIT_HASH_MISMATCH at 2`.
6. (2:50–3:00) "Passdown vendors this exact snapshot, pinned by hash. MIT, public." Show `plinth.pin`.
(`demo/handoff.txt` is created during recording from `text_parts` of k5 vectors; it is not committed.)

## 11. README completion checklist (T-MR-06)
One-sentence purpose; CI badge; licence MIT; status "0.1.0 released"; demo video link; "What it does" (5 bullets: K0, K1, K2, K4, K5); "What it is not"; install for consumers (vendoring, link to `docs/consuming.md`); run locally (`npm ci`, `npm run check`); architecture diagram link; security section with threat model, security review and honest limits (synced passkeys, compromised enforcement point, heuristic detection); "How I built this with AI" link; tech stack table; licence and `NOTICE` (gitleaks attribution).
