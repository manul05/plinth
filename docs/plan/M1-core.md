# M1 K0 Core — task cards

**Goal:** all 56 `k0` vectors pass; strict JSON, pk-JCS, kids, DER, envelopes and WebAuthn signature verification implemented exactly per `contracts/spec/k0-core.md`.
**Demo at the end:** `npm test -- k0` shows 56 vector tests green; a flipped byte fails.
Library files go in `packages/ts/src/core/`; tests in `packages/ts/test/core/`. Import noble and scure **only** in `src/core/bytes.ts`, `src/core/keys.ts`, `src/core/envelope.ts`, `src/core/webauthn.ts`, `src/core/ids.ts` with these exact specifiers: `@noble/curves/ed25519.js` (`ed25519`), `@noble/curves/nist.js` (`p256`), `@noble/hashes/sha2.js` (`sha256`), `@noble/hashes/hmac.js` (`hmac`), `@noble/hashes/utils.js` (`bytesToHex`, `hexToBytes`, `utf8ToBytes`, `concatBytes`), `@scure/base` (`base64urlnopad`, `base32nopad`).

---

### T-M1-01 · Red skeleton: k0 vector runner
- **Size:** S
- **Depends on:** T-M0-08
- **Covers:** AC-1.1–1.4, AC-2.1–2.2, AC-3.1–3.2, AC-3.5, AC-4.1–4.3 (as a failing harness)
- **Read first:** `contracts/test-vectors/README.md` (ops table); `contracts/spec/k0-core.md`
- **Create:** `packages/ts/test/core/k0-vectors.test.ts`; stub files `packages/ts/src/core/index.ts`, `bytes.ts`, `json.ts`, `jcs.ts`, `keys.ts`, `der.ts`, `envelope.ts`, `webauthn.ts`, `ids.ts` where every function from the API (`contracts/api/plinth-api.d.ts`, "shared" section) is exported with its exact signature and the body `throw new Error('not implemented');` (constants: `GENESIS_DIGEST = ('sha256:' + '0'.repeat(64)) as Digest`, `TEST_KIDS = []` for now).
- **Modify:** `packages/ts/src/index.ts` (add `export * from './core/index.js';`)
- **Do not touch:** anything else.
- **Tests (write first):** one `describe` per op; one `it(vector.id)` per vector:
  - `parseAndCanonicalize`: if `expect.error`, assert `() => canonicalize(parseJson(input.json_text))` throws a `PlinthError` whose `code === expect.error`; else `canonicalize(parseJson(text)) === expect.canonical` and `digest(parseJson(text)) === expect.digest`.
  - `kidOf`: error case as above with `kidOf(input.jwk)`; else `kidOf(jwk) === expect.kid` and `canonicalize(thumbprintMembers(jwk)) === expect.canonical_member_set`.
  - `p1363ToDer` / `derToP1363`: `hexEncode(fn(hexDecode(input.x_hex)))` equals expect, or `PlinthError` code.
  - `signingInput`: `hexEncode(signingInput(type, payload)) === expect.signing_input_hex`; `canonicalize(payload) === expect.payload_canonical`; `b64urlEncode(webauthnChallenge(type, payload)) === expect.webauthn_challenge_b64url`.
  - `signEd25519`: key from `loadKey(input.key_file)`; result `toEqual(expect.signature)`.
  - `verifyEnvelope`: `verifyEnvelope(input.envelope, { trustedKeys: input.trusted_keys, policy: input.policy })` `toEqual(expect)`.
- **Steps:** write the test, run it, confirm **56 failures** (paste the summary line), commit.
- **Run:** `npm test -- k0` → 56 failed (expected); `npm run typecheck` → 0 errors
- **Done when:** failing output pasted · typecheck clean · STATUS updated
- **Stop and ask the owner if:** typecheck needs a signature different from `contracts/api/plinth-api.d.ts`.
- **Commit:** `test(core): add failing k0 golden-vector runner (T-M1-01)`

