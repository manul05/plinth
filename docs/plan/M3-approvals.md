# M3 K2 Approvals ("two hands") — task cards

**Goal:** all 45 `k2` vectors pass; requests, matching codes, registry chains, approval verification with single use, break-glass; one real authenticator proven (spike). **This is the core-value milestone: review gate R1 follows it.**
**Demo:** approve with Windows Hello on the spike page → `valid: true`; replay → `PK_APPROVAL_REPLAYED`; other SHA → `PK_APPROVAL_SUBJECT_MISMATCH`.
Files: `packages/ts/src/approval/`, tests `packages/ts/test/approval/`.

---

### T-M3-01 · Red skeleton: k2 vector runner
- **Size:** S
- **Depends on:** T-M2-06
- **Covers:** AC-9.1, AC-10.1, AC-11.1, AC-11.2, AC-12.1 (failing harness)
- **Read first:** `contracts/spec/k2-approval.md`; `contracts/test-vectors/README.md`
- **Create:** `packages/ts/test/approval/k2-vectors.test.ts`; stubs `packages/ts/src/approval/index.ts`, `policies.ts`, `request.ts`, `registry.ts`, `verify.ts`, `store.ts`, `breakglass.ts` exporting every K2 name from the API file (bodies throw `not implemented`), except `policies.ts`, which is final now:
  ```ts
  export const SKEW_SECONDS = 300 as const;
  export const DECISION_POLICY: TypePolicy = { 'pk.approval.decision': { algs: ['webauthn-ES256', 'ES256'], min_signatures: 1 } };
  export const REGISTRY_POLICY: TypePolicy = { 'pk.approval.registry': { algs: ['webauthn-ES256', 'ES256'], min_signatures: 1 } };
  ```
  and `approval/index.ts` also re-exports `CHECKPOINT_POLICY` from `../audit/checkpoint.js`.
- **Modify:** `packages/ts/src/index.ts` (add `export * from './approval/index.js';`)
- **Tests (write first):** ops `matchingCode` (`digest(request)`, `matchingCode(request)`), `verifyRegistryChain` (call with camelCase names; for each key in `expect`, result[key] equals it), `verifyApproval` (`isConsumed: id => input.consumed_ids.includes(id)`; `toEqual(expect)`), `verifyBreakGlass` (`usedDigests: input.used_digests`; `toEqual`), `jwkFromP256Spki` (already passes from T-M1-05).
- **Run:** `npm test -- k2` → 43 failed, 2 passed. Paste.
- **Commit:** `test(approval): add failing k2 golden-vector runner (T-M3-01)`

### T-M3-02 · request.ts: createApprovalRequest, matchingCode, decisionPayload
- **Size:** S
- **Depends on:** T-M3-01
- **Covers:** AC-9.1, AC-9.2, TM-12
- **Read first:** `contracts/spec/k2-approval.md` §2
- **Modify:** `packages/ts/src/approval/request.ts`
- **Create:** `packages/ts/test/approval/request.test.ts`
- **Steps:** `matchingCode(r)`: `d = sha256Bytes(utf8Encode(canonicalize(r)))`; `u = ((d[0] << 24) >>> 0) + (d[1] << 16) + (d[2] << 8) + d[3]` (use `d[i] ?? 0` for strict index types); `String(u % 1000000).padStart(6, '0')`. `createApprovalRequest` per spec §2 (copy `window` only when given). `decisionPayload({request, decision, decidedAt, approverId, reason})` → `{spec:'pk-approval/1.0', request_digest: digest(request), decision, decided_at: decidedAt, approver_id: approverId}` plus `reason` only when given.
- **Tests (write first):** the 2 `matchingCode` vectors (`823898`, `472141`); `createApprovalRequest({realm:'passdown:project:x', action:'passdown.git.push_protected_ref', subject:{kind:'git-commit', digest: digest({a:1})}, display:{title:'Push 3 commits to main', risk:['main']}, requester:{kind:'agent', id:'codex:client:02'}, policy:{registry_version:1, min_approvals:1, distinct_from_requester:false}, nowMs:1793955600000, ttlSeconds:600})` → `created_at '2026-11-06T09:00:00.000Z'`, `expires_at '2026-11-06T09:10:00.000Z'`, id starts `01a1b016-1680-7`, nonce length 22, no `window` member; `ttlSeconds: 0` and `86401` → `PK_APPROVAL_REQUEST_MALFORMED`; `decisionPayload` for vector `k2-matching-code`'s request with decidedAt `'2026-11-02T09:03:00.000Z'`, approverId `'owner'` deep-equals the payload of the decision in `k2-approval-valid-webauthn`.
- **Run:** `npm test -- request k2`
- **Commit:** `feat(approval): requests, matching codes and decision payloads (T-M3-02)`

