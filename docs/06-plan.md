# Plinth 0.1: plan index

**Status:** Stage 3, v1.0 (2026-10-31). Phase 1 = release **0.1.0** (K0, K1, K2, K4, K5, TypeScript). Task cards: `docs/plan/M*.md`. Executor: Antigravity (one task per session).
Status values: `todo` → `doing` → `done` (only with pasted passing output). The executor updates the Status column.

## 1. Milestones and gates
| Milestone | File | Goal | Ends with |
|---|---|---|---|
| G0 (owner) | `plan/M0-setup.md` | Create the private GitHub repo `plinth` | URL given to the agent |
| M0 Setup | `plan/M0-setup.md` | Repo, hooks, pinned toolchain, contract self-checks, CI | CI green |
| D1 Design | — | **Not applicable**: no UI in Phase 1 (`docs/design/design-brief.md`); gate G1 skipped | — |
| M1 K0 Core | `plan/M1-core.md` | 56 k0 vectors | mutation checks MC-1/2/5 |
| M2 K1 Audit | `plan/M2-audit.md` | 19 k1 vectors (2 lint vectors in M5) | MC-6/7 |
| M3 K2 Approvals | `plan/M3-approvals.md` | 45 k2 vectors + real-authenticator spike | MC-3/4/8/9/10/11 + **review gate R1** |
| M4 K4 Rule packs | `plan/M4-rulepack.md` | 35 k4 vectors, reproducible packs | `packs:check` in CI |
| M5 K5 Detection | `plan/M5-detection.md` | 20 k5 + 2 lint vectors, 70 pack tests, budgets, **owner gate G-K5** | MC-12/13/14 |
| M6 Conformance + package | `plan/M6-package.md` | API lock, `plinth-conformance` PASS 150/150, package | **review gate R2** |
| MR Release | `plan/MR-release.md` | Snapshot, vendoring tools, security review, README, tag, public | **G-merge, G-tag, G-final, G-public** |

**Owner gates (plain English, what Manul does):**
- **G0** before T-M0-01: create the private repo and settings (10 min; steps in `plan/M0-setup.md`).
- **G-spike** in T-M3-08: open a local page, press two buttons, touch the fingerprint (5 min).
- **R1** after M3 and **R2** after M6: paste the review prompt from `docs/testing.md` §8 into Claude, give the answer to the agent (30 min each).
- **G-K5** in T-M5-09: create Razorpay and Cashfree test-mode keys, run one command, paste the masked output, then delete the file and revoke the keys (30 min). Can be deferred (Outcome C).
- **G-merge / G-tag** in T-MR-07: type `now it is time to merge plinth to main`, click merge, create the `v0.1.0` release draft, attach the zip, publish.
- **G-final** = signing off `docs/07-security-review.md` (T-MR-05).
- **G-public** in T-MR-08: make the repo public and switch on the free protections.