### T-M1-02 · bytes.ts: base64url, hex, UTF-8, SHA-256
- **Size:** S
- **Depends on:** T-M1-01
- **Covers:** k0-core.md §1, TM-04 (strict decoding)
- **Read first:** `contracts/spec/k0-core.md` §1
- **Create:** `packages/ts/test/core/bytes.test.ts`
- **Modify:** `packages/ts/src/core/bytes.ts`
- **Interface (exact):** `b64urlEncode`, `b64urlDecode`, `hexEncode`, `hexDecode`, `utf8Encode`, `sha256Bytes` as in the API file. `b64urlDecode`: first check `/^[A-Za-z0-9_-]*$/`, else throw `PlinthError('PK_ENCODING_INVALID')`; then `base64urlnopad.decode` inside try/catch → same error. `hexDecode`: `/^([0-9a-fA-F]{2})*$/` else `PK_ENCODING_INVALID`; then `hexToBytes(text.toLowerCase())`. `utf8Encode` = `utf8ToBytes`. `sha256Bytes` = `sha256`.
- **Tests (write first):** `b64urlEncode(Uint8Array.of(0xfb,0xff)) === '-_8'`; `b64urlDecode('-_8')` → `[251,255]`; `b64urlDecode('-_8=')`, `('+/8')`, `('a b')` → `PK_ENCODING_INVALID`; `b64urlDecode('')` → length 0; `hexEncode(Uint8Array.of(0,255)) === '00ff'`; `hexDecode('00FF')` → `[0,255]`; `hexDecode('0')` → `PK_ENCODING_INVALID`; `hexEncode(sha256Bytes(utf8Encode('abc'))) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'`.
- **Run:** `npm test -- bytes` → pass; typecheck; lint
- **Done when:** pass · STATUS updated
- **Stop and ask the owner if:** an import path above does not resolve.
- **Commit:** `feat(core): strict base64url, hex and UTF-8 helpers (T-M1-02)`

### T-M1-03 · json.ts: strict I-JSON parser
- **Size:** M
- **Depends on:** T-M1-02
- **Covers:** AC-2.1, AC-2.2, TM-01, TM-31, TM-34
- **Read first:** `contracts/spec/k0-core.md` §2
- **Create:** `packages/ts/test/core/json.test.ts`
- **Modify:** `packages/ts/src/core/json.ts`
- **Interface (exact):** `export function parseJson(text: string): Json` and `export const MAX_DEPTH = 64;`
- **Steps (one implementation only):** recursive descent over the JS string with an index `i`. `value(depth)`: if `depth > 64` throw `PK_JSON_TOO_DEEP`; skip whitespace (space, `\t`, `\n`, `\r`); dispatch on the character: `{` object, `[` array, `"` string, `t`/`f` literals `true`/`false` (exact text), `n` → if text at i starts with `null` throw `PK_JCS_NULL` else syntax error, `-` or digit → number, anything else `PK_JSON_SYNTAX`. Objects: keys are strings; keep a `Set` of seen keys → duplicate throws `PK_JCS_DUPLICATE_KEY` with detail = nothing (never the key text); assign with `Object.defineProperty(obj, key, {value, enumerable:true, writable:true, configurable:true})`; nested values call `value(depth + 1)`. Numbers: apply `/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/` to `text.slice(i)`; no match → `PK_JSON_SYNTAX`; group 2 or 3 present → `PK_JCS_NON_INTEGER`; `Number(token)` not a safe integer → `PK_JCS_INT_RANGE`; return `v === 0 ? 0 : v`. Strings: read until an unescaped `"`; a code unit < 0x20 → `PK_JSON_SYNTAX`; escapes per spec §2.7; after reading, `!s.isWellFormed()` → `PK_JCS_LONE_SURROGATE`. Top level: leading U+FEFF → `PK_JSON_SYNTAX`; `value(1)`; trailing non-whitespace → `PK_JSON_SYNTAX`. All errors are `PlinthError`.
- **Tests (write first):** `json.test.ts`
  - `__proto__ becomes an own property`: `parseJson('{"__proto__":{"x":1}}')` has own key `__proto__`; `({} as any).x === undefined`.
  - `whitespace and nesting`: `parseJson(' { "a" : [ 1 , true ] } ')` deep-equals `{a:[1,true]}`.
  - `rejects`: `'{"a":1} x'`, `'﻿{}'`, `'{"a":"\u0001"}'` (raw control char), `'{"a":"\\x"}'` → `PK_JSON_SYNTAX`; `'-0'` → `0`.
  - plus the 22 `parseAndCanonicalize` vectors (already in T-M1-01) now pass once T-M1-04 lands.