### T-M3-03 · registry.ts: verifyRegistryChain and trustedKeysFromRegistry
- **Size:** M
- **Depends on:** T-M3-02
- **Covers:** AC-10.1, TM-10, TM-11, TM-35
- **Read first:** `contracts/spec/k2-approval.md` §3
- **Modify:** `packages/ts/src/approval/registry.ts`
- **Create:** `packages/ts/test/approval/registry.test.ts`
- **Steps:** `trustedKeysFromRegistry(reg)` maps approvers to `{kid, jwk}` plus `webauthn: {rp_id, origins}` when the approver has `webauthn`. `verifyRegistryChain` per spec §3 steps 1–5 in order; key errors from `kidOf` are caught and returned as `{valid:false, error: code, at_version}`. Valid result: `{valid:true, version, registry_digest: digest(last), registry: last}`.
- **Tests (write first):** the 6 `verifyRegistryChain` vectors; `registry.test.ts` › `verifyRegistryChain never throws`: `envelopes: [null]` → `PK_APPROVAL_REGISTRY_MALFORMED` with `at_version: -1`; `envelopes: []` → same; an approver whose `kid` is changed to `'sha256:' + '0'.repeat(64)` → `PK_KEY_KID_MISMATCH`.
- **Run:** `npm test -- registry k2`
- **Commit:** `feat(approval): approver registry chain with anti-rollback (T-M3-03)`

### T-M3-04 · verify.ts part 1: request checks (steps 1–11)
- **Size:** M
- **Depends on:** T-M3-03
- **Covers:** AC-11.2 (request-side codes), TM-07, TM-09, TM-14
- **Read first:** `contracts/spec/k2-approval.md` §4 steps 1–11
- **Modify:** `packages/ts/src/approval/verify.ts`
- **Steps:** implement steps 1–11 in order, then (temporarily) return `{valid:false, error:'PK_APPROVAL_NO_DECISION'}` if decisions are empty and fall through to a `throw new Error('decisions not implemented')` guarded so the function still never throws to callers: wrap the decision loop placeholder in try/catch returning `PK_APPROVAL_DECISION_MALFORMED`. Times: `Date.parse(...)`; skew `SKEW_SECONDS * 1000`. `actualSubjectDigest` is compared with `===` and has no default value.
- **Tests (write first):** vectors that must pass after this task: `k2-approval-subject-mismatch`, `-expired`, `-not-yet-valid`, `-replayed`, `-unknown-action`, `-ttl-too-long`, `-no-decision`, `-realm-mismatch`, `-window-not-open`, `-registry-stale` (10).
- **Run:** `npm test -- k2` → those 10 pass
- **Commit:** `feat(approval): request-side approval checks (T-M3-04)`

### T-M3-05 · verify.ts part 2: decisions, distinct approvers
- **Size:** M
- **Depends on:** T-M3-04, T-M1-09
- **Covers:** AC-5.1, AC-5.2, AC-11.1, AC-11.2, TM-03, TM-06, TM-12, TM-13, TM-35
- **Read first:** `contracts/spec/k2-approval.md` §4 steps 12–15
- **Modify:** `packages/ts/src/approval/verify.ts` (replace the placeholder)
- **Create:** `packages/ts/test/approval/verify.test.ts`
- **Steps:** steps 12a–h, 13, 14, 15 in order; `approver_ids` sorted with `[...set].sort()`; result member order irrelevant.
- **Tests (write first):** all 31 `verifyApproval` vectors; `verify.test.ts` › `verifyApproval never throws`: `request` = `null`, `'x'`, `{}` → `PK_APPROVAL_REQUEST_MALFORMED`; valid request with `decisions: [null]` and `[{type:'pk.approval.decision'}]` → `PK_APPROVAL_DECISION_MALFORMED`.
- **Run:** `npm test -- verify k2` → 31/31 `verifyApproval`
- **Stop and ask the owner if:** any vector fails while the order matches the spec.
- **Commit:** `feat(approval): verify signed decisions and distinct approvers (T-M3-05)`

