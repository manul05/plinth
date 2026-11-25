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

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Signing input and Ed25519 signatures (T-M1-07)
- Did: implemented `signingInput`, `webauthnChallenge`, `signEd25519`, `createEnvelope` in `packages/ts/src/core/envelope.ts` (moved `webauthnChallenge` from `webauthn.ts` to avoid circular import); created `packages/ts/test/core/envelope-sign.test.ts`; marked T-M1-07 `done`; updated `STATUS.md` and `LOG.md`
- Verified: red `envelope-sign.test.ts` failed `2/2`; then `envelope-sign` `2/2`, `k0 sign` `2/2`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 36 files`), `build` 0 @ `ab14c55` + T-M1-07
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: placed `webauthnChallenge` in `envelope.ts` per T-M1-07 so `envelope.ts` -> `webauthn.ts` stays acyclic
- Next: T-M1-08 (`verifyEnvelope` for Ed25519/ES256, 56/56 k0 vectors)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Strict DER and P1363 conversion (T-M1-06)
- Did: implemented `p1363ToDer` and `derToP1363` in `packages/ts/src/core/der.ts`; created `packages/ts/test/core/der.test.ts`; marked T-M1-06 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: red `der.test.ts` failed `4/4`; then `der` `4/4`, `k0` DER vectors `6/6`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 35 files`), `build` 0 @ `38ada80` + T-M1-06
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; single `readDerInt` helper enforces strict minimal non-negative DER integers with zero trailing bytes
- Next: T-M1-07 (`envelope.ts` signing input, Ed25519 sign, `createEnvelope`, `webauthnChallenge`)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Key thumbprints, kids, SPKI import, test kids (T-M1-05)
- Did: created `packages/ts/src/core/test-kids.ts` and `packages/ts/test/core/keys.test.ts`; implemented `packages/ts/src/core/keys.ts` and exported `test-kids.js` in `core/index.ts`; marked T-M1-05 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: red `keys.test.ts` failed `5/5`; then `keys` `5/5`, `k0 kidOf` `7/7`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 34 files`), `build` 0 @ `2747dd2` + T-M1-05
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; `@noble/curves` `p256.Point.fromBytes` and `ed25519.getPublicKey` passed all 7 `kidOf` + 2 SPKI vectors on first run
- Next: T-M1-06 (`der.ts`: strict DER ↔ P1363)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · pk-JCS canonicalisation and digests (T-M1-04)
- Did: implemented `canonicalize`, `digest`, `digestBytes`, `GENESIS_DIGEST` in `packages/ts/src/core/jcs.ts`; created `packages/ts/test/core/jcs.test.ts`; marked T-M1-04 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: red `jcs.test.ts` failed `2/2`; then `jcs` `2/2`, `k0 parseAndCanonicalize` `22/22`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 32 files`), `build` 0 @ `2005404` + T-M1-04
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; UTF-16 key sort and `Object.getOwnPropertyDescriptor` passed all 22 `k0-jcs-*` vectors on the first run
- Next: T-M1-05 (`keys.ts`: thumbprint, kids, SPKI import, test-kid list)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Strict I-JSON parser (T-M1-03)
- Did: implemented `parseJson` and `MAX_DEPTH` in `packages/ts/src/core/json.ts`; created `packages/ts/test/core/json.test.ts`; marked T-M1-03 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: red `json.test.ts` failed `3/3`; then `json` `3/3`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 31 files`), `build` 0 @ `bcdea05` + T-M1-03
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; replaced `parsed.__proto__` in test with `Object.getOwnPropertyDescriptor` to satisfy Biome `noProto`
- Next: T-M1-04 (`jcs.ts`: pk-JCS canonicalize and digest)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Strict base64url, hex, UTF-8, SHA-256 (T-M1-02)
- Did: implemented `packages/ts/src/core/bytes.ts` and created `packages/ts/test/core/bytes.test.ts`; marked T-M1-02 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: red `bytes.test.ts` failed `3/3`; then `bytes` `3/3`, `portability` `5/5`, `typecheck` 0, `lint` 0 (`Checked 30 files`), `build` 0 @ `5fe5c8a` + T-M1-02
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD; `@noble/hashes` and `@scure/base` specifiers resolve cleanly under NodeNext + TS 7
- Next: T-M1-03 (`json.ts`: strict I-JSON parser)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Red skeleton k0 vector runner (T-M1-01)
- Did: created `packages/ts/test/core/k0-vectors.test.ts` and 9 core stubs in `packages/ts/src/core/`; exported from `src/index.ts`; marked T-M1-01 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: `npm.cmd test -- k0` `56 failed (56)` (expected red), `typecheck` 0, `lint` 0, `portability` `5/5` @ `5e4bc4b` + T-M1-01
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: used `expectPlinthError` asserting `instanceof PlinthError` + `code` so error vectors fail against stubs instead of passing on `not implemented`
- Next: T-M1-02 (`bytes.ts`: base64url, hex, UTF-8, SHA-256)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Green CI/security-scan (T-M0-05) & close M0 (T-M0-08)
- Did: added `passWithNoTests: true` (`vitest.perf.config.ts`) and `.gitleaksignore` (`11` synthetic `650cc02` vector fingerprints) (`30609a8`); marked T-M0-05 and T-M0-08 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: `ci` green (`45593567766`), `security-scan` green (`45593572876`), `npm.cmd ci` + `npm.cmd run check` (`lint` 0, `typecheck` 0, `vitest` `22/22`, `build` 0) @ `30609a8`
- Decisions: none
- Owner: "done now you push it"; "continue with your recommendation" (2026-11-25)
- AI: initial `ci` failed on empty `test:perf` suite and `gitleaks` flagged 11 synthetic `650cc02` test-vector fixtures; fixed cleanly with `passWithNoTests` and `.gitleaksignore`
- Next: T-M1-01 (Red skeleton k0)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Errors module (T-M0-07, local)
- Did: created `packages/ts/src/errors.ts` (`ERROR_MESSAGES` 97 entries, `PlinthError`) and `packages/ts/test/errors.test.ts`; exported in `packages/ts/src/index.ts`; marked T-M0-07 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md` (committed locally on `development`)
- Verified: red test failed (`ERROR_MESSAGES` undefined, `PlinthError` not a constructor); then `npm.cmd test` `22/22` (`7` files), `typecheck` 0, `lint` 0 (`Checked 19 files`), `build` 0 @ `7257de7` + T-M0-07
- Decisions: none
- Owner: "Continue locally" (2026-11-25)
- AI: smooth TDD; `portability.test.ts` also passed with `errors.ts` added; M0 code/tests are complete locally, awaiting `workflow` scope push for T-M0-05/T-M0-08
- Next: push `development` with `workflow` scope, verify Actions runs green (T-M0-05), close M0 (T-M0-08)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Portability guard (T-M0-06, local)
- Did: created `packages/ts/test/portability.test.ts`; marked T-M0-06 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md` (committed locally on `development`; T-M0-05 push pending `workflow` scope)
- Verified: `npm.cmd test` `20/20` (`6` files), `typecheck` 0, `lint` 0 (`Checked 17 files`) @ `1d40052` + T-M0-06
- Decisions: none
- Owner: "Continue locally" (2026-11-25)
- AI: T-M0-05 committed locally at `1d40052`; push rejected by GitHub without `workflow` OAuth scope so continuing locally with T-M0-06/T-M0-07
- Next: T-M0-07 (errors module), then owner workflow push + Actions runs for T-M0-05/T-M0-08

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Contract self-checks, pins, and ADR-0017 (T-M0-04)
- Did: created `packages/ts/test/contracts.test.ts`, `packages/ts/test/deps.test.ts`, and `docs/decisions/0017-jwk-schema-strict-required.md`; updated `contracts/schemas/jwk.schema.json` (`"properties": { "d": {} }` in both `"not"` blocks), `docs/decisions/README.md`, `docs/04-architecture.md`, `docs/06-plan.md` (T-M0-04 `done`), `STATUS.md`, `LOG.md`
- Verified: initial run failed `2/13` on `jwk.schema.json` `strictRequired`; after ADR-0017 fix, `npm.cmd test` `13/13` passed (`4` files), `typecheck` 0, `lint` 0 (`Checked 15 files`) @ `57e3b33` + T-M0-04
- Decisions: ADR-0017 (fix `jwk.schema.json` for Ajv `strict: true`)
- Owner: "cotinue" (2026-11-25); "continue with your recommendation" (2026-11-25)
- AI: caught Ajv 8.20 `strictRequired` failure on `jwk.schema.json` `not.required: ["d"]`; owner approved schema fix + ADR-0017
- Next: T-M0-05 (CI, security-scan, Dependabot) or T-M0-06 / T-M0-07

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Version test and golden-vector loader (T-M0-03)
- Did: created `packages/ts/test/version.test.ts`, `packages/ts/test/vectors.ts`, `packages/ts/test/vectors.test.ts`; marked T-M0-03 `done` in `docs/06-plan.md`
- Verified: red test failed on missing `./vectors.js`; then `npm.cmd test` `4/4` passed (`2` files), `typecheck` 0, `lint` 0 (`Checked 13 files`) @ `37dda40` + T-M0-03
- Decisions: none
- Owner: "continue" (2026-11-25)
- AI: smooth TDD cycle; `loadVectors` and `loadKey` match all 177 vector counts and test key IDs
- Next: T-M0-04 (contract self-checks and dependency pin tests)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Root npm workspace and pinned toolchain (T-M0-02)
- Did: created `package.json`, `.nvmrc`, `tsconfig.base.json`, `biome.json`, `vitest*.config.ts`, `packages/ts/{package.json,tsconfig*.json,src/index.ts,README.md}`, `package-lock.json`; appended outputs to `.gitignore`; marked T-M0-02 `done` in `docs/06-plan.md`
- Verified: `npm.cmd ls` exact pins (`@noble/*`/`@scure/base` 2.4.0, TS 7.0.2, Vitest 5.0.5, Vite 8.3.4, Biome 2.5.15, Ajv 8.20.0, yaml 2.9.1, safe-regex2 5.1.2, `@types/node` 24.19.2); `lint` 0 (`Checked 10 files`), `typecheck` 0, `build` 0 @ `8d3149f` + T-M0-02
- Decisions: excluded `!contracts` in `biome.json` instead of reformatting 17 `contracts/` files
- Owner: "continue" (2026-11-25); "continue with your recommendation" (2026-11-25)
- AI: `biome check .` initially flagged 17 untouched `contracts/` files (`!contracts/test-vectors` was too narrow); owner approved excluding `!contracts`
- Next: T-M0-03 (version test and golden-vector loader)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Re-pin Node 26.13.1 / npm 11.20.0 (ADR-0016)
- Did: created ADR-0016 (`docs/decisions/0016-repin-node-26-13-1-npm-11-20-0.md`); updated `decisions/README.md`, `README.md`, `START-HERE.md`, `03-spec.md`, `04-architecture.md`, `M0-setup.md` (T-M0-02), `STATUS.md`, `LOG.md`
- Verified: `sh scripts/check-doc-sizes.sh` exited 0 (pre-commit hook); `node -v` `v26.13.1`, `npm.cmd -v` `11.20.0` @ `08b339f`
- Decisions: ADR-0016 (re-pin Node `26.13.1` / npm `11.20.0`)
- Owner: "Node/npm decision - re-pin Plinth to 26.13.1 / 11.20.0" (2026-11-25)
- AI: left `AGENTS.md` line 8 untouched because only the owner edits `AGENTS.md`
- Next: T-M0-02 (root npm workspace and pinned toolchain)

## 2026-11-25 · Antigravity (Gemini 4 Hydrogen (High)) · Complete T-M0-01 (G0, hooks, guard proof)
- Did: updated G0 GitHub settings (`development` default, merge-commits only, Dependabot alerts & security updates ON); installed `.githooks`; marked T-M0-01 `done` in `docs/06-plan.md`; updated `STATUS.md` and `LOG.md`
- Verified: `sh scripts/install-hooks.sh --check` (`OK: hooks active`); G0 settings verified via `gh`; guard proof `git push origin development:main` & `OWNER_APPROVES_PUSH=deadbee` both `BLOCKED` and `origin/main` unchanged at `650cc02` @ `d674bf9`
- Decisions: none (Node/npm re-pin to follow in ADR-0016)
- Owner: "G0 GitHub settings - you do it"; "Guard proof & commit - yes" (2026-11-25)
- AI: Windows sandbox blocks Git Bash (`0xC0000022`), `gh` config, and network; `BypassSandbox` worked cleanly for remote/Git Bash checks
- Next: ADR-0016 (re-pin Node `26.13.1` / npm `11.20.0`), then T-M0-02

## 2026-11-07 · Claude Code (Sonnet 5.5, then Opus 5.5) · K2 subject-digest wording
- Did: `contracts/spec/k2-approval.md` says each product defines its own subject digest (examples: the vectors' form and Passdown's); Plinth compares the two as strings (section 4, step 6). ADR-0015 and its index line. No vectors, schemas or code changed.
- Verified: not run (wording only).
- Owner, 2026-11-07: "Yes, reword it"; "Yes, fix and push".

## 2026-10-31 · Claude (claude-opus-5-5) · Stage 3 plan for Plinth 0.1
- Did: wrote START-HERE, docs 01-06, plan/M0-MR (65 tasks), testing, consuming, patterns, ADR 0001-0014, contracts (spec, API, 17 schemas, errors, 177 vectors), rules (4 packs)
- Verified: vectors schema-valid; cross-check 48/48 (OpenSSL via node:crypto, RFC 8785 reference); 70/70 rule tests; verify-snapshot.sh on Git Bash. No repo yet, so no SHA
- Decisions: ADR-0001…0014
- Owner: programme decisions of 2026-10-31 (public once tested, hash-pinned snapshot, synced passkeys for solo tools, bindings when needed) applied
- AI: vectors computed with a throwaway reference outside the repo; package versions chosen with a 14-day cooldown
- Next: owner gate G0, then T-M0-01
