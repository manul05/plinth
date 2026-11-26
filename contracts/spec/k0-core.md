# K0 Core: strict JSON, pk-JCS, digests, keys, signed envelope (`pk-sig/1.0`)

**Status:** normative for Plinth 0.1 (Stage 3, 2026-10-31). Words MUST / MUST NOT as in RFC 2119.
**Vectors:** `contracts/test-vectors/k0/` (56 files). **Schemas:** `jwk.schema.json`, `pk-sig.envelope.schema.json`, `common.schema.json`.
**API:** `contracts/api/plinth-api.d.ts`, subpath `plinth-kit/core`. **Errors:** `contracts/errors.json`.

## 1. Encodings (every component)
- Binary in JSON: **base64url without padding** (RFC 4648 §5). Decoders MUST reject `=`, `+`, `/`, whitespace and any character outside `A-Z a-z 0-9 - _` with `PK_ENCODING_INVALID`. (TS: `@scure/base` `base64urlnopad`.)
- Hex: lower case on output; decoders accept either case.
- Digest string: `"sha256:" + 64 lowercase hex`. `GENESIS_DIGEST` = `"sha256:"` + 64 `0` characters.
- Timestamp: `^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$` (UTC, exactly 3 fractional digits). `timestampFromMs(ms)` = `new Date(ms).toISOString()`.
- Calendar date: `YYYY-MM-DD`.
- IDs: UUIDv7 lower case, regex `^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. `newUuidV7(nowMs = Date.now())`: bytes 0–5 = `nowMs` as 48-bit big-endian; byte 6 = `0x70 | (rand & 0x0f)`; byte 7 = rand; byte 8 = `0x80 | (rand & 0x3f)`; bytes 9–15 = rand; random bytes from `crypto.getRandomValues`.
- Nonce: 16 bytes from `crypto.getRandomValues`, base64url → always 22 characters.

## 2. Strict JSON parser `parseJson(text)`
Input is a JS string. Grammar is RFC 8259 JSON with these extra rules (each throws `PlinthError`):
1. A leading U+FEFF, any syntax error, trailing non-whitespace, or a raw control character (< U+0020) inside a string → `PK_JSON_SYNTAX`. Whitespace = space, tab, LF, CR only.
2. Nesting depth: the top-level value is depth 1; every `[` or `{` adds 1. Depth 65 or more → `PK_JSON_TOO_DEEP` (64 is allowed).
3. Duplicate member name in one object (compared after unescaping) → `PK_JCS_DUPLICATE_KEY`.
4. A string or member name that, after unescaping, is not well-formed UTF-16 (lone surrogate, written raw or as `\uD800`) → `PK_JCS_LONE_SURROGATE`. Check with `String.prototype.isWellFormed()`.
5. Number token matched by `^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?`: a fraction or exponent part → `PK_JCS_NON_INTEGER` (so `1.0` and `1e3` fail); value outside ±(2^53−1) → `PK_JCS_INT_RANGE`; `-0` parses as `0`. A leading zero such as `01` is a syntax error.
6. The literal `null` → `PK_JCS_NULL`.
7. Escapes: `\" \\ \/ \b \f \n \r \t \uXXXX` only; anything else → `PK_JSON_SYNTAX`.
8. Objects are created so that a member named `__proto__` is an own data property (use `Object.defineProperty`), never a prototype change.

## 3. pk-JCS `canonicalize(value)`
RFC 8785 (JCS) restricted to the "pk-JCS profile":
- Allowed values: string, boolean, integer number, array, plain object (prototype `Object.prototype` or `null`). Anything else (undefined, function, bigint, symbol, Date, Map, class instance) → `PK_JCS_UNSUPPORTED_TYPE`; `null` → `PK_JCS_NULL`; non-integer number (incl. NaN, ±Infinity) → `PK_JCS_NON_INTEGER`; integer outside safe range → `PK_JCS_INT_RANGE`; depth rule as in §2 → `PK_JSON_TOO_DEEP`.
- Output has no whitespace. `true`/`false`. Integers in decimal without exponent; `-0` → `0`.
- Strings and member names: must be well-formed (`PK_JCS_LONE_SURROGATE`), serialised exactly as `JSON.stringify(s)` does for well-formed strings: `\"`, `\\`, `\b \f \n \r \t`, other code units below U+0020 as `\u00xx` with **lower-case** hex; everything else (including `/`, U+007F, U+2028, non-ASCII) literally. No Unicode normalisation.
- Object members sorted by **UTF-16 code units** of the member name (JS default `Array.prototype.sort()` on the keys). Arrays keep their order.
- `digest(value)` = `"sha256:" + hex(SHA-256(UTF-8(canonicalize(value))))`. `digestBytes(b)` = `"sha256:" + hex(SHA-256(b))`.
- Vectors `k0-jcs-utf16-order` and `k0-jcs-utf16-vs-codepoint` catch code-point sorting; `k0-jcs-escapes` catches upper-case hex.

## 4. Keys and kid
- Supported public keys: Ed25519 `{"kty":"OKP","crv":"Ed25519","x":<43 chars>}` and P-256 `{"kty":"EC","crv":"P-256","x":<43>,"y":<43>}`. Any other kty/crv → `PK_KEY_UNSUPPORTED`.
- `thumbprintMembers(jwk)`: returns a new object with only `crv, kty, x` (OKP) or `crv, kty, x, y` (EC). x (and y) MUST decode to exactly 32 bytes, else `PK_KEY_INVALID` (bad base64url → `PK_ENCODING_INVALID`). For EC, `04‖x‖y` MUST be a point on P-256 (`p256.Point.fromBytes` must not throw), else `PK_KEY_INVALID`. Other members (`kid`, `use`, `alg`, `d`) are ignored.
- `kidOf(jwk)` = `digest(thumbprintMembers(jwk))` (RFC 7638 member set, hashed with SHA-256, hex, `sha256:` prefix).
- `jwkFromP256Spki(spki)`: input MUST be 91 bytes whose first 26 bytes are hex `3059301306072a8648ce3d020106082a8648ce3d030107034200` and byte 26 is `0x04`; else `PK_KEY_UNSUPPORTED`. x = bytes 27–58, y = bytes 59–90. Then validated as above.
- `TEST_KIDS`: the five kids in `contracts/test-vectors/keys/test-kids.json`. `isTestKid(kid)` = membership. Products MUST fail CI if a test kid is in a production trust list or registry.

## 5. ECDSA encodings
- `p1363ToDer(sig)`: input exactly 64 bytes (else `PK_ENCODING_INVALID`); r = bytes 0–31, s = 32–63; each as a DER INTEGER: strip leading zero bytes (keep at least one byte), prepend `0x00` if the top bit is set; `30 len 02 lenR R 02 lenS S`.
- `derToP1363(der)`: MUST reject (`PK_ENCODING_INVALID`): total length < 8 or > 72, first byte ≠ `0x30`, second byte ≠ length − 2, an INTEGER tag ≠ `0x02`, INTEGER length 0 or > 33, negative INTEGER (top bit of first byte set), non-minimal INTEGER (leading `0x00` not followed by a byte with top bit set), INTEGER value longer than 32 bytes after removing the pad, any trailing bytes. Output r and s left-padded to 32 bytes each.

## 6. Signed envelope `pk-sig/1.0`
```json
{ "spec": "pk-sig/1.0", "type": "<dotted.name>", "payload": { }, "signatures": [ { "kid": "sha256:…", "alg": "Ed25519", "role": "producer", "sig": "<base64url>" } ] }
```
- **Signing input (PAE):** `M = UTF-8("pk-sig/1\n" + type + "\n") ‖ SHA-256(UTF-8(canonicalize(payload)))` (the 32 raw digest bytes). `signingInput(type, payload)` returns M.
- `Ed25519`: RFC 8032 pure Ed25519 over M (`ed25519.sign(M, secretKey)`), 64 bytes.
- `ES256`: ECDSA P-256 with SHA-256 over M (the library hashes M), signature in **P1363** (64 bytes) inside envelopes. Verify with `p256.verify(sig, M, pubUncompressed, { lowS: false })` (high-S MUST be accepted; vector `k0-env-valid-es256-high-s`). DER inside an envelope fails as `PK_SIG_INVALID` (length ≠ 64).
- `webauthn-ES256`: see §7.
- `signEd25519(type, payload, sk, role)` returns `{alg:"Ed25519", kid: kidOf(ed25519PublicJwk(sk)), role, sig}` (member order irrelevant; JSON files are compared by value). Ed25519 output is byte-identical in every language (vector `k0-sig-sign-ed25519`). ES256 vectors are verify-only.
- **`verifyEnvelope(envelope, {trustedKeys, policy})` — check order is normative** (the first failing check gives the error; it never throws):
  1. envelope is an object with string `spec`, string `type`, object `payload`, array `signatures`, and no other members → else `PK_ENVELOPE_MALFORMED`.
  2. `spec === "pk-sig/1.0"` → else `PK_SPEC_UNSUPPORTED`.
  3. `policy[type]` exists → else `PK_SIG_TYPE_NOT_ALLOWED`.
  4. `signatures.length > 0` → else `PK_SIG_NONE`.
  5. compute M (a canonicalisation error returns that error code).
  6. for each signature in order: (a) object with string `kid`, `alg`, `role`, `sig` → else `PK_ENVELOPE_MALFORMED`; (b) alg in {Ed25519, ES256, webauthn-ES256} → else `PK_SIG_UNKNOWN_ALG`; (c) alg in `policy[type].algs` → else `PK_SIG_ALG_NOT_ALLOWED`; (d) kid not seen earlier in this envelope → else `PK_SIG_DUPLICATE_KID`; (e) a trusted key with this kid → else `PK_SIG_UNKNOWN_KID`; (f) Ed25519 needs `kty OKP`, the other two need `kty EC` → else `PK_SIG_KEY_ALG_MISMATCH`; (g) sig decodes → else `PK_ENCODING_INVALID`; (h) verify (Ed25519 with `{zip215: false}` rejecting small-order/non-canonical keys, and ES256: sig length 64 else `PK_SIG_INVALID`; bad signature `PK_SIG_INVALID`; webauthn: §7 errors).
  7. number of verified signers ≥ `policy[type].min_signatures` → else `PK_SIG_INSUFFICIENT`.
  8. return `{valid:true, signers:[{kid, alg, role, flags?}]}` in signature order (`flags` only for webauthn).
- Every signature present MUST verify; one bad signature makes the envelope invalid even if others are good.
- The verifier MUST get keys from a trust source it already holds. An envelope never brings its own trust. Signature bytes MUST NOT be used as identifiers; identify by `digest(payload)`.

## 7. `webauthn-ES256` signature entries
Entry: `{kid, alg:"webauthn-ES256", role, sig (DER, base64url), authenticator_data (base64url), client_data_json (base64url of the exact bytes)}`. The trusted key MUST carry `webauthn: {rp_id, origins}`.
- `webauthnChallenge(type, payload)` = SHA-256(M) (32 bytes). The client passes it as the WebAuthn `challenge`; the browser writes base64url of it into clientDataJSON.
- Verification steps, in order:
  1. trusted key has `webauthn` → else `PK_WEBAUTHN_NO_CONFIG`.
  2. `authenticator_data` and `client_data_json` are strings → else `PK_WEBAUTHN_MALFORMED`; all three decode → else `PK_ENCODING_INVALID`.
  3. authenticatorData length ≥ 37 → else `PK_WEBAUTHN_MALFORMED`.
  4. clientDataJSON bytes decode as UTF-8 (fatal) and `JSON.parse` to an object → else `PK_WEBAUTHN_MALFORMED`.
  5. `type === "webauthn.get"` → else `PK_WEBAUTHN_TYPE`.
  6. `challenge === base64url(SHA-256(M))` → else `PK_WEBAUTHN_CHALLENGE`.
  7. `origin` is in `webauthn.origins` (exact string match) → else `PK_WEBAUTHN_ORIGIN`.
  8. `crossOrigin === true` → `PK_WEBAUTHN_CROSS_ORIGIN` (absent or false is fine).
  9. authenticatorData bytes 0–31 equal SHA-256(UTF-8(rp_id)) → else `PK_WEBAUTHN_RPID`.
  10. flags = byte 32: UP (0x01) set → else `PK_WEBAUTHN_UP`; UV (0x04) set → else `PK_WEBAUTHN_UV`.
  11. `derToP1363(sig)` succeeds (strict DER) and `p256.verify(sig, authenticatorData ‖ SHA-256(clientDataJSON), pub, {format:'der', lowS:false})` is true → else `PK_SIG_INVALID`.
  12. signer `flags` = `{up: bit0, uv: bit2, be: bit3 (0x08), bs: bit4 (0x10)}`.
- `signCount` is not checked by the kit (synced passkeys report 0); online products MAY check it.
- `signatureFromAssertion({kid, role, authenticatorData, clientDataJSON, signature})` base64url-encodes the three byte arrays into an entry.
