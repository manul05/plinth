# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/). Every pull request into `main` adds its
lines under **Unreleased**; a release renames that heading to the version and date, and the same
text becomes the GitHub Release notes.

## [Unreleased]

## [0.1.0] - 2026-11-26

### Added
- **Repository & governance:** Portfolio repo conventions v1, git guard hooks (`.githooks/`), CI & `security-scan` (`gitleaks` + `osv-scanner`), contracts (`contracts/spec/`, `contracts/schemas/`, `contracts/api/plinth-api.d.ts`, `contracts/errors.json`, 183 golden test vectors + 6 test keys).
- **K0 Core (`plinth-kit/core`):** Strict I-JSON `parseJson`, RFC 8785 integer-only `canonicalize` & `digest`, key thumbprints (`kidOf`, `jwkFromP256Spki`, `isTestKid`), strict DER ↔ P1363 conversion, Ed25519 signing, and fail-closed `verifyEnvelope` (`Ed25519` with `{zip215: false}`, `ES256` with `lowS: false`, and `webauthn-ES256` with real-authenticator test vectors).
- **K1 Audit (`plinth-kit/audit`):** Hash-chained `appendEvent`, JSON Lines `serializeExport` / `parseExport`, signed `createCheckpoint` & `prunedEventDraft`, fail-closed `verifyChain`, and test-time `lintPersonalData`.
- **K2 Approvals (`plinth-kit/approval`):** Action-bound `createApprovalRequest` & 6-digit `matchingCode`, `verifyRegistryChain` with anti-rollback and distinct-approver `update_threshold`, enforcement-side `verifyApproval` & atomic `verifyAndConsume` (`MemoryConsumedIdStore`), and one-time `newBreakGlassCode` / `verifyBreakGlass`.
- **K4 Rule packs (`plinth-kit/rulepack`, `plinth-kit/packs`):** `selectAsOf` / `localDate` with strict calendar date checks, `loadPack` digest verification, and deterministic `compile-packs` compiler (safe YAML subset, portable regex dialect lint, `safe-regex2`, Ajv schema validation).
- **K5 Detection (`plinth-kit/detect`):** `scan` and `redact` (with partial-overlap tail protection and keyed HMAC fingerprints) across four built-in packs (`pk.secrets.global`, `pk.secrets.india`, `pk.pii.india`, `pk.untrusted-text`; 38 rule-revision entries, 73 pack tests), plus masked CLI scanner `detect-file`.
- **Conformance & vendoring:** Shipped `plinth-conformance` CLI (`PASS 156/156`), deterministic release `snapshot` builder (`SHA256SUMS` + `PLINTH_VERSION`), consumer `vendor` tool (`plinth.pin` + `.gitattributes`), `scripts/verify-snapshot.sh`, and scratch consumer E2E test (`E2E-5`).
- **Security review & ADRs:** Completed `docs/07-security-review.md` (Gate `G-final` sign-off, 14 mutation checks, 3 independent reviews R1/R2/MR with all findings resolved) and `ADR-0001`–`ADR-0027`.

<!-- Headings to use when needed: Added, Changed, Deprecated, Removed, Fixed, Security -->