## 2. Task table
| ID | Title | M | Depends on | Size | Covers | Status |
|---|---|---|---|---|---|---|
| T-M0-01 | Initialise git, hooks, prove the guard | M0 | G0 | S | NFR-8, TM-32 | done |
| T-M0-02 | Root npm workspace and pinned toolchain | M0 | T-M0-01 | M | NFR-4, NFR-8, TM-28 | done |
| T-M0-03 | Version test and vector loader | M0 | T-M0-02 | S | NFR-8 | done |
| T-M0-04 | Contract self-checks and pins | M0 | T-M0-03 | M | TM-32, TM-28, NFR-4 | done |
| T-M0-05 | CI, security-scan, Dependabot | M0 | T-M0-04 | M | TM-28, TM-30, NFR-8 | done |
| T-M0-06 | Portability guard | M0 | T-M0-03 | S | NFR-1, NFR-12 | done |
| T-M0-07 | Errors module | M0 | T-M0-04 | S | NFR-6 | done |
| T-M0-08 | M0 close | M0 | T-M0-05, T-M0-06, T-M0-07 | S | gate | done |
| T-M1-01 | Red skeleton k0 | M1 | T-M0-08 | S | AC-1.x–4.x harness | done |
| T-M1-02 | bytes.ts | M1 | T-M1-01 | S | TM-04 | done |
| T-M1-03 | Strict JSON parser | M1 | T-M1-02 | M | AC-2.1, AC-2.2, TM-01, TM-31, TM-34 | done |
| T-M1-04 | pk-JCS canonicalize, digest | M1 | T-M1-03 | M | AC-1.1–1.4, AC-2.3, TM-01 | done |
| T-M1-05 | Keys, kid, SPKI, test kids | M1 | T-M1-04 | M | AC-3.1–3.4, TM-29 | done |
| T-M1-06 | Strict DER ↔ P1363 | M1 | T-M1-02 | S | AC-3.5, TM-04 | done |
| T-M1-07 | Signing input, Ed25519 sign | M1 | T-M1-05 | S | AC-4.1, TM-02 | done |
| T-M1-08 | verifyEnvelope Ed25519/ES256 | M1 | T-M1-06, T-M1-07 | M | AC-4.2–4.4, TM-02, TM-03, TM-05, TM-35, NFR-5 | todo |
| T-M1-09 | WebAuthn signature entries | M1 | T-M1-08 | M | AC-5.1, AC-5.2, TM-06 | todo |
| T-M1-10 | UUIDv7, nonce, timestamps | M1 | T-M1-02 | S | AC-9.2 (ids) | todo |
| T-M1-11 | M1 close, MC-1/2/5 | M1 | T-M1-09, T-M1-10 | S | NFR-11 | todo |
| T-M2-01 | Red skeleton k1 | M2 | T-M1-11 | S | AC-6.1, AC-7.x, AC-8.1 harness | todo |
| T-M2-02 | eventHash, appendEvent | M2 | T-M2-01 | M | AC-6.1, AC-6.2 | todo |
| T-M2-03 | JSON Lines export/parse | M2 | T-M2-02 | S | AC-8.2 | todo |
| T-M2-04 | Checkpoints, prune marker | M2 | T-M2-02 | S | AC-7.1, AC-8.1, TM-17 | todo |
| T-M2-05 | verifyChain | M2 | T-M2-04 | M | AC-7.1, AC-7.2, AC-8.1, TM-15, TM-16, TM-17, TM-35, NFR-5 | todo |
| T-M2-06 | M2 close, MC-6/7 | M2 | T-M2-03, T-M2-05 | S | NFR-11 | todo |
| T-M3-01 | Red skeleton k2 | M3 | T-M2-06 | S | AC-9.x–12.x harness | todo |
| T-M3-02 | Requests, matching code, decision payload | M3 | T-M3-01 | S | AC-9.1, AC-9.2, TM-12 | todo |
| T-M3-03 | Registry chain | M3 | T-M3-02 | M | AC-10.1, TM-10, TM-11, TM-35 | todo |
| T-M3-04 | verifyApproval request checks | M3 | T-M3-03 | M | AC-11.2, TM-07, TM-09, TM-14 | todo |
| T-M3-05 | verifyApproval decisions | M3 | T-M3-04, T-M1-09 | M | AC-5.1, AC-5.2, AC-11.1, AC-11.2, TM-03, TM-06, TM-12, TM-13, TM-35 | todo |
| T-M3-06 | Single-use store, verifyAndConsume | M3 | T-M3-05 | S | AC-11.3, TM-08 | todo |
| T-M3-07 | Break-glass codes | M3 | T-M3-03 | S | AC-12.1 | todo |
| T-M3-08 | SPIKE real authenticator | M3 | T-M3-07 | M | AC-5.3, TM-06 | todo |
| T-M3-09 | M3 close, MC-3/4/8–11, R1 | M3 | T-M3-06, T-M3-08 | S | NFR-11 | todo |
| T-M4-01 | Red skeleton k4 | M4 | T-M3-09 | S | AC-13.x, AC-14.1 harness | todo |
| T-M4-02 | selectAsOf, localDate | M4 | T-M4-01 | S | AC-14.1 | todo |
| T-M4-03 | YAML safe subset | M4 | T-M4-01 | M | AC-13.1, TM-26 | todo |
| T-M4-04 | Regex dialect lint | M4 | T-M4-01 | S | AC-13.2, TM-23 | todo |
| T-M4-05 | Schema helper | M4 | T-M4-01 | S | compile step 2 | todo |
| T-M4-06 | compile-packs, builtin.ts | M4 | T-M4-02…05 | M | AC-13.3, NFR-7 | todo |
| T-M4-07 | loadPack, activeRules | M4 | T-M4-06 | S | AC-15.1, TM-25 | todo |
| T-M4-08 | packs:check in CI, M4 close | M4 | T-M4-07 | S | AC-13.3, NFR-7 | todo |
| T-M5-01 | Red skeleton k5 + pack tests | M5 | T-M4-08 | S | AC-16.x, AC-17.x harness | todo |
| T-M5-02 | Validators, entropy, masks | M5 | T-M5-01 | S | AC-17.2 | todo |
| T-M5-03 | Regex scanning | M5 | T-M5-02 | M | AC-16.1, AC-16.3, TM-19, TM-22 | todo |
| T-M5-04 | Hidden-character runs | M5 | T-M5-03 | S | AC-16.2, TM-24 | todo |
| T-M5-05 | Redaction | M5 | T-M5-04 | M | AC-17.1–17.5, TM-19, TM-20, TM-21, NFR-6 | todo |
| T-M5-06 | Compiler runs pack tests | M5 | T-M5-05 | S | AC-13.3 | todo |
| T-M5-07 | lintPersonalData | M5 | T-M5-05 | S | AC-18.1, TM-18 | todo |
| T-M5-08 | detect-file tool | M5 | T-M5-05 | S | AC-21.1, NFR-6, TM-19 | todo |
| T-M5-09 | Owner gate G-K5 | M5 | T-M5-08 | S | AC-21.1, TM-22 | todo |
| T-M5-10 | Performance and ReDoS budgets | M5 | T-M5-05, T-M3-07, T-M2-05 | S | NFR-2, NFR-3, TM-23 | todo |
| T-M5-11 | M5 close, MC-12/13/14 | M5 | T-M5-06, T-M5-07, T-M5-09, T-M5-10 | S | NFR-11 | todo |
| T-M6-01 | API conformance | M6 | T-M5-11 | S | API surface | todo |
| T-M6-02 | plinth-conformance CLI | M6 | T-M6-01 | M | AC-19.1, NFR-10 | todo |
| T-M6-03 | Package exports, files, size | M6 | T-M6-02 | S | NFR-9 | todo |
| T-M6-04 | Library E2E, M6 close, R2 | M6 | T-M6-03 | M | E2E-1…4 | todo |
| T-MR-01 | Snapshot tool | MR | T-M6-04 | M | AC-20.1, TM-27 | todo |
| T-MR-02 | verify-snapshot.sh | MR | T-MR-01 | S | AC-20.2, TM-27 | todo |
| T-MR-03 | Vendor tool | MR | T-MR-02 | M | US-20 | todo |
| T-MR-04 | E2E consumer | MR | T-MR-03 | M | AC-19.1, AC-20.x | todo |
| T-MR-05 | Security review | MR | T-MR-04 | M | all TM, G-final | todo |
| T-MR-06 | README, CHANGELOG, write-up | MR | T-MR-05 | M | testing §11 | todo |
| T-MR-07 | Merge, tag, snapshot, pin | MR | T-MR-06 | S | US-20 | todo |
| T-MR-08 | Going public | MR | T-MR-07 | S | ADR-0014, TM-30 | todo |
**65 tasks** (40 S, 25 M; none larger). One spike (T-M3-08); one owner verification gate with pre-decided outcomes (T-M5-09).

