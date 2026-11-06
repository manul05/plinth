# Plinth golden test vectors (0.1)

Language-neutral truth for every binding (TypeScript now; C# and Kotlin later). A binding is "done" for a component only when it passes **100 %** of that component's runtime vectors.

- 177 vector files: `k0/` 56, `k1/` 21, `k2/` 45, `k4/` 35, `k5/` 20. Plus `keys/` (5 TEST-ONLY keys + `test-kids.json`) and `index.json` (SHA-256 of every file's exact bytes).
- One case per file, shape `contracts/schemas/test-vector.schema.json`: `{suite, id, op, description, input, expect}`.
- Files are ASCII-only JSON: every character above U+007E is written as a `\uXXXX` escape (invisible characters stay visible in review). Parse them with any JSON parser.
- `.gitattributes` keeps this folder byte-exact (`-text`); `index.json` hashes would break otherwise.
- **Never edit a vector by hand.** A changed vector needs an ADR, new `index.json`, and the owner's OK.

## How the vectors were produced (Stage 3, 2026-10-31)
1. The planner wrote a throwaway reference implementation of `contracts/spec/k0…k5` in a scratch folder outside this repo (Node 24.16.0 with `@noble/curves` 2.4.0, `@noble/hashes` 2.4.0, `@scure/base` 2.4.0, `yaml` 2.9.1, `safe-regex2` 5.1.2, `ajv` 8.20.0). It is not part of the repo; the executor builds the real implementation from the specs and must reproduce every expected value.
2. Keys (`keys/`): Ed25519 TEST 1 and TEST 2 secret keys from RFC 8032 §7.1; P-256 key 1 from RFC 6979 appendix A.2.5; P-256 keys 2 and 3 = SHA-256 of the ASCII text `plinth TEST-ONLY p256 key 2` / `… key 3`. Every key file says `"test_only": true`.
3. Ed25519 signatures are deterministic (RFC 8032). ES256 signatures were made with RFC 6979 deterministic nonces (noble's default) but are **verify-only**: another library may produce a different valid signature. WebAuthn assertions are synthetic: `authenticatorData = SHA-256("approvals.example") ‖ flags ‖ 00000000`, `clientDataJSON = {"type":"webauthn.get","challenge":…,"origin":"https://approvals.example","crossOrigin":false}`, DER ECDSA over `authenticatorData ‖ SHA-256(clientDataJSON)`. Flags `0x05` (UP+UV, device-bound) or `0x1D` (UP+UV+BE+BS, synced passkey).
4. Synthetic secrets: characters chosen from SHA-256 of `plinth-synthetic:<label>:<counter>` (rule tests) or `plinth-vector:<label>:<counter>` (k5 vectors) mapped onto the needed alphabet. The installation secret for k5 is SHA-256 of `plinth TEST-ONLY installation secret`. The Aadhaar-like number `2949 1013 6515` is synthetic (random digits plus a Verhoeff check digit).
5. Every vector was validated against `contracts/schemas/` with Ajv (strict) and every compiled pack against the rule-pack schemas.
6. **Independent cross-check** (48 checks, all passed): canonical forms and digests re-computed with the RFC 8785 reference package `canonicalize` 2.1.0; the Ed25519 envelope, ES256 envelope, Ed25519 checkpoint, three WebAuthn assertions, the kid of P-256 key 1, the matching code, the full chain hashes of `k1-chain-valid-anchored` and the HMAC fingerprint re-verified with Node's built-in OpenSSL (`node:crypto`), not noble. Also: `k0-der-from-p1363` reproduces RFC 6979 A.2.5 (P-256, SHA-256, "sample") r and s exactly; `k5-verhoeff-wikipedia` and `k5-gstin-valid` use published examples.

## Ops: what each binding calls and compares
"Runtime" ops are required for every language binding and are run by `plinth-conformance`. "Tool" ops cover the TypeScript-only repo tools and run only in this repo's tests.

| suite / op | Kind | Call (TS API) | Compare |
|---|---|---|---|
| pk-json / `parseAndCanonicalize` | runtime | `canonicalize(parseJson(input.json_text))`, `digest(...)` | `expect.canonical`, `expect.digest`; or thrown `PlinthError.code === expect.error` |
| pk-kid / `kidOf` | runtime | `kidOf(input.jwk)`, `canonicalize(thumbprintMembers(input.jwk))` | `kid`, `canonical_member_set`; or `error` |
| pk-der / `p1363ToDer`, `derToP1363` | runtime | hex in, hex out | `der_hex` / `p1363_hex`; or `error` |
| pk-sig / `signingInput` | runtime | `signingInput(type, payload)`, `canonicalize(payload)`, `webauthnChallenge` | `signing_input_hex`, `payload_canonical`, `webauthn_challenge_b64url` |
| pk-sig / `signEd25519` | runtime | key from `input.key_file` (`private_hex`) | `expect.signature` deep-equal |
| pk-sig / `verifyEnvelope` | runtime | `verifyEnvelope(envelope, {trustedKeys: trusted_keys, policy})` | deep-equal result |
| pk-audit / `eventHash`, `genesisPrev` | runtime | `eventHash`, `GENESIS_DIGEST` | `hash`, `canonical`, `prev` |
| pk-audit / `verifyChain` | runtime | `verifyChain({chain, lines, checkpoints, trustedKeys: trusted_keys})` | deep-equal result |
| pk-audit / `lintPersonalData` | runtime | `lintPersonalData(event, [loadPack(BUILTIN_PACKS[id])…], date)` | `rule_ids` = findings' rule_id list |
| pk-approval / `matchingCode` | runtime | `digest(request)`, `matchingCode(request)` | `request_digest`, `matching_code` |
| pk-approval / `verifyRegistryChain` | runtime | `{envelopes, genesisDigest: genesis_digest, highestSeenVersion: highest_seen_version}` | every key in `expect` equals the result's value (the TS result also has `registry`) |
| pk-approval / `verifyApproval` | runtime | `{request, decisions, registry, actualSubjectDigest: actual_subject_digest, allowedActions: allowed_actions, now, isConsumed: id => consumed_ids.includes(id)}` | deep-equal result |
| pk-approval / `verifyBreakGlass` | runtime | `{code, registry, usedDigests: used_digests}` | deep-equal |
| pk-approval / `jwkFromP256Spki` | runtime | hex in | `jwk` or `error` |
| pk-rulepack / `selectAsOf` | runtime | `selectAsOf(rules, rule_id, date)` | `found` and `rev` (0 when not found) |
| pk-rulepack / `localDate` | runtime | `localDate(ts, tz)` | `date` or `error` |
| pk-rulepack / `yamlSubset` | tool | `yamlToValue(yaml_text, "x.yaml")` | `value` deep-equal or `error` |
| pk-rulepack / `lintRegex` | tool | `lintRegex(regex, flags)` | `ok: true` or `error` |
| pk-rulepack / `compilePackDigests` | tool | compile `rules/<pack>` | `manifest_files`, `manifest_digest`, `rule_count`, `test_count` |
| pk-detect / `scan` | runtime | text = `text_parts.join("")` (or `text_repeat.unit` repeated `times`); packs = `loadPack(BUILTIN_PACKS[id])` in order; secret = `hexDecode(installation_secret_hex)` if present | `findings` deep-equal (order matters) or `error` |
| pk-detect / `redact` | runtime | as scan | `output`, `findings`, `counts` deep-equal, or `error` |
| pk-detect / `validator` | runtime | `verhoeffValid` / `gstinValid` / `upiHandleValid(value, handles)` | `valid` |
| pk-detect / `maskSecret` | runtime | each of `values` | `masked` list |

Counts: runtime vectors = 150; tool vectors = 27 (`yamlSubset` 10, `lintRegex` 13, `compilePackDigests` 4). `plinth-conformance` prints `PASS 150/150` on success.

"Deep-equal" means equal JSON values (member order irrelevant, array order relevant). Result objects must not carry extra members unless the table says so.