- **Run:** `npm test -- json` → pass; typecheck; lint
- **Done when:** pass · STATUS updated
- **Stop and ask the owner if:** a vector expects behaviour the spec does not describe.
- **Commit:** `feat(core): strict I-JSON parser (T-M1-03)`

### T-M1-04 · jcs.ts: pk-JCS canonicalize and digest
- **Size:** M
- **Depends on:** T-M1-03
- **Covers:** AC-1.1–1.4, AC-2.3, TM-01
- **Read first:** `contracts/spec/k0-core.md` §3
- **Create:** `packages/ts/test/core/jcs.test.ts`
- **Modify:** `packages/ts/src/core/jcs.ts`
- **Interface (exact):** `canonicalize(value: unknown): string`, `digest(value: unknown): Digest`, `digestBytes(bytes: Uint8Array): Digest`, `GENESIS_DIGEST`.
- **Steps:** `canonicalize(v, depth = 1)`: depth > 64 → `PK_JSON_TOO_DEEP`; `null` → `PK_JCS_NULL`; boolean → `'true'|'false'`; number → not `Number.isInteger` → `PK_JCS_NON_INTEGER`, not safe → `PK_JCS_INT_RANGE`, else `v === 0 ? '0' : String(v)`; string → `isWellFormed` else `PK_JCS_LONE_SURROGATE`, then `JSON.stringify(v)`; array → `'[' + items.map(x => canonicalize(x, depth+1)).join(',') + ']'`; object → prototype must be `Object.prototype` or `null` else `PK_JCS_UNSUPPORTED_TYPE`; `Object.keys(v).sort()` (default sort = UTF-16 code units; **never** `localeCompare`); each key well-formed; `JSON.stringify(key) + ':' + canonicalize(value, depth+1)` joined by `,`; any other type (undefined, function, bigint, symbol) → `PK_JCS_UNSUPPORTED_TYPE`. `digest(v) = 'sha256:' + hexEncode(sha256Bytes(utf8Encode(canonicalize(v))))`.
- **Tests (write first):** `jcs.test.ts`: `canonicalize(undefined)`, `canonicalize(new Date(0))`, `canonicalize({a: undefined})`, `canonicalize(1n)` → `PK_JCS_UNSUPPORTED_TYPE`; `canonicalize(0.5)` and `canonicalize(NaN)` → `PK_JCS_NON_INTEGER`; `canonicalize(Object.create(null))` → `'{}'`; `digest({})` → `sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`; `digestBytes(new Uint8Array(0))` → `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; `GENESIS_DIGEST.length === 71`.
- **Run:** `npm test -- jcs k0` → jcs tests pass and the 22 `parseAndCanonicalize` vectors pass
- **Done when:** pass · STATUS updated
- **Stop and ask the owner if:** a vector disagrees with `JSON.stringify` escaping.
- **Commit:** `feat(core): pk-JCS canonicalisation and digests (T-M1-04)`

### T-M1-05 · keys.ts: thumbprint, kid, SPKI import, test kids
- **Size:** M
- **Depends on:** T-M1-04
- **Covers:** AC-3.1–3.4, TM-29
- **Read first:** `contracts/spec/k0-core.md` §4; `contracts/test-vectors/keys/test-kids.json`
- **Create:** `packages/ts/src/core/test-kids.ts`, `packages/ts/test/core/keys.test.ts`
- **Modify:** `packages/ts/src/core/keys.ts`, `packages/ts/src/core/index.ts`
- **Interface (exact):** `thumbprintMembers`, `kidOf`, `jwkFromP256Spki`, `ed25519PublicJwk`, `TEST_KIDS`, `isTestKid` per the API file. `test-kids.ts` exports `TEST_KIDS` as a frozen array of the 5 strings copied from `test-kids.json` in the same order.
- **Steps:** `thumbprintMembers(jwk)`: not an object → `PK_KEY_UNSUPPORTED`; OKP/Ed25519 → `x` must be a string, `b64urlDecode` (throws `PK_ENCODING_INVALID`), length 32 else `PK_KEY_INVALID`; return `{crv, kty, x}`. EC/P-256 → x and y 32 bytes each else `PK_KEY_INVALID`; `p256.Point.fromBytes(concatBytes(Uint8Array.of(4), x, y))` inside try/catch → `PK_KEY_INVALID`; return `{crv, kty, x, y}`. Anything else → `PK_KEY_UNSUPPORTED`. `kidOf = digest(thumbprintMembers(jwk))`. `jwkFromP256Spki` per spec §4 (prefix hex `3059301306072a8648ce3d020106082a8648ce3d030107034200`). `ed25519PublicJwk(sk) = {kty:'OKP', crv:'Ed25519', x: b64urlEncode(ed25519.getPublicKey(sk))}`.
- **Tests (write first):** `keys.test.ts`: `isTestKid recognises all five` (each kid in `test-kids.json` → true; `'sha256:' + 'a'.repeat(64)` → false); `TEST_KIDS equals test-kids.json`; `ed25519PublicJwk(hexDecode(<ed25519-test-1 private_hex>))` deep-equals the key file's `public_jwk`; plus the 7 `kidOf` vectors and both `jwkFromP256Spki` k2 vectors (load with `loadVectors('k2','jwkFromP256Spki')`: `toEqual(expect.jwk)` or error code).
- **Run:** `npm test -- keys k0` → keys tests and 7 kid vectors pass
- **Done when:** pass · STATUS updated
- **Commit:** `feat(core): key thumbprints, kids, SPKI import and test-kid list (T-M1-05)`

### T-M1-06 · der.ts: strict DER ↔ P1363
- **Size:** S
- **Depends on:** T-M1-02
- **Covers:** AC-3.5, TM-04
- **Read first:** `contracts/spec/k0-core.md` §5
- **Modify:** `packages/ts/src/core/der.ts`
- **Create:** `packages/ts/test/core/der.test.ts`
- **Steps:** implement exactly the rules in spec §5 (the reject list is the checklist; one `if` per bullet, in that order).
- **Tests (write first):** the 6 DER vectors (via the k0 runner) plus `der.test.ts`: round trip `derToP1363(p1363ToDer(x))` equals x for x = 64 bytes of `0x01`, for x = `0x80` followed by 63 zero bytes, and for x = 63 zero bytes followed by `0x01` (r = 0 encodes as `02 01 00`); `p1363ToDer(new Uint8Array(63))` → `PK_ENCODING_INVALID`.
- **Run:** `npm test -- der k0`
- **Done when:** 6 vectors + 4 unit tests pass · STATUS updated
- **Commit:** `feat(core): strict DER and P1363 conversion (T-M1-06)`

### T-M1-07 · envelope.ts: signing input, Ed25519 signing, createEnvelope
- **Size:** S
- **Depends on:** T-M1-05
- **Covers:** AC-4.1, TM-02
- **Read first:** `contracts/spec/k0-core.md` §6 (first five bullets)
- **Modify:** `packages/ts/src/core/envelope.ts`
- **Create:** `packages/ts/test/core/envelope-sign.test.ts`
- **Steps:** `signingInput(type, payload) = concatBytes(utf8Encode('pk-sig/1\n' + type + '\n'), sha256Bytes(utf8Encode(canonicalize(payload))))`. `signEd25519(type, payload, sk, role)`: `sk.length !== 32` → `PK_KEY_INVALID`; `{alg:'Ed25519', kid: kidOf(ed25519PublicJwk(sk)), role, sig: b64urlEncode(ed25519.sign(signingInput(type, payload), sk))}`. `createEnvelope(type, payload, signatures) = {spec:'pk-sig/1.0', type, payload, signatures}`. `webauthnChallenge(type, payload) = sha256Bytes(signingInput(type, payload))`.
- **Tests (write first):** vectors `k0-sig-signing-input`, `k0-sig-sign-ed25519` pass; `envelope-sign.test.ts`: `signEd25519('t.x.y', {}, new Uint8Array(31), 'r')` → `PK_KEY_INVALID`; signing the same input twice gives identical `sig`.
- **Run:** `npm test -- envelope k0`
- **Done when:** pass · STATUS updated
- **Commit:** `feat(core): signing input and Ed25519 envelope signatures (T-M1-07)`

### T-M1-08 · verifyEnvelope for Ed25519 and ES256
- **Size:** M
- **Depends on:** T-M1-06, T-M1-07
- **Covers:** AC-4.2–4.4, TM-02, TM-03, TM-05, TM-35, NFR-5
- **Read first:** `contracts/spec/k0-core.md` §6 "verifyEnvelope — check order is normative"
- **Modify:** `packages/ts/src/core/envelope.ts`
- **Create:** `packages/ts/test/core/envelope.test.ts`
- **Steps:** implement steps 1–8 of spec §6 **in that order**, each returning `{valid:false, error}` (never throw: wrap step 5 and decoding in try/catch and return the `PlinthError.code`). Ed25519: `ed25519.verify(sig, M, b64urlDecode(jwk.x))` inside try/catch (false on throw). ES256: public key = `concatBytes(Uint8Array.of(4), b64urlDecode(jwk.x), b64urlDecode(jwk.y))`; `p256.verify(sig, M, pub, { lowS: false })`. For `webauthn-ES256` call `verifyWebauthnSignature` from `./webauthn.js` (exists as a stub until T-M1-09; until then those vectors are not in k0). `trustedKeys` lookup by exact `kid` string.
- **Tests (write first):** the 19 `verifyEnvelope` vectors; `envelope.test.ts` › `verifyEnvelope never throws`: for inputs `null`, `42`, `'x'`, `{}`, `[]`, `{spec:'pk-sig/1.0', type:'a.b', payload:{}, signatures:[{kid:1}]}` the result is `{valid:false, error:'PK_ENVELOPE_MALFORMED'}`, and `{spec:'pk-sig/1.0', type:'a.b', payload:{n:1.5}, signatures:[<any valid-shaped entry>]}` with policy `{'a.b':{algs:['Ed25519'],min_signatures:1}}` → `{valid:false, error:'PK_JCS_NON_INTEGER'}`.
- **Run:** `npm test -- envelope k0` → all 56 k0 vectors pass now
- **Done when:** 56/56 k0 vectors · unit tests pass · STATUS updated
- **Stop and ask the owner if:** any vector fails after following the order exactly.
- **Commit:** `feat(core): fail-closed envelope verification (T-M1-08)`

### T-M1-09 · webauthn.ts: WebAuthn-ES256 signature entries
- **Size:** M
- **Depends on:** T-M1-08
- **Covers:** AC-5.1, AC-5.2, TM-06
- **Read first:** `contracts/spec/k0-core.md` §7
- **Modify:** `packages/ts/src/core/webauthn.ts`, `packages/ts/src/core/envelope.ts` (only the webauthn branch)
- **Create:** `packages/ts/test/core/webauthn.test.ts`
- **Interface (exact, internal + public):**
  ```ts
  export function verifyWebauthnSignature(entry: Record<string, unknown>, M: Uint8Array, key: TrustedKey):
    { ok: true; flags: AuthenticatorFlags } | { ok: false; error: ErrorCode };
  export function signatureFromAssertion(input: { kid: Digest; role: string; authenticatorData: Uint8Array; clientDataJSON: Uint8Array; signature: Uint8Array }): SignatureWebauthn;
  ```
- **Steps:** implement the 12 steps of spec §7 in order. Decode clientDataJSON with `new TextDecoder('utf-8', { fatal: true })` then `JSON.parse` inside try/catch. Challenge compare: `cd.challenge === b64urlEncode(sha256Bytes(M))`. rpId compare byte by byte against `sha256Bytes(utf8Encode(key.webauthn.rp_id))`. Signature: `derToP1363(sig)` in try/catch (failure → `PK_SIG_INVALID`), then `p256.verify(sig, concatBytes(authData, sha256Bytes(cdj)), pub, { format: 'der', lowS: false })`.
- **Tests (write first):** `webauthn.test.ts` takes the decision envelopes from k2 vectors and verifies them with `verifyEnvelope(env, { trustedKeys: <registry approvers mapped to {kid, jwk, webauthn:{rp_id, origins}}>, policy: { 'pk.approval.decision': { algs: ['webauthn-ES256','ES256'], min_signatures: 1 } } })`:
  - `k2-approval-valid-webauthn` decision → valid, signer `flags` `{up:true, uv:true, be:false, bs:false}`;
  - `k2-approval-synced-passkey-allowed` decision → valid, flags `{up:true, uv:true, be:true, bs:true}`;
  - decisions of `-wrong-origin`, `-wrong-rpid`, `-uv-off`, `-up-off`, `-wrong-clientdata-type`, `-wrong-challenge`, `-cross-origin` → `PK_WEBAUTHN_ORIGIN`, `PK_WEBAUTHN_RPID`, `PK_WEBAUTHN_UV`, `PK_WEBAUTHN_UP`, `PK_WEBAUTHN_TYPE`, `PK_WEBAUTHN_CHALLENGE`, `PK_WEBAUTHN_CROSS_ORIGIN`;
  - the valid decision with the trusted key's `webauthn` removed → `PK_WEBAUTHN_NO_CONFIG`;
  - `signatureFromAssertion` of the decoded parts of the valid entry deep-equals the entry.
- **Run:** `npm test -- webauthn k0`
- **Done when:** pass · STATUS updated
- **Commit:** `feat(core): verify WebAuthn-ES256 signature entries (T-M1-09)`

### T-M1-10 · ids.ts: UUIDv7, nonce, timestamps
- **Size:** S
- **Depends on:** T-M1-02
- **Covers:** k0-core.md §1, AC-9.2 (ids)
- **Modify:** `packages/ts/src/core/ids.ts`
- **Create:** `packages/ts/test/core/ids.test.ts`
- **Steps:** per spec §1. `isTimestamp(s)` = `/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(s) && !Number.isNaN(Date.parse(s))`. `timestampFromMs(ms) = new Date(ms).toISOString()`. Randomness: `crypto.getRandomValues`.
- **Tests (write first):** `newUuidV7(1793955600000)` matches the UUIDv7 regex and its first 13 characters are `01a1b016-1680` (48-bit hex of 1793955600000 = `01a1b0161680`); 1,000 calls give 1,000 distinct values; `newNonce()` length 22 and `b64urlDecode` length 16; `isTimestamp('2026-11-02T09:00:00.000Z')` true, `('2026-11-02T09:00:00Z')` false, `('2026-13-02T09:00:00.000Z')` false; `timestampFromMs(0) === '1970-01-01T00:00:00.000Z'`.
- **Run:** `npm test -- ids`
- **Done when:** pass · STATUS updated
- **Commit:** `feat(core): UUIDv7, nonces and timestamp helpers (T-M1-10)`

### T-M1-11 · M1 close: mutation checks and status
- **Size:** S
- **Depends on:** T-M1-09, T-M1-10
- **Covers:** NFR-11 (MC-1, MC-2, MC-5), milestone gate
- **Read first:** `docs/testing.md` §6
- **Modify:** `docs/status/STATUS.md`, `docs/status/LOG.md`, `docs/06-plan.md` (statuses), `docs/do-not-break.md` (add DNB-002 below)
- **Steps:** for MC-1, MC-2, MC-5: make the break, run `npm test -- k0`, paste the failing test name, restore with `git checkout -- <file>`, run again green. Write the three results in LOG. Add to `do-not-break.md`:
  ```
  ## DNB-002: Key order uses UTF-16 code units
  - Where: packages/ts/src/core/jcs.ts (canonicalize)
  - Rule: object keys are sorted with the default Array.prototype.sort(), never localeCompare or Intl.Collator
  - Why: RFC 8785 orders by UTF-16 code units; any other order changes every hash and breaks other languages
  - Test: k0-jcs-utf16-order, k0-jcs-utf16-vs-codepoint
  ```
- **Run:** `npm run check` → paste result lines with SHA
- **Done when:** 3 mutation checks logged · check green · STATUS "Next step: T-M2-01"
- **Commit:** `docs: close milestone M1 with mutation checks (T-M1-11)`