### T-M3-06 · store.ts: ConsumedIdStore, MemoryConsumedIdStore, verifyAndConsume
- **Size:** S
- **Depends on:** T-M3-05
- **Covers:** AC-11.3, TM-08
- **Read first:** `contracts/spec/k2-approval.md` §4 "Single use"
- **Modify:** `packages/ts/src/approval/store.ts`
- **Create:** `packages/ts/test/approval/store.test.ts`
- **Steps:** `MemoryConsumedIdStore` wraps a `Set<string>`; `has` resolves `set.has(id)`; `add` resolves `false` if present, else adds and resolves `true` (synchronous inside the promise, so it is atomic in one JS thread). `verifyAndConsume` exactly the 5 steps in the spec.
- **Tests (write first):** with the inputs of vector `k2-approval-valid-webauthn` and a new store: first call → `valid: true`; second call → `{valid:false, error:'PK_APPROVAL_REPLAYED'}`; › `concurrent verifyAndConsume admits exactly one`: new store, `Promise.all` of two calls → exactly one `valid: true` and one `PK_APPROVAL_REPLAYED`; invalid approval (subject mismatch) does **not** add the id (`store.has(id)` stays false).
- **Run:** `npm test -- store`
- **Commit:** `feat(approval): single-use approvals with an atomic store (T-M3-06)`

### T-M3-07 · breakglass.ts: recovery codes
- **Size:** S
- **Depends on:** T-M3-03
- **Covers:** AC-12.1
- **Read first:** `contracts/spec/k2-approval.md` §5
- **Modify:** `packages/ts/src/approval/breakglass.ts`
- **Create:** `packages/ts/test/approval/breakglass.test.ts`
- **Steps:** normalise = `code.toUpperCase().replace(/[- ]/g, '')`; `breakGlassDigest(code) = digestBytes(utf8Encode(normalise(code)))`; `newBreakGlassCode()`: 13 random bytes → `base32nopad.encode` → first 20 chars → `match(/.{5}/g).join('-')`; `verifyBreakGlass` per spec.
- **Tests (write first):** 4 `verifyBreakGlass` vectors; `newBreakGlassCode()` matches `/^[A-Z2-7]{5}(-[A-Z2-7]{5}){3}$/`; 100 codes are distinct; `breakGlassDigest('abcde-fghij-klmno-pqrs2') === 'sha256:444361933609d23e64cb267c3a740a4e908cbfe7e17ff6af23ec9c38999e698e'`.
- **Run:** `npm test -- breakglass k2` → all 45 k2 vectors pass
- **Commit:** `feat(approval): one-time break-glass recovery codes (T-M3-07)`

### T-M3-08 · SPIKE (time-box 2 h): a real authenticator's assertion verifies
- **Size:** M
- **Depends on:** T-M3-07
- **Covers:** AC-5.3, TM-06 (real-world), ADR-0007 check
- **Why:** all WebAuthn vectors are synthetic. Real authenticators may differ (high-S signatures, extra clientDataJSON members such as `topOrigin`, `crossOrigin` absent, flags with BE/BS set by Windows Hello sync).
- **Create:** `packages/ts/repo-tools-static/webauthn-capture.html`, `packages/ts/src/repo-tools/webauthn-capture-server.ts`, `spike-output/` (git-ignored)
- **Steps:**
  1. The server (Node `node:http`, port **8787**, binds `127.0.0.1` only) serves `GET /` = the HTML file and `POST /save` = writes the request body to `spike-output/assertion-<n>.json` (n = 1, 2, …), max body 64 KB, then responds `saved`. Run: `npm run build && node packages/ts/dist/repo-tools/webauthn-capture-server.js` → prints `capture page on http://localhost:8787 (Ctrl+C to stop)`.
  2. The page (plain HTML + inline `<script type="module">`, no libraries) has two buttons. **Register**: `navigator.credentials.create` with `rp: {id:'localhost', name:'Plinth spike'}`, `user` id 16 random bytes, name `owner`, `pubKeyCredParams: [{type:'public-key', alg:-7}]`, `authenticatorSelection: {userVerification:'required', residentKey:'preferred'}`, `attestation:'none'`; keep `response.getPublicKey()` (SPKI) and `rawId`. **Approve**: build the fixed payload `{spec:'pk-approval/1.0', request_digest:'sha256:' + 'ab'.repeat(32), decision:'approve', decided_at: new Date().toISOString(), approver_id:'owner'}`, POST it to the server at `POST /challenge` (server computes `webauthnChallenge('pk.approval.decision', payload)` with the built library and returns it base64url), call `navigator.credentials.get({challenge, allowCredentials:[{type:'public-key', id: rawId}], userVerification:'required', rpId:'localhost'})`, then POST `{payload, spki_b64url, credential_id, authenticatorData, clientDataJSON, signature}` (all base64url) to `/save`. Show "Saved assertion N" on the page.
  3. Owner (gate **G-spike**, plain English: "open http://localhost:8787 in Chrome on the laptop, press Register, use Windows Hello, then press Approve and touch the fingerprint / enter the PIN") does it once on the laptop. Second run: the phone cannot reach `localhost` on the laptop, so on the phone use Chrome's "Use a phone or tablet" option in the Windows Hello dialog (cross-device passkey) — this records a phone authenticator through the laptop page. If Chrome does not offer that option for `localhost`, record only the Windows Hello assertion, write "phone path not testable on localhost; moved to Passdown's hosted-origin spike" in LOG, and continue (this is a pre-decided outcome, not a failure).
  4. Agent writes `packages/ts/test/approval/real-assertion.test.ts` that, for each file in `spike-output/`, builds the envelope with `signatureFromAssertion` and `jwkFromP256Spki`, trusted key `{kid, jwk, webauthn:{rp_id:'localhost', origins:['http://localhost:8787']}}`, and calls `verifyEnvelope` with `DECISION_POLICY`. The test is skipped when `spike-output/` has no files (`describe.skipIf`).
