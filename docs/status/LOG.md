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

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Real authenticator WebAuthn spike (T-M3-08)

- **Did:** Added `webauthn-capture-server.ts`, `webauthn-capture.html`, and `real-assertion.test.ts`; captured 2 real assertions in `spike-output/` (git-ignored) and marked `T-M3-08` `done` in `docs/06-plan.md`.
- **Outcome A:** Both assertions verified! `assertion-1.json` (Windows Hello PIN): flags `0x5` (`UP+UV`, `BE=false`, `BS=false`), `clientDataJSON` has `type/challenge/origin/crossOrigin:false` (no `topOrigin`), low-S. `assertion-2.json` (Google Password Manager phone PIN): flags `0x1d` (`UP+UV+BE+BS`), same `clientDataJSON` keys (no `topOrigin`), **high-S (`s > n/2`)** — proving `{ lowS: false }` in `webauthn.ts` on real hardware/passkey output.
- **Verified:** `npm.cmd run check` (`lint` `Checked 67 files` 0, `typecheck` 0, `vitest` `29 files / 207 tests` incl. `real-assertion` `2/2`, `build` 0) @ `3e6a841` + T-M3-08.
- **Owner:** G-spike completed in Chrome (`assertion-1.json` & `assertion-2.json`, 2026-11-25).
- **Next:** `T-M3-09` (mutation checks `MC-3/4/8/9/10/11`, `DNB-003`, review gate **R1**).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · One-time break-glass recovery codes (T-M3-07)

