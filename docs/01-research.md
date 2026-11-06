# Plinth: research (Stage 1–2 input)

> **Source:** the programme's shared platform-kit design, `_Portfolio/foundations/platform-kit.md` in the portfolio index repo, **DRAFT v0.1 dated 2026-10-28**, written by Claude. Copied **verbatim** on 2026-10-31 (Stage 3) for the sections Plinth 0.1 needs: §0, §2, §3.0–§3.6 (§3.4 K3 is kept as context for 0.2), §3.9–§3.11, §4, §6, §7 and §8. Sections §1 (capability inventory across all 21 projects), §3.7 (K6 India data), §3.8 (K7 webhooks) and §5 (Hearth relationship) are left out because they are not in Plinth 0.1; read them in the portfolio repo if needed.
>
> **Names changed since the draft (2026-10-31 branding pass):** `platform-kit` → **Plinth** (repo `plinth`, npm package `plinth-kit`; the `pk` prefix is kept, ADR-0011); **Baton → Passdown**; Roster → Muster; Quorum → Common Seal; ShipGate → Gatecrasher; MCP Watchtower → Toolmark; OpsDesk → Rounds; Stockroom → Racklane; Surface → Doorcheck; NetScope → Lanwise; Medfold → Kinfile.
>
> **Answers to the draft's §8 questions (programme decisions log, 2026-10-31):** Q1 (b) the kit repo goes **public once tested**, MIT; Q2 (a) projects consume a **hash-pinned snapshot**; Q3 (a) **Baton/Passdown is the first web project**, so **K2 moves into 0.1**; Q4 (c) **synced passkeys allowed for solo tools, device-bound keys for business and regulated products**; Q5 (a) **C# and Kotlin bindings only when first needed**.
>
> Where Stage 3 refined the draft (for example `entropy_min` as a string, `pair_with.rules`, no `used` flag in break-glass entries), the normative text is in `contracts/spec/` and the reasons in ADR-0012. The draft below is history, not the contract.

---

## 0. Summary

- The kit is **a set of small, written contracts plus golden test vectors**, with thin reference libraries in TypeScript, C# and Kotlin. It is **not** a framework, a server, a UI library or a shared database.
- **Seven components**, all MIT:
  - **K0 Core:** canonical JSON, digests, key IDs, the signed envelope.
  - **K1 Audit chain:** the tamper-evident, hash-chained log.
  - **K2 Approvals ("two hands"):** signed approval requests and decisions.
  - **K3 Evidence bundle:** the bundle format, plus a static verify page and a CLI.
  - **K4 Rule-pack format:** versioned rules with source, version and effective date.
  - **K5 Detection packs:** secret rules including Indian services, Indian PII detectors, and hidden-text rules.
  - **K6 India compliance data:** regulation registry, incident clocks, retention, control catalogue.
  - **K7 (optional, later) Signed webhook contract.**
- **First build (Kit 0.1, for the web wave):** K0, K1, K4 and K5, as **TypeScript plus language-neutral vectors**. Kit 0.2 adds K3 (verify page) and K2 (WebAuthn approvals). If Baton is the first web project, K2 moves into 0.1. C# and Kotlin bindings are written only when the first desktop or Android consumer starts. They must pass the same vectors.
- **Repo:** one monorepo, `platform-kit`, holding specs, schemas, vectors, rule data and per-language packages.
- **Consumption:** while repos are private, each project vendors a tagged release, pinned by hash. This needs no tokens and no submodules. Once the kit is public, switch to the public registries (npm, NuGet, Maven Central). GitHub Packages works, but it needs a personal access token even for public packages (§4).
- **Hearth:** `hearth-protocol` stays its own repo for Hearth-specific APIs. It **imports** the kit's primitives (K0, K1, K2, K3) instead of defining its own (§5).


---

## 2. What goes in the kit, and what stays in projects

### 2a. Rules for deciding
A capability goes in the kit only if **all** of these hold:
1. **Two or more projects on different stacks** must produce or check **the same bytes** (hashes, signatures, rule files, evidence). If only one stack needs it, it stays in a project and may become a per-stack library later.
2. It can be specified as **a data format plus a verification algorithm**, testable by golden vectors. If its value is mostly UI, storage or workflow, it does not go in the kit.
3. It has **no runtime dependency on a server**. The kit never runs as a service, and nothing in it phones home.
4. It is small enough that a new language binding can be written by an AI agent in about one session per component, guided by the spec and vectors.

### 2b. What the kit is NOT
- Not a web framework, UI component library, auth system, ORM, multi-tenant layer or job runner.
- Not a shared database or shared hosted service. Projects share **formats and code**, never data. Quorum's own note says the same: "reused code, not shared data".
- Not a home for product-specific rule content. Quorum's MCA calendar, Stockroom's e-way bill rule, LureLens's scam patterns, Medfold's lab profiles and NetScope's TRAI rules live in their own repos, written in the K4 format and checked by the K4 validator.
- Not a crypto library. It **wraps** audited libraries (§3.0) and adds formats, domain separation and verification rules.

### 2c. Minimal kit for the first build (web wave)
**Kit 0.1, TypeScript plus language-neutral specs and vectors:**
- **K0 Core:** JCS profile, digests, key IDs, the signed envelope; verify Ed25519 and ES256; sign Ed25519.
- **K1 Audit chain:** event format, append rules, checkpoints, verifier.
- **K4 Rule-pack format:** JSON Schemas, validator, "rule as of date" selection.
- **K5 Detection packs v1:** India secret rules (only the formats verified so far), a global subset ported from gitleaks (MIT, with attribution), Indian PII detectors with validators, hidden-Unicode classes, the redaction placeholder convention, and a reference TS matcher.

**Kit 0.2 (also inside the web wave):**
- **K3 Evidence bundle:** manifest, verify CLI and static verify page.
- **K2 Approvals:** the WebAuthn signer profile and the verification algorithm.
- **K6 India data v1:** regulation registry, CERT-In clock, retention, NTP sources. K6 is mostly data and can land whenever its first consumer needs it.

The order inside the web wave follows which web project goes first (§6, §8 Q3). **If Baton is first, K2 moves into 0.1**, because Baton Phase 1 needs a passkey-signed gate on day one.

**Deferred until a consumer exists:** C# bindings (first desktop project, or Hearth H1 Windows agent), Kotlin bindings (first Android project, or Hearth H3), K7 webhooks (when OpsDesk or Pagerline needs the handoff).

---

## 3. Component contracts

### 3.0 Cross-cutting decisions (apply to every component)

**Algorithms (closed allowlist, no negotiation):**

| Use | Algorithm | Why |
|---|---|---|
| Digests | **SHA-256** | Universal, in every platform library, already used by every brainstorm |
| Human approvals and device identity keys (hardware-bound) | **ECDSA P-256 with SHA-256** (`ES256`) | P-256 is the one curve the hardware supports everywhere this programme runs: Windows TPM 2.0 through the Microsoft Platform Crypto Provider, Android Keystore / StrongBox, and every WebAuthn platform authenticator (ES256 is the default COSE algorithm). Ed25519 support in TPMs, StrongBox and WebAuthn authenticators is patchy (UNVERIFIED per device, including the Nord CE 5) |
| Software keys: servers, CI, offline signers (evidence manifests, audit checkpoints, rule packs, policy bundles, pins) | **Ed25519** (RFC 8032, pure) | Deterministic (no per-signature random nonce that can fail), fast, small, and already chosen by Hearth, TriageKit, Baton, Quorum and Watchtower. Available in WebCrypto and Cloudflare Workers (exact runtime versions UNVERIFIED). **.NET has no built-in Ed25519 as of .NET 10 (UNVERIFIED; secondary sources only)**, so C# uses BouncyCastle.Cryptography (MIT). Kotlin uses BouncyCastle or Tink |
| Webhooks (K7 only) | HMAC-SHA256 (Standard Webhooks `v1`), optional Ed25519 (`v1a`) | Adopt an existing spec rather than invent one |
| Evidence-file encryption (TriageKit, LureLens) | X25519 "age-style", **project-owned** | Not in the kit. K3 records only that a file is encrypted and hashes the ciphertext |