- **Outcome A — both assertions verify:** record in LOG (flags seen, whether `topOrigin`/`crossOrigin` appeared, high-S or not). Convert each into a committed vector `contracts/test-vectors/k2/k2-real-<windows-hello|phone>.json` (op `verifyEnvelope`, suite `pk-approval/1.0`) **only after** the owner says yes in chat (contracts change; also add ADR-0015 "Add real-authenticator vectors" and regenerate `index.json` with a one-off script whose code is pasted into the ADR, not committed). Real assertions contain only a public key and a signature over a TEST payload: no secret. Continue to T-M3-09.
- **Outcome B — an assertion fails:** find the failing step from the returned error code. Pre-decided fixes: `PK_SIG_INVALID` with a valid DER → check `lowS:false` is passed (that is the only allowed fix); `PK_WEBAUTHN_MALFORMED` from clientDataJSON parsing → keep `JSON.parse` but make sure only `type`, `challenge`, `origin`, `crossOrigin` are read (extra members are allowed); `PK_WEBAUTHN_ORIGIN` → the page origin must be exactly `http://localhost:8787` (fix the test's trusted key, not the verifier); `PK_WEBAUTHN_UV` → the authenticator did not verify the user: re-run with a PIN/biometric set up; **any other code → STOP and ask the owner** with the error code and flags (do not loosen a check).
- **Run:** `npm test -- real-assertion` → pass (Outcome A or after a pre-decided fix)
- **Done when:** result and outcome recorded in LOG · STATUS updated
- **Commit:** `test(approval): verify real authenticator assertions (spike T-M3-08)`

### T-M3-09 · M3 close: mutation checks, E2E-2, review gate R1
- **Size:** S
- **Depends on:** T-M3-06, T-M3-08
- **Covers:** NFR-11 (MC-3, MC-4, MC-8, MC-9, MC-10, MC-11)
- **Modify:** `docs/status/STATUS.md`, `docs/status/LOG.md`, `docs/06-plan.md`, `docs/do-not-break.md` (add DNB-003)
- **Steps:** the six mutation checks; `npm run check`; add:
  ```
  ## DNB-003: ECDSA verification passes lowS: false
  - Where: packages/ts/src/core/envelope.ts and core/webauthn.ts (p256.verify calls)
  - Rule: every p256.verify call passes { lowS: false }
  - Why: noble rejects high-S by default; authenticators and other languages may produce high-S signatures, which are valid ECDSA
  - Test: k0-env-valid-es256-high-s
  ```
  Then **gate R1**: ask the owner to run the review prompt in `docs/testing.md` §8 with `<M3>`; record the result in LOG; turn critical/high findings into fix tasks `T-M3-10…` (S or M each) before M4 starts.
- **Done when:** mutation checks logged · R1 recorded · STATUS "Next step: T-M4-01" (or the first fix task)
- **Commit:** `docs: close milestone M3 and record review R1 (T-M3-09)`