## 3. Dependency order (the order to do them in)
M0: 01 → 02 → 03 → (04, 06) → 05 → 07 → 08. M1: 01 → 02 → (03 → 04 → 05), 06, 10 → 07 → 08 → 09 → 11. M2: 01 → 02 → (03, 04) → 05 → 06. M3: 01 → 02 → 03 → (04 → 05 → 06), 07 → 08 → 09. M4: 01 → (02, 03, 04, 05) → 06 → 07 → 08. M5: 01 → 02 → 03 → 04 → 05 → (06, 07, 08 → 09), 10 → 11. M6: 01 → 02 → 03 → 04. MR: 01 → … → 08. Pick the first `todo` row in §2 whose dependencies are all `done`.

## 4. Rules for the executor (copied from START-HERE.md)
1. Rule 0 in `AGENTS.md` overrides everything.
2. One task per session. Write the task's tests first, run them, show they fail; then make them pass.
3. Run every command in the task's "Run" line and paste the output with the short commit SHA. Never mark a task `done` without that output.
4. Touch only the files the task lists under Create/Modify. Anything else: stop and ask.
5. Never add a dependency that is not in `docs/04-architecture.md` §2. Never change `contracts/` without an ADR and the owner's OK. Never edit `packs/` or `packages/ts/src/packs/builtin.ts` by hand (run the compiler).
6. Never weaken, skip or delete a test to make it pass. Never change an expected value in a vector.
7. Update `docs/status/STATUS.md`, add a `docs/status/LOG.md` entry, and set the task's Status here, in the same commit.

