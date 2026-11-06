# K2 Approvals, "two hands" (`pk-approval/1.0`)

**Status:** normative for Plinth 0.1 (2026-10-31; K2 moved into 0.1 because Passdown is the first consumer). **Vectors:** `contracts/test-vectors/k2/` (45). **Schemas:** `pk-approval.request`, `pk-approval.decision-payload`, `pk-approval.registry-payload`. **API:** subpath `plinth-kit/approval`.

**Purpose:** a dangerous action happens only when an authorised human signed a statement about exactly that action, and the **enforcement point checks the signature itself**, so a compromised server or a flipped database row cannot approve anything.

## 1. Objects
- **ApprovalRequest** (plain pk-JCS object; its digest is what gets approved). Fields and limits: `pk-approval.request.schema.json`. `subject.digest` is computed by the system that observed the action (Passdown: `digest({kind:"git-commit", repo, ref, sha})`), never copied from the requesting agent. `display` is computed by that same system.
- **Decision**: envelope type `pk.approval.decision`, payload `{spec, request_digest, decision:"approve"|"deny", decided_at, approver_id, reason?}`. Allowed algs: `webauthn-ES256`, `ES256` (`DECISION_POLICY`, min 1). **Ed25519 is never allowed** (software keys cannot approve).
- **Registry**: envelope type `pk.approval.registry`, payload `{spec, realm, version, approvers[], break_glass[{code_digest}], max_ttl_seconds, allow_synced_passkeys}` (`REGISTRY_POLICY` = same algs, min 1). Approver profiles: `webauthn` (alg webauthn-ES256), `android-keystore` and `windows-tpm` (alg ES256). Every approver's `kid` MUST equal `kidOf(jwk)`.
- `allow_synced_passkeys`: programme decision 2026-10-31 — `true` for solo tools (Passdown), `false` for business and regulated products (GPO Ledger, AuthSunset, Hearth, Pagerline).

## 2. Helpers
- `createApprovalRequest(input)`: id = `newUuidV7(nowMs)`, nonce = `newNonce()`, `created_at = timestampFromMs(nowMs)`, `expires_at = timestampFromMs(nowMs + ttlSeconds*1000)`; `ttlSeconds` must be 1–86400 else throws `PK_APPROVAL_REQUEST_MALFORMED`.
- `matchingCode(request)` = (first 4 bytes of SHA-256(UTF-8(canonicalize(request))) read as a big-endian unsigned 32-bit integer) mod 1 000 000, zero-padded to 6 digits. Shown on the requesting terminal and the approving phone; both compute it independently.
- `decisionPayload(...)` builds the payload with `request_digest = digest(request)`.
- `trustedKeysFromRegistry(reg)` = approvers mapped to `{kid, jwk, webauthn?: {rp_id, origins}}`.

## 3. `verifyRegistryChain({envelopes, genesisDigest, highestSeenVersion})` — never throws
For each envelope e (index i) with p = e.payload:
1. p is an object, `p.spec === "pk-approval/1.0"`, safe-integer version, array approvers, `e.type === "pk.approval.registry"` → else `PK_APPROVAL_REGISTRY_MALFORMED` (`at_version` = p.version or −1).
2. every approver: `kidOf(jwk) === kid` → else `PK_KEY_KID_MISMATCH` (a key error gives its own code).
3. i = 0: `p.version === 1` and `digest(p) === genesisDigest` → else `PK_APPROVAL_REGISTRY_GENESIS_MISMATCH`; then `verifyEnvelope(e, {trustedKeys: trustedKeysFromRegistry(p), policy: REGISTRY_POLICY})` (self-signed genesis; trust comes from the pinned digest) → else that error.
4. i > 0: `p.realm === previous.realm` → else `PK_APPROVAL_REALM_MISMATCH`; `p.version === previous.version + 1` → else `PK_APPROVAL_REGISTRY_VERSION_GAP`; `verifyEnvelope` with the **previous** registry's keys → `PK_SIG_UNKNOWN_KID` becomes `PK_APPROVAL_REGISTRY_UNAUTHORISED`, other errors pass through.
5. After the loop: last version < `highestSeenVersion` → `PK_APPROVAL_REGISTRY_ROLLBACK`. Else `{valid:true, version, registry_digest: digest(last payload), registry: last payload}`. The caller stores the new highest version.
Empty `envelopes` → `PK_APPROVAL_REGISTRY_MALFORMED` with `at_version: -1`.