- **Never:** RSA, P-384, secp256k1, SHA-1, MD5, algorithm fields that a verifier "tries".
- **Why not P-256 everywhere?** That would mean one algorithm and less code. But ECDSA needs a good random nonce per signature (or RFC 6979), and its signatures are not byte-reproducible, which makes cross-language vectors weaker. Ed25519 for software keys gives byte-identical vectors in all three languages. Two algorithms is the agreed maximum.
- **Windows approvals use WebAuthn** (Windows Hello, through the Windows WebAuthn API, `webauthn.dll`) rather than `KeyCredentialManager`. Windows Hello's `KeyCredentialManager` keys are reported to be RSA-2048 (UNVERIFIED), which would break the one-curve rule. The WebAuthn route gives an ES256 key protected by Windows Hello and the **same verification code path as Baton's browser approvals**. Whether a desktop app can call the Windows WebAuthn API with a stable origin and RP ID, and which .NET wrapper to use, is **UNVERIFIED** (spike in GPO Ledger P2). Fallback: a TPM P-256 key via the Platform Crypto Provider with a UI-consent policy (the `windows-tpm` profile).

**Reference libraries (licences and maintenance UNVERIFIED until checked in the kit's first session):**
- **TS:** `@noble/curves` + `@noble/hashes` (MIT, pure JS; runs the same in browser, Node and Workers, which matters for the verify page). WebCrypto is allowed where available. `@simplewebauthn/server` (MIT) for WebAuthn assertion parsing, or a minimal own verifier (Workers compatibility UNVERIFIED).
- **C#:** `System.Security.Cryptography` (`ECDsa` with `DSASignatureFormat`, `SHA256`), BouncyCastle.Cryptography (Ed25519), and an own JCS writer over `System.Text.Json`.
- **Kotlin:** JCA `SHA256withECDSA`, BouncyCastle or Tink (Ed25519), `kotlinx.serialization` with an own canonical writer. **Pure JVM, no Android dependencies**, so it also runs in Stockroom's broker, Surface's CLI and CI.

**Encodings (all components):**
- Binary values: **base64url without padding** (RFC 4648 §5).
- Digests: string `"sha256:" + 64 lowercase hex characters`.
- Public keys in JSON: **JWK** (RFC 7517; Ed25519 per RFC 8037 `{"kty":"OKP","crv":"Ed25519","x":…}`; P-256 `{"kty":"EC","crv":"P-256","x":…,"y":…}`).
- **Key ID (`kid`):** `"sha256:" + hex(SHA-256(JCS(public JWK with only the required members)))`, i.e. the RFC 7638 thumbprint member set, hashed with SHA-256 and hex-encoded.
- **ECDSA signature bytes:** in kit envelopes, **IEEE P1363** (`r‖s`, exactly 64 bytes). Android Keystore and JCA output DER, and .NET defaults to P1363, so bindings MUST convert. **Exception:** inside the WebAuthn profile the authenticator's DER signature is stored as-is, because WebAuthn defines it.
- Signature bytes MUST NOT be used as identifiers (ECDSA malleability). Identify by payload digest.
- **Timestamps:** strings, RFC 3339, UTC, exactly millisecond precision with `Z`: `2026-10-28T09:15:02.123Z`. Display layers show IST next to UTC (TriageKit, Baton, Pagerline already do).
- **Calendar dates** (effective dates): `YYYY-MM-DD`, interpreted in the time zone named by the pack (`"tz": "Asia/Kolkata"` for Indian packs).
- **IDs:** UUIDv7 strings for records. Nonces: 16 random bytes, base64url.

**Domain separation (prevents a signature made for one purpose being replayed as another):** every signature covers a **type string** (for example `pk.audit.checkpoint`) as well as the payload (see K0).

**Fail closed:** every verifier returns `valid` only if every check passes. Unknown spec major version, newer minor version, unknown algorithm or unknown type → invalid, with a stable error code (for example `PK_SIG_UNKNOWN_ALG`). Error codes are part of the contract and appear in vectors.

### 3.1 K0 Core: canonical JSON, digests, signed envelope

**Purpose:** one way, in three languages, to turn a JSON object into bytes, hash it and sign it.

**Canonical JSON = RFC 8785 (JCS) with a stricter kit profile ("pk-JCS"):**
1. Input is I-JSON (RFC 7493): valid UTF-8, no duplicate member names, no lone surrogates.
2. **Numbers: integers only**, in the range ±(2^53 − 1), written without exponent or fraction. Money, decimals, versions and anything fractional are **strings**. *Reason:* JCS number formatting (ECMAScript double-to-string) is the part most often implemented wrongly. Banning non-integers makes the three implementations small and exact.
3. **No `null`.** Absent optional fields are omitted. *Reason:* "null vs missing" produces two hashes for the same meaning.
4. Member ordering follows JCS: sort by **UTF-16 code units** (not code points). Vectors include keys outside the Basic Multilingual Plane (emoji) and keys near U+FFFF, where code-unit and code-point order differ.
5. Strings are hashed exactly as given; the canonicaliser does no Unicode normalisation. Producers MUST NFC-normalise file paths and SHOULD NFC-normalise human-entered text before hashing.
6. Booleans and arrays behave as in JCS. Array order is significant.

**Digest of an object:** `digest(obj) = "sha256:" + hex(SHA-256(UTF8(pkJCS(obj))))`.

**Signed envelope (`pk-sig/1.0`):**
```json
{
  "spec": "pk-sig/1.0",
  "type": "pk.evidence.manifest",
  "payload": { "...": "the signed object (pk-JCS rules apply)" },
  "signatures": [
    { "kid": "sha256:…", "alg": "Ed25519", "role": "producer", "sig": "base64url" }
  ]
}
```
- **Signing input (PAE, in the style of DSSE):** `M = UTF8("pk-sig/1\n" + type + "\n") ‖ SHA-256(UTF8(pkJCS(payload)))`. The SHA-256 is the raw 32 bytes.
- `alg = "Ed25519"`: sign `M` directly.
- `alg = "ES256"`: ECDSA P-256 over `M` with SHA-256 (the platform's normal `SHA256withECDSA`); signature in P1363.
- `alg = "webauthn-ES256"`: the WebAuthn `challenge` = base64url(SHA-256(`M`)). The signature entry carries `authenticatorData`, `clientDataJSON` and `signature` (DER), all base64url (verification in K2).
- `type` MUST be on the verifier's allowlist for the context. Each type has its own allowed algorithms (for example `pk.approval.decision` allows `webauthn-ES256` and `ES256`, never `Ed25519`).
- Multiple signatures are allowed (co-sign, countersign). `role` is a free string interpreted by the verifier's policy (for example `collector`, `analyst`, `supervisor`, `approver`).
- The verifier needs the public key from **a trust source it already holds** (pinned registry, published key list, or the embedded key shown to the user as a fingerprint). An envelope never "brings its own trust".

**Bindings:** TS (0.1), C#, Kotlin. Each exposes about six functions: `canonicalize`, `digest`, `kidOf`, `signEd25519`, `verify(envelope, trustedKeys, policy)`, and helpers to convert P1363 to and from DER.

**Vectors (`vectors/k0/`):** canonicalisation (ordering, escapes, Unicode, integers at the ±2^53−1 boundary, rejected floats/null/duplicates/lone surrogates), digests, kids, Ed25519 signatures with published **test keys** (byte-identical in all languages), ES256 verify-only vectors (DER and P1363 forms), and negatives: wrong type, wrong kid, flipped payload byte, unknown alg, alg not allowed for type, truncated signature.

### 3.2 K1 Audit chain (`pk-audit/1.0`)

**Purpose:** an append-only log where any edit, deletion or reordering is detectable, given an anchored checkpoint.

**Event:**
```json
{
  "spec": "pk-audit/1.0",
  "chain": "roster:tenant:0192f…",
  "seq": 41,
  "prev": "sha256:…(hash of event 40; genesis uses sha256:000…000)",
  "ts": "2026-10-28T09:15:02.123Z",
  "actor": { "kind": "human|agent|service|device", "id": "…", "display": "…" },
  "action": "roster.leaver.access_removed",
  "target": { "kind": "account", "id": "…" },
  "data": { "...": "product-defined, pk-JCS rules" },
  "reason": "optional free text",
  "refs": [ { "kind": "pk.approval.decision", "digest": "sha256:…" } ]
}
```
- `hash(event) = digest(event)`, stored next to the event, never inside it.
- `seq` starts at 0, has no gaps, and increases by exactly 1. `prev` of event *n* = hash of event *n − 1*.
- `action` names are namespaced (`<product>.<area>.<verb>`). The kit reserves `pk.*` (for example `pk.audit.pruned`, `pk.audit.key_rotated`).
- **Personal data rule:** events carry **IDs and digests, not raw personal data or secrets**. Personal details live in normal tables, which can be erased. *Reason:* DPDP erasure duties and CERT-In retention cannot both be met by an immutable log that holds personal data. Medfold and other on-device logs follow the same rule.

**Checkpoint:** a signed envelope, type `pk.audit.checkpoint`, payload `{chain, seq, head (hash of event seq), ts, count}`, signed Ed25519 by the chain's service key (or ES256 by a device key on phones).
- Written every N events and at least daily (N set by the product).
- **A hash chain alone proves nothing against someone who can rewrite the whole table. Checkpoints must be anchored somewhere the attacker does not control.** Per-product anchors already in the brainstorms:
  - GPO Ledger: daily checkpoint hash written to the Windows Event Log, forwarded to the SIEM.
  - Baton: hashes in the repo's signed `.baton/snapshot.md`.
  - MCP Watchtower: the public transparency log.
  - TriageKit: countersigned at import by the analyst key.
  - Roster, Quorum and Hearth: included in every evidence bundle, and optionally emailed to the tenant owner.

**Pruning (CERT-In 180-day rolling retention, Hearth / Baton / Pagerline):** deleting events below `seq = k` is allowed only after a checkpoint at `k − 1` exists. A `pk.audit.pruned` event records `{up_to_seq: k−1, checkpoint_digest}`. Verifiers then start from that checkpoint as the trust anchor instead of genesis.

**Append rules for implementers (common bugs):**
- `seq` assignment MUST be serialised per chain: Postgres advisory lock or a `SERIALIZABLE` transaction; one Durable Object per chain on Cloudflare (Baton already plans this); a single writer in SQLite.
- The database role used by the app MUST NOT be able to `UPDATE` or `DELETE` audit rows (Postgres: an insert-only grant plus a trigger that rejects updates and deletes).

**Verification algorithm:** given events (sorted by `seq`) and trusted checkpoints:
1. Recompute every hash.
2. Check `prev` links and `seq` continuity.
3. Check that each checkpoint's `head` equals the recomputed hash at its `seq`, and verify its signature against the trusted key.
4. Report the first failing `seq` with an error code (`PK_AUDIT_HASH_MISMATCH`, `PK_AUDIT_SEQ_GAP`, `PK_AUDIT_CHECKPOINT_MISMATCH`, `PK_AUDIT_UNANCHORED_TAIL`).

Events after the last checkpoint are reported as "intact but not yet anchored", never as fully verified.

**Export format:** JSON Lines, one `{"event": {...}, "hash": "sha256:…"}` per line, plus checkpoint envelopes. This is the same file as TriageKit's `custody.jsonl`, LureLens's case log and Stockroom's audit export.

**Bindings:** TS (0.1), C# (GPO Ledger, AuthSunset, TriageKit, Purple Proof, Countersign, LeakSweep, Hearth agent), Kotlin (Pagerline, Stockroom, LureLens, Surface, Medfold, NetScope, Hearth agent).

**Vectors:** valid chains (with and without pruning), each tamper type (edit data, delete middle, reorder, truncate tail, forge checkpoint, wrong checkpoint key, seq gap), and the personal-data lint (an event containing an Aadhaar-like number fails the K5 lint in tests).

### 3.3 K2 Approvals, "two hands" (`pk-approval/1.0`)

**Purpose:** a dangerous action happens only when an authorised human (or second device) has signed a statement about **exactly that action**. The **enforcement point checks the signature itself**, so a compromised server or a flipped database row cannot approve anything. (Baton, GPO Ledger and Hearth all state this property.)

**Objects (all signed envelopes or plain pk-JCS objects):**

*ApprovalRequest* (plain object; its digest is what gets approved):
```json
{
  "spec": "pk-approval/1.0",
  "id": "uuidv7",
  "realm": "baton:project:…",
  "action": "baton.git.push_protected_ref",
  "subject": {
    "kind": "git-commit",
    "digest": "sha256:… (or the native id, e.g. commit SHA, inside attributes)",
    "attributes": { "repo": "…", "ref": "refs/heads/main", "sha": "…" }
  },
  "display": { "title": "Push 3 commits to main", "risk": ["main", "force-push"] },
  "requester": { "kind": "agent", "id": "claude-code:client:…" },
  "created_at": "…Z",
  "expires_at": "…Z",
  "nonce": "base64url(16 bytes)",
  "policy": { "registry_version": 7, "min_approvals": 1, "distinct_from_requester": true },
  "window": { "opens_at": "…Z", "closes_at": "…Z" }
}
```
- `action` comes from a **closed, namespaced list per product** (Hearth `ResponseAction`, GPO Ledger change types, Baton gates). Unknown action → deny.
- `display` MUST be computed by the system that observed the action (Baton's server or hook, the GPO Ledger diff engine, the Hearth agent), **never copied from the requesting agent's own summary** (Baton §7).
- `expires_at − created_at` ≤ the policy maximum (default 10 minutes; production windows use `window`, default 30 minutes, per Baton).
- **Matching code:** `code = (first 4 bytes of SHA-256(pkJCS(request)) as big-endian uint32) mod 1 000 000`, shown zero-padded to 6 digits on both the requesting screen (terminal, PC) and the approving screen (phone). Both compute it independently. Number matching against approval fatigue (Hearth, Baton).

*ApprovalDecision:* a signed envelope, type `pk.approval.decision`:
- Payload: `{spec, request_digest, decision: "approve"|"deny", decided_at, approver_id, reason?}`.
- Signed by the approver key. Allowed algs: `webauthn-ES256` and `ES256` only.

*ApproverRegistry:* a signed envelope, type `pk.approval.registry`:
- Payload: `{realm, version (monotonic integer), approvers: [{id, display, kid, jwk, profile, roles, added_at, webauthn?: {rp_id, origins[], credential_id, backup_eligible, backup_state}}], break_glass: [{code_digest, used: false}], max_ttl_seconds}`.
- **Changes to the registry MUST be signed by an existing approver** (except the very first registry, established by an owner ceremony). A compromised server therefore cannot add its own key (Hearth §3b, Baton `approvers.json`).
- Enforcement points pin the registry. Examples: Baton keeps `.baton/approvers.json` in the repo, the Hearth policy bundle carries approver keys, GPO Ledger's Applier keeps a local store.

**Signer profiles (all P-256):**

| Profile | Where | Key creation rules |
|---|---|---|
| `webauthn` | Browsers / PWAs (Baton, Roster P3, Pagerline console, Quorum if used); Windows desktop via the Windows WebAuthn API (GPO Ledger, AuthSunset; UNVERIFIED, see §3.0) | User verification **required** (`UV=1`, `UP=1`). Attestation `none` accepted. Record the backup-eligible / backup-state flags at registration |
| `android-keystore` | Hearth approver (H5), Pagerline phone approvals (P2) | `EC secp256r1`, `PURPOSE_SIGN`, SHA-256, `setUserAuthenticationRequired(true)` with per-operation strong biometric (`BiometricPrompt` + `CryptoObject`), StrongBox if present (else TEE), invalidated on biometric enrolment change. Key attestation chain stored at registration; Hearth verifies it server-side |
| `windows-tpm` | Fallback for Windows approvals; Hearth Windows device identity (not approvals) | Microsoft Platform Crypto Provider, `ECDSA_P256`, non-exportable. A software CNG fallback MUST be flagged `"hardware": false` and shown as weaker (Hearth §3b) |

**Verification algorithm (at the enforcement point; MUST run there, not only on a server):**
1. **Registry:** signature chain valid; `version` ≥ the highest version this verifier has seen (anti-rollback).
2. **Request:** recompute `subject.digest` (or native ID) **from the thing about to be done**: the commit SHA being pushed, the diff hash about to be applied, the response action about to run. Mismatch → deny. *This step is the whole point; skipping it makes the signature decorative.*
3. **Decision:** `request_digest` = digest of the recomputed request; signature valid under a registry key; `decision == "approve"`.
4. **Distinct people:** count distinct `approver_id` values (not kids) ≥ `min_approvals`. If `distinct_from_requester`, approver identity ≠ requester's human identity. GPO Ledger and AuthSunset compare AD SIDs (product-supplied identity mapping).
5. **Time:** `created_at − 5 min ≤ now ≤ expires_at + 5 min` (±5 min skew, as Hearth specifies). Inside `window` if present.
6. **Single use:** `id` not in the verifier's consumed-ID store; record it on use. Offline verifiers (baton-gate) keep a local store. Replay against *another* verifier is limited by subject binding plus short expiry. This limit is stated in the threat model.
7. **WebAuthn checks** (profile `webauthn`):
   - `clientDataJSON.type == "webauthn.get"`;
   - `challenge` matches;
   - `origin` ∈ registered origins;
   - `rpIdHash` matches SHA-256(rp_id);
   - UP and UV flags set;
   - signature over `authenticatorData ‖ SHA-256(clientDataJSON)` verifies with the registered key;
   - `signCount` checked only if non-zero and only by online verifiers (synced passkeys report 0).
8. **Default deny** on any failure, on timeout, or if the verifier cannot reach required state (Baton "fail closed").
9. **Break-glass:** a one-time recovery code (≥ 80 bits of entropy, so plain SHA-256 storage is acceptable) whose digest is in the registry. Use is single, logged as a K1 event (`pk.approval.break_glass_used`) and alarmed.
10. Every approve and deny produces a K1 audit event whose `refs` carries the decision digest.

**Solo fallback ("two hands" without a second person):** hold-to-confirm plus biometric plus typed reason plus undo window (Pagerline's two-hands list, Countersign, LeakSweep). This is the UX pattern in `docs/patterns/two-hands-ux.md`, not K2. It MUST be labelled in logs as `"assurance": "single-person"`.

**Honest limits (written into the spec):**
- **Synced passkeys** (Google Password Manager, Windows Hello with sync, iCloud) are **not device-bound**: anyone holding the user's cloud account plus a device PIN could approve. Policy can require `backup_state == false` or the `android-keystore` profile for high-assurance realms (§8 Q4).
- An attacker who controls the enforcement point (for example, local admin on the PC running baton-gate) can skip verification. K2 protects against a compromised server or requester, not a compromised verifier.

**Bindings:**
- TS: 0.2, or 0.1 if Baton goes first. Verify all profiles; build requests; WebAuthn client helpers for PWAs.
- C#: GPO Ledger P2 / AuthSunset P2 / Hearth agent H5. Verify all profiles.
- Kotlin: Hearth H5 / Pagerline P2. Sign via Keystore; verify.

**Vectors:** each profile valid; tampered subject; decision for a different request; expired; replayed ID; approver equals requester; registry rollback; registry change not signed by an existing approver; wrong origin / rpId; UV flag off; unknown action; break-glass reuse.

### 3.4 K3 Evidence bundle and verify page (`pk-evidence/1.0`)

**Purpose:** one format, so that any portfolio product's pack can be checked by one verifier: a static web page, a CLI, or a library call.

**Layout** (folder or zip; zip entries MUST NOT contain `..`, absolute paths or symlinks):
```
pk-bundle.json        ← signed envelope, type "pk.evidence.manifest"
custody.jsonl         ← K1 export (optional for simple packs, required for cases)
files/…               ← evidence, reports, data
timestamps/…          ← optional RFC 3161 tokens
```

**Manifest payload:**
```json
{
  "spec": "pk-evidence/1.0",
  "bundle_id": "uuidv7",
  "profile": "roster.offboarding-record",
  "created_at": "…Z",
  "producer": { "product": "roster", "version": "0.3.1", "instance": "https://…", "build": "sha256:…" },
  "title": "Leaver check: Priya S., 2026-10-24",
  "files": [
    { "path": "files/report.pdf", "size": 182331, "sha256": "sha256:…", "media_type": "application/pdf", "role": "report" },
    { "path": "files/ev/001.bin", "size": 4096, "sha256": "sha256:… (of ciphertext)", "role": "evidence", "encrypted": { "scheme": "age-x25519" } }
  ],
  "custody": { "path": "custody.jsonl", "chain": "…", "head": "sha256:…", "seq": 57 },
  "mappings": [ { "control": "in.sebi.cscrf/PR.AA-…", "catalogue": "pk.india.controls@1.2.0", "note": "supports evidence for" } ],
  "redactions": { "applied": true, "detectors": ["pk.pii.in.aadhaar", "pk.secret.razorpay.key_secret"], "count": 3 },
  "timestamps": [ { "kind": "rfc3161", "tsa": "…", "path": "timestamps/manifest.tsr" } ],
  "disclaimer": "Control mapping to help your auditor, not legal advice."
}
```
- `profile` is product-namespaced. Profiles may require extra files or fields (for example `triagekit.case` requires `collector.json` and custody; a `bsa-s63` annex adds a certificate draft). Profiles are documented in each product. The kit validates only the common part.
- `mappings[].control` IDs come from the K6 control catalogue, with its version pinned.
- Encrypted files are verified as ciphertext. Verifying never needs decryption keys.

**What "valid" means (shown in plain English on every verifier):**
1. The manifest signature verifies.
2. Every listed file is present, with matching size and SHA-256.
3. No unlisted files (or listed as a warning).
4. The custody chain verifies and its head matches the manifest.
5. Timestamps verify, if present (RFC 3161 verification in TS: library UNVERIFIED; may be a v1.1 feature).
6. Which key signed it: the key's fingerprint and, if known, its owner from a **trust list** (for example "Roster hosted demo instance key, published at …"). If the key is unknown: "signed by an unknown key; compare this fingerprint with the one the sender published".

Every verifier also states the limit: *"A valid signature proves who signed this and that it has not changed since. It does not prove the contents are true."*

**Verify page:**
- A **static single-page app** (HTML + JS, built from the TS binding) hosted free on Cloudflare Pages (one shared page, for example `verify.<portfolio-domain>`; domain TBD in branding). The same build is embeddable by any product and works **offline when saved**.
- Files are read locally with the File API and **never uploaded**. No analytics.
- Streaming SHA-256 for large files (WebCrypto has no streaming digest; use `@noble/hashes` or `hash-wasm`; UNVERIFIED performance on multi-GB TriageKit cases. The page may refuse files above a limit and point to the CLI).
- It also verifies single signed documents (any `pk-sig` envelope of a known type, for example Watchtower pins, Baton snapshot signatures, Quorum minute-book exports).
- Trust lists are JSON files shipped with the page, one per product instance, each signed by the kit maintainer key. Products may also publish their own `/.well-known/pk-keys.json` (UNVERIFIED naming; decide in K3 work).
- Shows SHA-256 values and the algorithm in a copyable form, because a BSA s.63 certificate needs the hash value and algorithm (TriageKit, LureLens).

**CLI:** `pk-verify` (Node, from the TS binding) for big bundles and CI. TriageKit's `tk-verify` becomes a thin C# wrapper over the C# binding with the `triagekit.case` profile.

**Bindings:** TS 0.2 (page + CLI + library); C# (TriageKit P1 is the first desktop consumer; GPO Ledger, AuthSunset, Purple Proof); Kotlin (LureLens P2, Surface P2, Stockroom, NetScope, Pagerline).

**Vectors:** valid bundles (plain, encrypted files, with custody, multi-signature), missing file, extra file, size mismatch, hash mismatch, custody head mismatch, zip-slip path, wrong manifest type, unknown profile (passes the common checks with a warning).

### 3.5 K4 Rule-pack format (`pk-rulepack/1.0`)

**Purpose:** every rule a product applies (legal deadline, regulatory clock, secret format, detection, control mapping, reference data) carries **source, version and effective date**, has tests, and changes as data with history. This is the India pack's rule (§ header of `india-compliance-pack.md`).

**Authoring vs shipping:** rules are **authored in YAML** in the repo that owns them (readable for agents and reviewers) and **compiled to JSON** by the kit's build tool. **Products consume only the compiled JSON**, never YAML. *Reason:* YAML parsers differ across languages (YAML 1.1 vs 1.2: `no` → false, unquoted dates). The compiler rejects YAML features outside a safe subset (anchors, tags, implicit dates).

**Pack manifest (`pack.json`, a signed envelope of type `pk.rulepack` when distributed outside the app binary):**
```json
{
  "spec": "pk-rulepack/1.0",
  "id": "pk.secrets.india",
  "kind": "secret-detection",
  "version": "1.3.0",
  "released_at": "…Z",
  "tz": "Asia/Kolkata",
  "licence": "MIT",
  "attribution": ["Portions adapted from gitleaks (MIT), https://github.com/gitleaks/gitleaks"],
  "sources": [
    { "id": "razorpay-docs-keys", "title": "…", "publisher": "Razorpay", "url": "…", "retrieved_at": "2026-11-02", "doc_version": "…", "doc_sha256": "sha256:… (optional)" }
  ],
  "files": [ { "path": "rules.json", "sha256": "sha256:…" }, { "path": "tests.json", "sha256": "sha256:…" } ],
  "min_engine": "pk-rulepack/1.0"
}
```
- `kind` (closed list, extendable by minor version): `secret-detection`, `pii-detection`, `untrusted-text`, `regulatory-obligation`, `incident-clock`, `retention`, `control-catalogue`, `scam-pattern`, `risk-rule`, `sigma-bundle` (wraps Sigma YAML unchanged and adds metadata), `reference-data` (brand lists, lab profiles, analyte dictionaries).

**Common rule fields (every rule, every kind):**

| Field | Meaning |
|---|---|
| `id` | Stable, namespaced (`pk.secret.razorpay.key_secret`, `quorum.in.mca.dir3kyc`) |
| `rev` | Integer revision, +1 on any change |
| `title`, `description` | Plain English |
| `status` | `experimental` / `stable` / `deprecated` / `withdrawn` |
| `verified` | `{state: "verified" \| "unverified", by, at, note}`. **This is the machine form of the programme's UNVERIFIED rule.** Products MUST show unverified rules as such, or not apply them, per product policy |
| `source_refs` | `[{source_id, locator}]`, where locator = section, clause, page or anchor |
| `effective_from` / `effective_until` | Calendar dates in the pack's `tz`; `effective_until` optional |
| `changes` | `[{rev, date, summary, source_ref}]`, the visible "rules changed" history (Quorum) |
| `tags` | Free |
| `body` | Kind-specific (below) |

- **"As of" selection:** several revisions of one rule may coexist with non-overlapping effective windows. Engines select the revision whose window contains the **event date**, not today. Example: DIR-3 KYC annual before 31 Mar 2026, triennial from then.
- **Tests:** every rule has at least one positive and one negative test in `tests.json` (`{rule_id, input, expect}`). The kit validator runs them in each language binding's CI. Products that own packs run the same validator in their CI.
- **Signing and anti-rollback:** packs fetched or updated at runtime (LureLens P3, Surface, Hearth Sigma pack) MUST be signed (Ed25519) and MUST be refused if their `version` is lower than the installed one (LureLens §7, Surface §7, Hearth).

**Kind bodies defined by the kit in 1.0:** `secret-detection`, `pii-detection`, `untrusted-text` (K5); `incident-clock`, `retention`, `control-catalogue` (K6); `regulatory-obligation` (a generic deadline rule: trigger event or fixed date, offset, recurrence, applicability conditions; used first by Quorum). Other kinds are defined by the product that first needs them, then upstreamed if a second product adopts them.

**Bindings:** a TS compiler and validator (0.1). Validators (load, schema-check, as-of selection, run tests) in C# and Kotlin when those bindings start.

### 3.6 K5 Detection packs: secrets, Indian PII, hidden text

**Purpose:** LeakSweep (C#), ShipGate and Baton (TS), Surface (Kotlin), OpsDesk and Hearth flag and redact **the same things the same way**. The brainstorms already agreed to share these "as data files, not code" (LeakSweep §10, Baton §2a). The kit adds a small reference matcher in TS so the two web projects do not write it twice.

**Packs (MIT):**
1. `pk.secrets.global`: a subset ported from gitleaks rules (MIT, attribution kept). **Never copy TruffleHog** (AGPL; LeakSweep §10).
2. `pk.secrets.india`: v1 holds only formats verified against provider docs and real **test-mode** keys: Razorpay, Cashfree, MSG91 (keyword-anchored), Zoho, Instamojo. Others (Paytm, PhonePe, PayU, Juspay, Gupshup, Exotel, Fast2SMS, Shiprocket, IDfy, Signzy, Digio, Setu) are added as `experimental` until verified. All formats in the brainstorms are **UNVERIFIED** today.
3. `pk.pii.india`: Aadhaar-like (12 digits, first digit 2–9, **Verhoeff checksum**), PAN (5 letters + 4 digits + 1 letter, 4th letter = holder type), +91 mobile (`[6-9]` + 9 digits, with optional +91 / 0), UPI ID (`handle@psp`, with a PSP handle list as reference data), IFSC (4 letters + `0` + 6 alphanumerics), GSTIN (15 characters with checksum), plus email. ABHA number / address added when Medfold P3 needs them. All structure rules **UNVERIFIED against UIDAI / Income Tax / NPCI / RBI / GSTN primary docs**.
4. `pk.untrusted-text`: hidden and confusable characters (zero-width, bidi controls, Unicode tag block U+E0000–E007F, invisible separators) and a small set of injection-phrase heuristics. Used by Baton, Watchtower and OpsDesk. Each project's quarantine and verdict logic stays its own.

**`secret-detection` rule body:**
```json
{
  "provider": "razorpay",
  "secret_kind": "secret|public_id|token|private_key",
  "environment": "live|test|unknown",
  "regex": "RE2-subset pattern",
  "secret_group": 1,
  "keywords": ["rzp_"],
  "entropy_min": 3.5,
  "pair_with": { "rule": "pk.secret.razorpay.key_id", "within_chars": 200 },
  "allow": ["regexes for known false positives"],
  "severity": "critical|high|medium|low",
  "personal_data_reach": "plain text: what a misused key could read (DPDP label, LeakSweep §6b)",
  "rotation_url": "https://…"
}
```
- Rules MUST say which strings are **public identifiers** (for example a Razorpay `key_id`, meant for the browser) and which are secrets. Live ranks above test (ShipGate §6b, LeakSweep §6b).
- **Liveness checks are not in the kit.** They are network calls with consent rules, owned by LeakSweep's Verify assembly.
- An **exporter to gitleaks TOML** is included, for LeakSweep's gitleaks-compatible engine and for the upstream offer to gitleaks (LeakSweep §14 Q5, accepted).

**`pii-detection` rule body:** `{pii_type, regex, validator: "verhoeff"|"gstin"|"pan_structure"|"none", context_keywords, mask: {store: "never"|"masked"|"encrypted", display: "last4"|"none"}, severity}`. Validators are named functions implemented in every binding, with vectors (valid and invalid Verhoeff numbers, GSTIN checksums).

**Regex dialect, the main cross-language risk:**
- Patterns MUST use an **RE2-compatible subset**: no lookahead or lookbehind, no backreferences, no possessive or atomic groups; flags limited to `i`, `m` and `s`.
- Engines: JS (`RegExp` with the `u` flag), .NET (`RegexOptions.NonBacktracking`, with a match timeout as a second guard), Kotlin/JVM (`java.util.regex` with a timeout wrapper, or re2j; UNVERIFIED choice).
- The kit CI compiles every pattern in all three engines and runs every test in each. It also rejects patterns with nested quantifiers, as a ReDoS lint (tool UNVERIFIED).

**Redaction convention (shared output format):** `[REDACTED:<rule_id_short>:…<fp4>]`, for example `[REDACTED:github_pat:…a1f3]` (Baton §7).
- `fp4` = first 4 hex characters of **HMAC-SHA256(installation secret, value)**, a keyed fingerprint (LeakSweep's "keyed fingerprint"), so short or low-entropy secrets cannot be brute-forced from the placeholder.
- PII placeholders use `pii_type` (`[REDACTED:aadhaar]`). **Aadhaar never gets a fingerprint and is never stored** (India pack, UIDAI rule).

**Test values (a real trap):**
- Positive test strings MUST be synthetic or provider-published examples. **Never real keys, even test-mode ones.**
- Because GitHub push protection and secret scanning will flag realistic-looking tokens once a repo is public (and could block pushes), test strings that match real formats are **stored split or encoded** (for example concatenated at test runtime), the way gitleaks generates its test secrets.
- Exact push-protection behaviour for Free accounts on public and private repos is **UNVERIFIED**.

**Reference TS matcher (0.1):** keyword prefilter → regex → secret-group extraction → entropy → validator → allowlist → pair check → severity. Output `{rule_id, start, end, fingerprint, masked_preview}`. It never returns or logs the raw value unless the caller asks explicitly. C# (LeakSweep) and Kotlin (Surface) use their own engines but must pass the same `tests.json`.


### 3.9 Docs-only parts of the kit (`docs/patterns/`)
`two-hands-ux.md` (timings, consequence wording, typed-confirm rules, matching code display, undo windows, what gets logged as K1 events), `ownership-proof.md`, `cross-tenant-tests.md`, `redact-before-ai.md`, `key-ceremony.md` (offline root keys, backup, rotation using `pk.audit.key_rotated` and registry versions; Hearth and TriageKit need it), and `threat-model-kit.md` (the kit's own STRIDE).

### 3.10 Licence and versioning (all components)

**Licence:** **MIT** for everything in the kit: code, specs, schemas, vectors and rule data. This follows the programme rule (MIT for small kits) and the accepted LeakSweep decision (India rule pack MIT). AGPL products may depend on it freely. Third-party content keeps its attribution in `NOTICE` (gitleaks rules: MIT). Nothing AGPL or non-commercial (TruffleHog, abuse.ch data, Echap) enters the kit.

**Versioning, on three levels:**
1. **Kit release:** one semver for the whole monorepo (tag `vX.Y.Z`; all bindings and data released together). `CHANGELOG.md` lists spec, binding and pack changes separately.
2. **Spec version inside every object** (`"spec": "pk-audit/1.0"`):
   - A major change is incompatible.
   - A minor change adds optional fields only.
   - Verifiers **reject** an unknown major and a minor newer than they know ("upgrade your verifier"). This is fail closed, consistent with `additionalProperties: false` in schemas.
   - **Verifiers MUST keep verifying every older minor of a major forever**, and the verify page MUST keep old majors' verifiers. Evidence must stay checkable for years (audits, BSA).
3. **Rule packs:** own semver, plus a per-rule `rev` and effective dates. Packs are released independently of code, inside kit releases.

**Change procedure (the Hearth rule, generalised):** a contract change lands in the kit **first**, with new vectors, then in bindings, then in products. No product may change a kit format locally.

### 3.11 Golden vectors and cross-language CI

- **Layout:** `vectors/<component>/<case>.json`, one case per file:
  ```json
  {"suite":"pk-audit/1.0","id":"audit-tamper-delete-middle","description":"…","input":{…},"expect":{"valid":false,"error":"PK_AUDIT_SEQ_GAP","at_seq":12}}
  ```
  Binary inputs sit in sibling files referenced by path and SHA-256.
- **Test keys:** in `vectors/keys/`, each clearly named `TEST-ONLY`. Every product's CI MUST fail if a test `kid` appears in a production trust list or registry.
- **Who generates what:** the TS reference generates vectors. C# and Kotlin **independently** verify them, and also re-produce the byte-identical outputs (canonical bytes, digests, Ed25519 signatures, matching codes). ES256 vectors are verify-only (signatures are randomised).
- **CI (kit repo):** three workflows (`ts.yml`, `dotnet.yml`, `kotlin.yml`), all on **Ubuntu runners**, each loading the whole `vectors/` tree. .NET and the JVM run fine on Linux, and Windows / macOS runners are reported to consume minutes at a multiplier (UNVERIFIED for 2026 pricing). GitHub Free gives **2,000 Actions minutes per month for private repos** (verified 2026-10-28, GitHub plans page); public repos are not limited.
- A binding is "done" only when it passes 100% of vectors for its components. Products run the kit's vectors for the kit version they vendor, as a drift check (§4).

---

## 4. Repo layout and how projects consume the kit

### 4a. One monorepo (recommended over several repos)
```
platform-kit/
  README.md  LICENSE (MIT)  NOTICE  CHANGELOG.md  SECURITY.md
  spec/            k0-core.md k1-audit.md k2-approval.md k3-evidence.md k4-rulepack.md k5-detection.md k6-india.md k7-webhook.md
  schemas/         JSON Schema 2020-12, one per object type (additionalProperties:false)
  vectors/         keys/ k0/ k1/ k2/ k3/ k4/ k5/ k6/
  rules/           secrets-global/ secrets-india/ pii-india/ untrusted-text/ india/   (YAML sources)
  dist/            compiled JSON packs (built, committed on release)
  packages/
    ts/            one npm package, subpath exports: /core /audit /approval /evidence /rulepack /detect
    dotnet/        one solution: PlatformKit (single assembly first; split only if a consumer needs it)
    kotlin/        one Gradle project, pure JVM, single artifact first
  verify-page/     static SPA built from packages/ts
  tools/           pk-verify CLI, rule compiler, gitleaks TOML exporter
  docs/patterns/   two-hands-ux.md ownership-proof.md cross-tenant-tests.md redact-before-ai.md key-ceremony.md
  .github/workflows/ ts.yml dotnet.yml kotlin.yml release.yml
```
**Why one repo:**
- Specs, vectors and three bindings must change together, and one PR shows all of it.
- One tag = one consistent set.
- One place for AI agents to read.
- Several repos would multiply private-repo CI setup, cross-repo tokens and version skew for a solo owner.

**Why one package per language (not one per component):**
- Fewer things to version and vendor. Subpath exports and namespaces keep components separate.
- Split later only if a consumer's bundle size demands it (for example the verify page or a Worker).

### 4b. Consumption options (zero budget, repos private)

| Option | How it works | Cost and limits (checked 2026-10-28 unless marked) | Fit |
|---|---|---|---|
| **A. Vendored release snapshot** | `tools/pk-vendor` copies a tagged release (the needed package dir + `dist/` packs + `vectors/`) into the project at `vendor/platform-kit/` with a `PK_VERSION` file and a `SHA256SUMS` manifest. TS: a local workspace package. C#: a project reference. Kotlin: an included build / source module | Free. No tokens, no registry, works offline. Each repo is self-contained (important: the PC is formatted after Stage 3, and repos go public at different times) | **Best while private.** Drift risk handled by: CI in each project re-checks `SHA256SUMS` and runs the vendored vectors; updating = re-run `pk-vendor <tag>` in a normal PR |
| B. GitHub Packages (npm, NuGet, Maven) | Publish from the kit repo; projects install by version | Free plan: **500 MB storage, 1 GB transfer per month for private packages**; public packages free; downloads in Actions with `GITHUB_TOKEN` don't count **if the consuming repo is granted access to the package**; with no payment method, usage is **blocked** (never billed) when the quota runs out. **The npm registry needs a personal access token (classic) to install even public packages**; Maven and NuGet also need auth (Maven/NuGet: UNVERIFIED in today's docs) | Workable; the kit is tiny, so quotas are fine. But it puts a long-lived PAT on Manul's PC and in every agent's environment, and confuses agents (`.npmrc`, `nuget.config`, Gradle credentials). Not recommended |
| C. Git submodule pinned to a tag | `git submodule add` + pin | Free. CI needs a deploy key or PAT to clone a private submodule | Agents often forget `--recursive`, end up on a detached HEAD, or commit a moved pointer by accident. Not recommended |
| D. Public registries (npmjs.com, NuGet.org, Maven Central / JitPack) | Requires the **kit repo to be public** | Free for public packages | **Best once the kit is public** (§8 Q1). Maven Central needs namespace verification (`io.github.<user>`; process UNVERIFIED); JitPack builds from public GitHub tags (UNVERIFIED current terms) |

**Recommendation:** **A now; switch to D when the kit repo goes public.** Keep `pk-vendor` working afterwards as the offline fallback.

**Branch protection note:** GitHub Free has **no branch protection or rulesets on private repos** (Baton finding; GitHub's plans page lists protected branches only under Pro for private repos, checked 2026-10-28). The kit repo therefore follows the programme's local enforcement (pre-push hook and agent hooks) while private. A public kit repo gets real branch protection for free, which is one more reason for §8 Q1.

### 4c. How a project adopts a kit component (agent checklist)
1. Vendor the kit release tag. Never edit files under `vendor/platform-kit/`.
2. Read `spec/<component>.md` and use only the public API of the binding.
3. Register the product's own names: action namespace, evidence profile, rule-pack IDs, approval actions.
4. Add the vendored vectors to the project's CI.
5. Record the kit version in the project's decisions log.
6. If the spec does not fit, open the change in the kit repo first (§3.10). No local forks.

---


## 6. Build order

The programme order is web → desktop → Android, and Hearth may break it (`00-synthesis.md`). Kit work happens **just in time**, in the first session of the first consumer that needs it, as a separate PR in the kit repo before the product PR.

| Kit release | Contents | Language(s) | Triggered by (first consumer) | Size (directed build) |
|---|---|---|---|---|
| **0.1** | K0 core, K1 audit chain, K4 format + compiler/validator, K5 packs v1 (global subset, India verified formats, India PII, hidden-text) + TS matcher; `docs/patterns/two-hands-ux.md`; CI + vectors skeleton | TS + language-neutral vectors | **The first web project** (every web project's Phase 1 has an audit log; ShipGate and Baton P1 need K5) | M (about 2–3 weeks) |
| **0.2** | K3 evidence manifest + `pk-verify` CLI + static verify page; K2 approvals (spec + `webauthn` profile verify, TS client helpers); K6 regulations / retention / timesync | TS | Roster P1 (verify page), Watchtower P1 (signed pins), Baton P1 (gate v0; **pull K2 into 0.1 if Baton is first**), Quorum P2 | M |
| 0.3 | C# binding of K0, K1, K3, K4 validator, K5 validators; K2 verify | C# | First desktop project: AuthSunset / GPO Ledger P1 (audit chain), TriageKit P1 (case format → `tk-verify` on K3), LeakSweep P1 (K5 tests), **or Hearth H1 if the ecosystem starts earlier** | M |
| 0.4 | K2 `windows-tpm` profile; WebAuthn-on-Windows spike result folded into `webauthn` profile; K6 clocks + CERT-In categories + control catalogue v1 | C# + TS | GPO Ledger P2 / AuthSunset P2 (two-person approvals, mapped packs), Hearth H4, Purple Proof P2 | S–M |
| 0.5 | Kotlin binding of K0, K1, K3, K4 validator, K5 validators; K2 `android-keystore` signing + verify | Kotlin (pure JVM) | First Android project: Pagerline P1 (audit chain), Stockroom P1 (device-signed commands, audit), **or Hearth H3** | M |
| 0.6 | K7 webhook contract + `pk.handoff.incident` | TS + Kotlin (+ C# if Hearth agent needs it) | Hearth H4 → Pagerline, or OpsDesk's handoff | S |
| 1.0 | Freeze specs at 1.0 after **at least two products per component have shipped on them** (no 1.0 on paper) | all | n/a | n/a |

**Rule:** no component is built before a scheduled consumer needs it in its current phase. Specs may be drafted earlier (they are cheap); code may not.


## 7. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Premature mega-framework** | Kit work crowds out products. Agents gold-plate generic abstractions | The §2a admission rules; just-in-time releases (§6); one package per language; no 1.0 until two real consumers per component; anything UI, storage or workflow stays out |
| **Cross-language drift** | Three bindings written by different agents disagree on bytes, so signatures and chains fail between products | Language-neutral vectors as the source of truth; byte-identical Ed25519, digest and canonical outputs required; stable error codes; contract changes land in the kit first (§3.10) |
| **Crypto implementation mistakes** (DER vs P1363, JCS ordering by code point instead of UTF-16, WebAuthn checks skipped, subject digest not recomputed at the enforcement point) | Silent security failure: "signed" approvals that don't bind anything | Use audited primitives (noble, BCL, BouncyCastle, Tink); the spec lists every check; negative vectors for each mistake; the "recompute subject" step is mandatory and tested per product; security review of every binding |
| **Regex dialect differences / ReDoS** | A rule matches in TS but not in C#; a hostile file hangs LeakSweep or a Worker | RE2 subset; compile and test in all three engines in CI; NonBacktracking / timeouts; nested-quantifier lint; input size caps |
| **Secret-like test vectors** trip GitHub push protection once public, or real keys slip into vectors | Blocked pushes; leaked credentials | Synthetic or provider-example values only, stored split/encoded; LeakSweep scans the kit repo in CI |
| **Wrong or stale legal data** (clocks, clause numbers, key formats are mostly UNVERIFIED today) | Products give wrong deadlines or misleading mappings to Indian buyers | `verified` flag on every rule; unverified rules shown as such; primary-source check before `stable`; "not legal advice" wording; dates of retrieval and document hashes in `sources` |
| **Copyright in control catalogues** (ISO 27001, SOC 2 TSC text) | Licence breach in an MIT repo | IDs plus own short paraphrases only; no copied clause text |
| **Synced passkeys are not device-bound** | "Two hands" weaker than claimed if a Google account is taken over | Record backup flags; per-realm policy can require non-synced or Keystore keys (§8 Q4); honest wording in READMEs |
| **WebAuthn from Windows desktop apps is unproven** (origin/RP handling, .NET wrapper) | GPO Ledger / AuthSunset approvals blocked | Spike in GPO Ledger P2; `windows-tpm` fallback profile already specified |
| **Hash chain gives false comfort** | A full-database rewrite goes unnoticed | Checkpoints must be anchored outside the attacker's control (per-product anchors listed in §3.2); verifiers report "unanchored tail" honestly |
| **Retention and erasure vs immutability** (CERT-In 180 days, DPDP erasure) | Either the chain breaks or personal data can't be deleted | Pruning with checkpoint anchors; personal data kept out of events (IDs and digests only) |
| **Key management** (lost Ed25519 maintainer or service keys; no rotation) | Old evidence unverifiable, or a compromised key can't be revoked | `key-ceremony.md`; offline backups; `pk.audit.key_rotated` events; trust lists list retired keys as "valid until"; never delete old public keys |
| **Vendored copies drift or get edited locally** | Products silently diverge from the spec | `SHA256SUMS` check and vendored vectors in each project's CI; "never edit `vendor/`" in each repo's agent instructions |
| **Breaking changes ripple across 19 repos** | One spec change means many PRs | Minor versions are additive only; verifiers keep old minors forever; products upgrade on their own schedule because old objects stay valid |
| **Private-repo CI minutes** (2,000 per month on Free) shared by the kit and all private projects | Kit CI in three languages eats the budget | Ubuntu runners only; path-filtered workflows (only run a language when its folder or the vectors change); public kit repo removes the limit (§8 Q1) |
| **Third-party dependency risk** (noble, BouncyCastle, Tink, SimpleWebAuthn) | Supply-chain compromise inside every product | Pin exact versions and hashes; small dependency set; SBOM in releases; review on update |

---

## 8. Questions for Manul

1. **Should the shared kit's repo become public earlier than the products?**
   - Options:
     - (a) keep it private like every other repo until the products are done;
     - (b) make it public as soon as its first version is tested (it is MIT, small, and holds no product secrets or plans);
     - (c) make it public when the first product goes public.
   - **My recommendation: (b), because** a public repo on GitHub Free gets real protection for its `main` branch (private repos don't), unlimited free build minutes, and free package hosting with no tokens on your PC. A tested, public, MIT security kit with Indian secret rules is also a portfolio piece in itself. It reveals nothing about any product that isn't already in the plan. This is an exception to your "private until done" rule, so it needs your yes.

2. **How should each project get the kit?**
   - Options:
     - (a) a **copied, version-stamped snapshot** inside each project, checked automatically against the release;
     - (b) GitHub's private package service, which needs a personal access token stored on your PC and in every agent's setup;
     - (c) a git "submodule" link.
   - **My recommendation: (a) while repos are private, then public package registries once the kit is public, because** it needs no passwords or tokens, works offline, keeps every project repo complete on its own (useful after your PC is formatted), and AI agents handle it reliably. Submodules are a known source of agent mistakes.

3. **Which web project should be built first (it becomes the kit's first user)?**
   - Options:
     - (a) **Baton**;
     - (b) Roster;
     - (c) ShipGate;
     - (d) another web project.
   - **My recommendation: (a) Baton, because** your private repos on GitHub Free have no branch protection, and Baton is the tool that makes "no agent pushes to `main` without your fingerprint" true for every project built after it. It also exercises most of the kit at once (audit log, two-hands approvals, secret and Indian-PII redaction), so the kit gets proven early on something you use every day. If you prefer to start with a showcase product, (b) Roster is the next best fit.

4. **For approvals ("two hands"), may approvers use passkeys that sync between devices (for example through Google Password Manager)?**
   - Options:
     - (a) allow synced passkeys everywhere (easiest; works in any phone browser; easy recovery);
     - (b) require keys that never leave one device (hardware or a native app) everywhere;
     - (c) allow synced passkeys for your own solo tools (Baton, OpsDesk), and require device-only keys for business and regulated products (GPO Ledger, AuthSunset, Hearth, Pagerline).
   - **My recommendation: (c), because** synced passkeys are fine when you are the only owner and convenience matters. But for a bank's Group Policy change or Hearth's phone approval, the promise "only this person's phone can approve" must be literally true, and a synced passkey can be used from any device signed in to the same Google account.

5. **Should the C# (desktop) and Kotlin (Android) versions of the kit be written up front, or only when the first desktop or Android project starts?**
   - Options:
     - (a) only when needed;
     - (b) all three languages from the start.
   - **My recommendation: (a), because** the shared test files guarantee that versions written later produce exactly the same results, while writing them now would spend weeks on code nothing uses yet, and some details (like Windows fingerprint approvals) need a real desktop project to test against.

---