## 5. Later phases (outline, to be expanded before building)
| Release | Goal | Scope | Depends on |
|---|---|---|---|
| 0.2 | Evidence and India data | K3 bundle + `pk-verify` CLI + static verify page (Cloudflare Pages, own design brief); K6 regulations, retention, timesync packs; maintainer Ed25519 key ceremony and signed snapshots | First consumer: Toolmark P1 / Muster P1 |
| 0.3 | C# binding | K0, K1, K3, K4 validator, K5 validators, K2 verify; .NET 10, BouncyCastle Ed25519; must pass all runtime vectors | First desktop project (LeakSweep / TriageKit / AuthSunset) |
| 0.4 | Windows approvals, K6 clocks | K2 `windows-tpm` profile, WebAuthn-on-Windows spike result, CERT-In clock and control catalogue | GPO Ledger P2 / AuthSunset P2 / Hearth H4 |
| 0.5 | Kotlin binding | Pure-JVM K0, K1, K3, K4, K5; K2 `android-keystore` signing and verify | First Android project (Pagerline / Racklane / Hearth H3) |
| 0.6 | Webhooks | K7 Standard Webhooks + `pk.handoff.incident` | Hearth H4 → Pagerline or Rounds |
| 1.0 | Freeze | Specs frozen after two shipped consumers per component | — |

## 6. Owner questions

**Owner decisions (2026-10-31, Manul): all accepted as recommended.** LICENSE holder "Manul Shrivastava"; no security contact until public; no npm publishing in 0.x; commit real-passkey test vectors (public keys and signatures only).

1. **Copyright line in LICENSE.** It currently reads `Copyright (c) 2026 Manul Shrivastava`. Options: (a) keep "Manul"; (b) replace with your full legal name. **My recommendation: (b), because an MIT notice should name the legal copyright holder, and changing it after the repo is public leaves the old name in history.** The agent changes it in T-M0-01 if you answer (b) before then.
2. **Security contact before the repo is public.** Options: (a) none until public (GitHub private vulnerability reporting from then on); (b) a dedicated e-mail address now. **My recommendation: (a), because the repo is private until 0.1.0 is tested, so nobody outside can report anything; this avoids exposing an address.**
3. **Publish `plinth-kit` to npmjs.com after going public?** Options: (a) not in 0.x — consumers keep vendoring hash-pinned snapshots; (b) publish 0.1.0 when public (needs an npm account with 2FA). **My recommendation: (a), because the programme decision is hash-pinned snapshots, every consumer is your own repo, and an npm account is one more credential to protect; revisit at 0.2.**
4. **Real-authenticator vectors (spike T-M3-08 Outcome A).** Options: (a) commit your Windows Hello / phone assertion as public vectors (they contain only a public key and a signature over a test payload); (b) keep them local only. **My recommendation: (a), because real-device vectors make the C# and Kotlin bindings prove they handle real authenticators, and they reveal nothing secret.**