## 4. `verifyApproval(input)` — MUST run at the enforcement point; never throws; normative order
Skew S = 300 s (`SKEW_SECONDS`). c = created_at, x = expires_at, t = now (all parsed to ms).
1. request is an object with string id, object subject, object policy, object requester, `created_at`/`expires_at` matching the timestamp pattern → else `PK_APPROVAL_REQUEST_MALFORMED`.
2. `spec === "pk-approval/1.0"` → else `PK_SPEC_UNSUPPORTED`.
3. `realm === registry.realm` → else `PK_APPROVAL_REALM_MISMATCH`.
4. action in `allowedActions` (closed list from product code) → else `PK_APPROVAL_UNKNOWN_ACTION`.
5. `policy.registry_version > registry.version` → `PK_APPROVAL_REGISTRY_STALE`.
6. `subject.digest === actualSubjectDigest` (recomputed from the thing about to happen) → else `PK_APPROVAL_SUBJECT_MISMATCH`. **This step is the whole point.**
7. x ≤ c or x − c > `max_ttl_seconds`·1000 → `PK_APPROVAL_TTL_TOO_LONG`.
8. t < c − S → `PK_APPROVAL_NOT_YET_VALID`; t > x + S → `PK_APPROVAL_EXPIRED`.
9. window present: t < opens_at → `PK_APPROVAL_WINDOW_NOT_OPEN`; t > closes_at → `PK_APPROVAL_WINDOW_CLOSED` (no skew on windows).
10. `isConsumed(request.id)` → `PK_APPROVAL_REPLAYED`.
11. decisions empty → `PK_APPROVAL_NO_DECISION`.
12. rd = digest(request). For each decision d in order:
    a. object, `d.type === "pk.approval.decision"`, object payload → else `PK_APPROVAL_DECISION_MALFORMED`;
    b. `verifyEnvelope(d, {trustedKeys: trustedKeysFromRegistry(registry), policy: DECISION_POLICY})` → else its error code unchanged (for example `PK_WEBAUTHN_ORIGIN` or `PK_SIG_ALG_NOT_ALLOWED`);
    c. payload: `spec === "pk-approval/1.0"`, string approver_id, decision in {approve, deny}, decided_at is a timestamp → else `PK_APPROVAL_DECISION_MALFORMED`;
    d. `request_digest === rd` → else `PK_APPROVAL_REQUEST_MISMATCH`;
    e. for each signer: registry approver with that kid has `id === approver_id` → else `PK_APPROVAL_APPROVER_MISMATCH`; (profile is webauthn) === (alg is webauthn-ES256) → else `PK_APPROVAL_PROFILE_ALG_MISMATCH`; signer flags.be true and `allow_synced_passkeys !== true` → `PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED`;
    f. decided_at outside [c − S, x + S] → `PK_APPROVAL_DECISION_TIME`;
    g. decision "deny" → `PK_APPROVAL_DENIED` (any deny denies);
    h. add approver_id to the set.
13. `distinct_from_requester`: `requester.human_id` missing → `PK_APPROVAL_REQUESTER_UNKNOWN`; human_id in the approver set → `PK_APPROVAL_SELF_APPROVAL`.
14. set size < `min_approvals` → `PK_APPROVAL_INSUFFICIENT`.
15. `{valid:true, request_digest: rd, matching_code, approver_ids (sorted ascending), consume_id: request.id}`.
- **Single use:** `verifyAndConsume(input)` does exactly: (1) if `input.request` is an object with a string `id`, `seen = await store.has(id)`, else `seen = false`; (2) `r = verifyApproval({...input, isConsumed: () => seen})`; (3) if `r.valid` is false return r; (4) `added = await store.add(r.consume_id)`; (5) `added` false → `{valid:false, error:"PK_APPROVAL_REPLAYED"}`, else return r. Products MUST make `add` atomic (Durable Object storage, unique index). Offline verifiers keep a local store. Replay against another verifier is limited by subject binding and short expiry (threat model TM-09).
- Every approve and deny MUST also be written by the product as a K1 event whose `refs` holds `{kind:"pk.approval.decision", digest: digest(decision.payload)}`.

## 5. Break-glass recovery codes
- Format: 20 characters from `A-Z2-7` (100 bits), shown `XXXXX-XXXXX-XXXXX-XXXXX`. `newBreakGlassCode()`: 13 random bytes → RFC 4648 base32 (no padding) → first 20 characters → hyphen every 5.
- Normalise: upper-case, remove `-` and spaces. `breakGlassDigest(code) = digestBytes(UTF-8(normalised))`.
- `verifyBreakGlass({code, registry, usedDigests})`: normalised not `^[A-Z2-7]{20}$` → `PK_APPROVAL_BREAK_GLASS_FORMAT`; digest not in `registry.break_glass` → `PK_APPROVAL_BREAK_GLASS_UNKNOWN`; in usedDigests → `PK_APPROVAL_BREAK_GLASS_USED`; else `{valid:true, code_digest}`. Product records use as K1 event `pk.approval.break_glass_used` and raises an alarm.
- The registry has no `used` flag (a signed registry cannot track use; ADR-0012).

## 6. Honest limits (copy into every consumer's threat model)
- Synced passkeys are not device-bound; realms needing "only this phone" set `allow_synced_passkeys: false`.
- Whoever controls the enforcement point (local admin on the PC running the git hook) can skip verification. K2 protects against a compromised server or requester, not a compromised verifier.
- Solo fallback (hold-to-confirm, typed reason, undo window without a second key) is a UX pattern (`docs/patterns/two-hands-ux.md`), logged as `"assurance": "single-person"`, not K2.