- **Did:** Implemented `newBreakGlassCode`, `breakGlassDigest`, and `verifyBreakGlass` in `packages/ts/src/approval/breakglass.ts`; created `packages/ts/test/approval/breakglass.test.ts` (failing `3/3` red first); marked `T-M3-07` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd run check` (`lint` `Checked 62 files` 0, `typecheck` 0, `vitest` `28 files / 205 tests` incl. `k2` `45/45`, `build` 0) @ `149af4e` + T-M3-07.
- **Decisions:** None.
- **Owner:** `"execute T-M3-02 to T-M3-09 one by one"` (2026-11-25).
- **AI:** All 45 `k2` vectors and full repo check suite green.
- **Next:** `T-M3-08` (real-authenticator spike, owner gate **G-spike**).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Single-use approvals with atomic store (T-M3-06)

- **Did:** Implemented `MemoryConsumedIdStore` and `verifyAndConsume` in `packages/ts/src/approval/store.ts`; created `packages/ts/test/approval/store.test.ts` (failing `3/3` red first); marked `T-M3-06` `done` in `docs/06-plan.md`.
- **Verified:** `store` `3/3`, `portability` `5/5`, `lint` `Checked 61 files` (0), `typecheck` 0, `build` 0 @ `c129d23` + T-M3-06.
- **Decisions:** None.
- **Owner:** `"execute T-M3-02 to T-M3-09 one by one"` (2026-11-25).
- **AI:** Clean TDD pass including concurrent `Promise.all` single-admission check.
- **Next:** `T-M3-07` (`packages/ts/src/approval/breakglass.ts`: `newBreakGlassCode`, `breakGlassDigest`, `verifyBreakGlass`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Verify signed decisions and distinct approvers (T-M3-05)

- **Did:** Implemented `verifyApproval` steps 12–15 (`verifyDecision`) in `packages/ts/src/approval/verify.ts`; created `packages/ts/test/approval/verify.test.ts` (red `verifyApproval` vector test first); marked `T-M3-05` `done` in `docs/06-plan.md`.
- **Verified:** `verify` `5/5` (`31/31` `verifyApproval` vectors), `k2` (`4 failed | 41 passed (45)`), `portability` `5/5`, `lint` `Checked 60 files` (0), `typecheck` 0, `build` 0 @ `a8cd30c` + T-M3-05.
- **Decisions:** None.
- **Owner:** `"execute T-M3-02 to T-M3-09 one by one"` (2026-11-25).
- **AI:** All 31 `verifyApproval` vectors passed on first try.
- **Next:** `T-M3-06` (`packages/ts/src/approval/store.ts`: `MemoryConsumedIdStore` and `verifyAndConsume`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Request-side approval checks (T-M3-04)

- **Did:** Implemented `verifyApproval` steps 1–11 in `packages/ts/src/approval/verify.ts` with guarded decision placeholder; marked `T-M3-04` `done` in `docs/06-plan.md`.
- **Verified:** `k2` (`25 failed | 20 passed (45)`, all 10 request-side `verifyApproval` vectors passing), `portability` `5/5`, `lint` `Checked 59 files` (0), `typecheck` 0, `build` 0 @ `854434f` + T-M3-04.
- **Decisions:** None.
- **Owner:** `"execute T-M3-02 to T-M3-09 one by one"` (2026-11-25).
- **AI:** All 10 request-side vectors passed on first try.
- **Next:** `T-M3-05` (`packages/ts/src/approval/verify.ts`: decision verification steps 12–15 + `verify.test.ts`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Approver registry chain with anti-rollback (T-M3-03)

- **Did:** Implemented `trustedKeysFromRegistry` and `verifyRegistryChain` in `packages/ts/src/approval/registry.ts`; created `packages/ts/test/approval/registry.test.ts` (failing `4/4` red first); marked `T-M3-03` `done` in `docs/06-plan.md`.
- **Verified:** `registry` `4/4`, `k2` (`35 failed | 10 passed (45)`, `verifyRegistryChain` `6/6`), `portability` `5/5`, `lint` `Checked 59 files` (0), `typecheck` 0, `build` 0 @ `06bf330` + T-M3-03.
- **Decisions:** None.
- **Owner:** `"execute T-M3-02 to T-M3-09 one by one"` (2026-11-25).
- **AI:** Fixed 3 Biome lint/format suggestions in `registry.test.ts` and re-verified cleanly.
- **Next:** `T-M3-04` (`packages/ts/src/approval/verify.ts`: request-side checks steps 1–11).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Requests, matching codes and decision payloads (T-M3-02)

- **Did:** Implemented `createApprovalRequest`, `matchingCode`, and `decisionPayload` in `packages/ts/src/approval/request.ts`; created `packages/ts/test/approval/request.test.ts` (failing `4/4` red first); marked `T-M3-02` `done` in `docs/06-plan.md`.
- **Verified:** `request` `4/4`, `k2` (`41 failed | 4 passed (45)`, `matchingCode` `2/2`), `portability` `5/5`, `lint` `Checked 58 files` (0), `typecheck` 0, `build` 0 @ `f4b9743` + T-M3-02.
- **Decisions:** None.
- **Owner:** `"execute T-M3-02 to T-M3-09 one by one"` (2026-11-25).
- **AI:** Clean TDD pass on first try.
- **Next:** `T-M3-03` (`packages/ts/src/approval/registry.ts`: `verifyRegistryChain` and `trustedKeysFromRegistry`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Red skeleton k2 vector runner (T-M3-01)

- **Did:** Created `packages/ts/src/approval/{index,policies,request,registry,verify,store,breakglass}.ts` (final `policies.ts`, `CHECKPOINT_POLICY` re-export, remaining K2 API stubs), wired `packages/ts/src/index.ts`, added `packages/ts/test/approval/k2-vectors.test.ts` (45 vectors), and marked `T-M3-01` `done` in `docs/06-plan.md`.
- **Verified:** `npm.cmd test -- k2` (`43 failed | 2 passed (45)`, `jwkFromP256Spki` passing), `portability` `5/5`, `typecheck` 0, `lint` `Checked 57 files` (0 errors), `build` 0 @ `d20c53e` + T-M3-01.
- **Decisions:** None.
- **Owner:** `"start T-M3-01 (reading STATUS.md and M3-approval.md)"` (2026-11-25).
- **AI:** Clean red skeleton; note `docs/plan/M3-approvals.md` (plural) vs `M3-approval.md` in prompt.
- **Next:** `T-M3-02` (`packages/ts/src/approval/request.ts`: `createApprovalRequest`, `matchingCode`, `decisionPayload`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · M2 close & mutation checks (T-M2-06)

- **Done:** Closed M2 K1 Audit Log. Marked `T-M2-06` `done` in `docs/06-plan.md`.
- **Mutations (`npm.cmd test -- k1`):** MC-6 (`verify.ts` B.6 prev-link skipped) failed `k1-chain-tamper-edit-rehash` and `k1-chain-bad-genesis-prev` (`2 failed | 17 passed`); MC-7 (`verify.ts` C.4 checkpoint `head` check skipped) failed `k1-chain-tamper-full-rewrite` (`1 failed | 18 passed`). Both restored cleanly.
- **Checks:** `npm.cmd run check` passed cleanly after restoration (`lint` 49 files, `typecheck` 0, `vitest` `22 files / 143 tests`, `build` 0).
- **Next:** `T-M3-01` (M3 K2 Approvals: red skeleton k2).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Fail-closed chain verification (T-M2-05)

- **Done:** Implemented `verifyChain` (normative steps A–E, never throws) in `packages/ts/src/audit/verify.ts` and added unit tests in `packages/ts/test/audit/verify.test.ts` (red `2/2` before implementation). Marked `T-M2-05` `done` in `docs/06-plan.md`.
- **Checks:** `verify` `2/2`, `k1` `19/19` (all 19 K1 vectors excluding `lintPersonalData`), `portability` `5/5`, `typecheck` `0`, `lint` `49 files / 0 errors`, `build` `0`.
- **Next:** `T-M2-06` (M2 close: mutation checks `MC-6`, `MC-7`, and full `npm.cmd run check`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Signed checkpoints and prune marker (T-M2-04)

- **Done:** Implemented `createCheckpoint` and `prunedEventDraft` in `packages/ts/src/audit/checkpoint.ts`, with unit tests in `packages/ts/test/audit/checkpoint.test.ts` (red `2/2` before implementation). Marked `T-M2-04` `done` in `docs/06-plan.md`.
- **Checks:** `checkpoint` `2/2`, `portability` `5/5`, `typecheck` `0`, `lint` `48 files / 0 errors`, `build` `0`.
- **Next:** `T-M2-05` (`packages/ts/src/audit/verify.ts`: `verifyChain` with checkpoints).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · JSON Lines export and strict parse (T-M2-03)

- **Done:** Implemented `serializeExport` and `parseExport` (with 1-based line detail on syntax/shape errors) in `packages/ts/src/audit/jsonl.ts`, with unit tests in `packages/ts/test/audit/jsonl.test.ts` (red `2/2` before implementation). Marked `T-M2-03` `done` in `docs/06-plan.md`.
- **Checks:** `jsonl` `2/2`, `portability` `5/5`, `typecheck` `0`, `lint` `47 files / 0 errors`, `build` `0`.
- **Next:** `T-M2-04` (`packages/ts/src/audit/checkpoint.ts`: `createCheckpoint`, `prunedEventDraft`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Hash-chained event append (T-M2-02)

- **Done:** Implemented `eventHash` and `appendEvent` (with strict `assertEventShape` and `pk.*` reserved-action check) in `packages/ts/src/audit/event.ts`, with unit tests in `packages/ts/test/audit/event.test.ts` (red `4/4` before implementation). Marked `T-M2-02` `done` in `docs/06-plan.md`.
- **Checks:** `event` `4/4`, `k1 eventHash` `1/1`, `portability` `5/5`, `typecheck` `0`, `lint` `46 files / 0 errors`, `build` `0`.
- **Next:** `T-M2-03` (`packages/ts/src/audit/jsonl.ts`: JSON Lines `serializeExport`, `parseExport`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Red skeleton k1 vector runner (T-M2-01)

- **Done:** Created M2 audit stubs (`packages/ts/src/audit/{index,event,jsonl,checkpoint,verify}.ts`), wired `packages/ts/src/index.ts`, added `packages/ts/test/audit/k1-vectors.test.ts` (19 vectors, skipping `lintPersonalData`), and marked `T-M2-01` `done` in `docs/06-plan.md`.
- **Checks:** `npm.cmd test -- k1` (`18 failed | 1 passed (19)`, `k1-genesis-prev` passing), `portability` `5/5`, `typecheck` `0`, `lint` `45 files / 0 errors`, `build` `0`.
- **Next:** `T-M2-02` (`packages/ts/src/audit/event.ts`: `eventHash`, `appendEvent`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · M1 close & mutation checks (T-M1-11)

- **Done:** Closed M1 K0 Core. Added `DNB-002` to `docs/do-not-break.md` and marked `T-M1-11` `done` in `docs/06-plan.md`.
- **Mutations (`npm.cmd test -- k0`):** MC-1 (`envelope.ts` allowlist skipped) failed `k0-env-err-type-not-allowed` (`1 failed | 55 passed`); MC-2 (`envelope.ts` type omitted from PAE) failed 8 tests (`k0-sig-signing-input`, `k0-sig-sign-ed25519`, `k0-env-err-duplicate-kid`, `k0-env-err-insufficient`, and all 4 `k0-env-valid-*`, while `k0-env-err-wrong-type` also yields `PK_SIG_INVALID` on a pre-signed vector); MC-5 (`jcs.ts` `localeCompare`) failed `k0-jcs-utf16-order` (`1 failed | 55 passed`). All 3 restored cleanly.
- **Checks:** `npm.cmd run check` passed cleanly after restoration (`lint` 39 files, `typecheck` 0, `vitest` `17 files / 114 tests`, `build` 0).
- **Next:** `T-M2-01` (M2 K1 Audit Log: red skeleton k1).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · UUIDv7, nonces and timestamp helpers (T-M1-10)

- **Done:** Implemented `newUuidV7`, `newNonce`, `isTimestamp`, and `timestampFromMs` in `packages/ts/src/core/ids.ts`, with unit tests in `packages/ts/test/core/ids.test.ts` failing `3/3` before implementation. Marked `T-M1-10` `done` in `docs/06-plan.md`.
- **Checks:** `ids` `3/3`, `portability` `5/5`, `typecheck` `0`, `lint` `0`, `build` `0` (verified cleanly after final code edit).
- **Decisions:** None.
- **Next:** `T-M1-11` (M1 close: mutation checks MC-1, MC-2, MC-5, `DNB-002` in `docs/do-not-break.md`, full `npm.cmd run check`).

---

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · WebAuthn-ES256 signature entries (T-M1-09)
- Did: implemented `verifyWebauthnSignature` and `signatureFromAssertion` in `packages/ts/src/core/webauthn.ts`; created `packages/ts/test/core/webauthn.test.ts`; marked T-M1-09 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: red `webauthn.test.ts` failed `11/11`; then `webauthn` `11/11`, `k0` `56/56`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 38 files`), `build` 0 @ `fbfe196` + T-M1-09
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; all k2 WebAuthn decision envelopes (device-bound, synced passkey, and 8 negative checks) passed first try
- Next: T-M1-10 (`ids.ts`: UUIDv7, nonces, timestamps)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Fail-closed envelope verification (T-M1-08)
- Did: implemented `verifyEnvelope` (Ed25519 + ES256, `lowS: false`, normative 8-step order) in `packages/ts/src/core/envelope.ts`; stubbed internal `verifyWebauthnSignature` in `webauthn.ts` (scoped public export in `core/index.ts`); created `packages/ts/test/core/envelope.test.ts`; marked T-M1-08 `done`; updated `STATUS.md` and `LOG.md`
- Verified: red `envelope.test.ts` failed `3/3`; then `npm.cmd run check` passed (`lint` 0 `37` files, `typecheck` 0, `vitest` `100/100` across `15` files incl. `k0-vectors` `56/56`, `build` 0) @ `2af0a1f` + T-M1-08
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; `Object.hasOwn(policy, type)` guards against `Object.prototype` key collisions; all 56 k0 vectors green
- Next: T-M1-09 (`webauthn.ts`: WebAuthn-ES256 signature verification) and T-M1-10 (`ids.ts`)