## 7. Coverage matrix
**Acceptance criteria → task → test**
| AC | Task | Test (file :: name) |
|---|---|---|
| AC-1.1, AC-1.2, AC-1.3, AC-1.4 | T-M1-03, T-M1-04 | `test/core/k0-vectors.test.ts` :: `k0-jcs-*` |
| AC-2.1, AC-2.2 | T-M1-03 | `k0-vectors.test.ts` :: `k0-jcs-err-*`, `k0-jcs-depth-64-ok`; `test/core/json.test.ts` :: `rejects` |
| AC-2.3 | T-M1-04 | `test/core/jcs.test.ts` |
| AC-3.1, AC-3.2 | T-M1-05 | `k0-vectors.test.ts` :: `k0-kid-*` |
| AC-3.3 | T-M1-05 | `test/core/keys.test.ts` :: `k2-jwk-from-spki*` |
| AC-3.4 | T-M1-05 | `keys.test.ts` :: `isTestKid recognises all five` |
| AC-3.5 | T-M1-06 | `k0-vectors.test.ts` :: `k0-der-*`; `test/core/der.test.ts` |
| AC-4.1 | T-M1-07 | `k0-vectors.test.ts` :: `k0-sig-sign-ed25519`, `k0-sig-signing-input` |
| AC-4.2, AC-4.3 | T-M1-08 | `k0-vectors.test.ts` :: `k0-env-*` |
| AC-4.4 | T-M1-08 | `test/core/envelope.test.ts` :: `verifyEnvelope never throws` |
| AC-5.1, AC-5.2 | T-M1-09, T-M3-05 | `test/core/webauthn.test.ts`; `test/approval/k2-vectors.test.ts` :: `k2-approval-wrong-*`, `-uv-off`, `-up-off`, `-cross-origin` |
| AC-5.3 | T-M3-08 | `test/approval/real-assertion.test.ts` |
| AC-6.1 | T-M2-02 | `test/audit/k1-vectors.test.ts` :: `k1-event-hash`, `k1-genesis-prev`; `test/audit/event.test.ts` |
| AC-6.2 | T-M2-02 | `event.test.ts` |
| AC-7.1, AC-7.2 | T-M2-05 | `k1-vectors.test.ts` :: `k1-chain-valid-*`, `k1-chain-tamper-*`, `k1-chain-wrong-*` |
| AC-8.1 | T-M2-04, T-M2-05 | `k1-vectors.test.ts` :: `k1-chain-pruned-*`; `test/audit/checkpoint.test.ts` |
| AC-8.2 | T-M2-03 | `test/audit/jsonl.test.ts` |
| AC-9.1 | T-M3-02 | `k2-vectors.test.ts` :: `k2-matching-code*` |
| AC-9.2 | T-M3-02, T-M1-10 | `test/approval/request.test.ts`; `test/core/ids.test.ts` |
| AC-10.1 | T-M3-03 | `k2-vectors.test.ts` :: `k2-registry-*` |
| AC-11.1, AC-11.2 | T-M3-04, T-M3-05 | `k2-vectors.test.ts` :: `k2-approval-*` (31) |
| AC-11.3 | T-M3-06 | `test/approval/store.test.ts` |
| AC-12.1 | T-M3-07 | `k2-vectors.test.ts` :: `k2-break-glass-*`; `test/approval/breakglass.test.ts` |
| AC-13.1 | T-M4-03 | `test/rulepack/k4-vectors.test.ts` :: `k4-yaml-*` |
| AC-13.2 | T-M4-04 | `k4-vectors.test.ts` :: `k4-regex-*` |
| AC-13.3 | T-M4-06, T-M4-08, T-M5-06 | `k4-vectors.test.ts` :: `k4-pack-digests-*`; `test/repo-tools/packs-check.test.ts`; `test/repo-tools/compile-tests.test.ts` |
| AC-14.1 | T-M4-02 | `k4-vectors.test.ts` :: `k4-asof-*`, `k4-local-date-*` |
| AC-15.1 | T-M4-07 | `test/rulepack/load.test.ts` |
| AC-16.1 | T-M5-03, T-M5-04 | `test/detect/pack-tests.test.ts` :: `every pack test passes` (70) |
| AC-16.2 | T-M5-04 | `test/detect/k5-vectors.test.ts` :: `k5-scan-hidden-and-phrases` |
| AC-16.3 | T-M5-03 | `k5-vectors.test.ts` :: `k5-scan-no-secret-no-fingerprint`, `k5-scan-git-sha-not-instamojo`, `k5-scan-err-too-large` |
| AC-17.1–17.4 | T-M5-05 | `k5-vectors.test.ts` :: `k5-redact-*` |
| AC-17.5 | T-M5-05 | `test/detect/redact.test.ts` :: `findings never echo the secret` |
| AC-18.1 | T-M5-07 | `test/audit/lint.test.ts` :: `k1-lint-*` |
| AC-19.1 | T-M6-02, T-MR-04 | `test/tools/conformance.test.ts`; `test/repo-tools/e2e-consumer.test.ts` |
| AC-20.1 | T-MR-01 | `test/repo-tools/snapshot.test.ts` |
| AC-20.2 | T-MR-02 | `test/repo-tools/verify-snapshot.test.ts` |
| AC-21.1 | T-M5-08, T-M5-09 | `test/repo-tools/detect-file.test.ts`; gate G-K5 record in LOG |

**Threat mitigations → task → test:** every row TM-01 … TM-35 in `docs/05-threat-model.md` §3 lists its verifying test and task; all 35 map to tasks in §2 above except TM-33 (accepted, documented limit) and TM-09 (accepted residual, tested by the TTL vector in T-M3-04).

**NFRs → task → check**
| NFR | Task | Check |
|---|---|---|
| NFR-1 | T-M0-06 | `test/portability.test.ts` |
| NFR-2 | T-M5-10 | `test/perf/budgets.perf.ts` |
| NFR-3 | T-M5-10 | `budgets.perf.ts` :: `no rule exceeds 100 ms on adversarial input` |
| NFR-4 | T-M0-02, T-M0-04 | `test/deps.test.ts` |
| NFR-5 | T-M1-08, T-M2-05, T-M3-03, T-M3-05 | `envelope.test.ts`, `verify.test.ts` (audit, approval), `registry.test.ts` "never throws" |
| NFR-6 | T-M5-05, T-M5-08, T-M0-07 | `redact.test.ts`, `detect-file.test.ts`, `errors.test.ts` |
| NFR-7 | T-M4-06, T-M4-08 | `packs:check`, vectors |
| NFR-8 | T-M0-01, T-M0-02, T-M0-05 | START-HERE setup check, CI |
| NFR-9 | T-M6-03 | `test/package.test.ts` :: `unpacked size within budget` |
| NFR-10 | T-M6-02 | conformance CLI output review in task |
| NFR-11 | T-M1-11, T-M2-06, T-M3-09, T-M5-11 | mutation-check entries in `docs/status/LOG.md` |
| NFR-12 | T-M0-06 | `portability.test.ts` |

## 8. Stage 3 quality checklist (STAGE3-STANDARD §10), run 2026-10-31 by Claude
- [x] **No TBD, TODO, "etc." or vague verbs in Phase 1 docs.** Searched `docs/03-spec.md`, `04`, `05`, `06`, `plan/*.md`, `testing.md`, `START-HERE.md`, `contracts/spec/*.md` for `TBD`, `TODO`, `etc.`, `as needed`, `appropriate`, `e.g.`: none in Phase 1 content (copied history in `docs/01-research.md` keeps its original wording and is labelled as history).
- [x] **Every dependency pinned with check date and licence:** `docs/04-architecture.md` §2 (13 packages/tools + 2 images, all checked 2026-10-31 with `npm view` or the GitHub releases API).
- [x] **Every AC, TM mitigation and NFR maps to a task and a test:** §7.
- [x] **Every task card has all mandatory fields; none larger than M:** 65 cards, 40 S / 25 M. Gate-only tasks (T-M0-01, T-M5-09, T-MR-07, T-MR-08) use command outputs or recorded outcomes as their "tests".
- [x] **Every UNVERIFIED Phase 1 fact is verified or a spike with both outcomes:** verified today: package versions/licences/dates, noble API (`ed25519`, `p256` from `nist.js`, `lowS` default rejects high-S, DER `format`), TS 7 build + `.d.ts`, Vitest 5 + `.js` imports, Biome 2.5.15, Ajv `Ajv2020` named import, `yaml` node API, safe-regex2 behaviour, gitleaks rule regexes and licence, gitleaks/osv-scanner/actions versions, RFC 8032/6979 test values, Verhoeff and GSTIN examples, `verify-snapshot.sh` on Git Bash. Spike T-M3-08 (real authenticator, outcomes A/B + phone fallback). Gate T-M5-09 (Indian key formats, outcomes A/B/C). Indian PII structures stay labelled `unverified` in rule data (redaction applies them; no product logic depends on them being verified).
- [x] **`contracts/` exists and is referenced by tasks:** specs, API, 17 schemas, errors, 177 vectors; every M1–M5 card's "Read first" names a spec section.
- [x] **Design brief has exact tokens and per-screen prompts:** not applicable — no UI in Phase 1; one-line design brief states this (as instructed for a no-K3 release).
- [x] **START-HERE setup steps complete for a freshly formatted Windows PC:** Git for Windows, Node 24.16.0 (with npm 11.13.0), clone, hooks, `npm ci`, verification commands with expected output.
- [x] **The repo works with no reference to anything outside it:** India-pack rules copied into `03-spec.md` §9; platform-kit design copied into `01-research.md`; programme decisions in `02-brainstorm.md`; no absolute local paths in repo docs (`docs/01-research.md` names the portfolio file only as a source citation).
- [x] **Open owner questions listed with options and recommendations:** §6 (4 questions).
