# M6 Conformance and packaging — task cards

**Goal:** the public API exactly matches `contracts/api/plinth-api.d.ts`; `plinth-conformance` prints `PASS 150/150`; the npm package is complete and small; library E2E scenarios pass. **Review gate R2 follows this milestone.**

---

### T-M6-01 · API conformance (compile-time)
- **Size:** S
- **Depends on:** T-M5-11
- **Covers:** contracts/api, all ACs (surface)
- **Create:** `packages/ts/test/api-conformance.test.ts`
- **Steps:** `import type * as Api from '../../../contracts/api/plinth-api.js';` (the `.d.ts` is included by `tsconfig.test.json`) and `import * as core from '../src/core/index.js'` (and the same for audit, approval, rulepack, detect, packs, errors, index). For every function and constant in the API file write one line `const _x: typeof Api.<name> = <module>.<name>;` (for example `const _c: typeof Api.canonicalize = core.canonicalize;`) and for classes `const _p: typeof Api.PlinthError = errors.PlinthError;`. Add one runtime `it('exports exactly the API names')` that compares `Object.keys(module).sort()` per subpath with this exact list:
  - core = `ERROR_MESSAGES, GENESIS_DIGEST, PLINTH_VERSION, PlinthError, TEST_KIDS, b64urlDecode, b64urlEncode, canonicalize, createEnvelope, derToP1363, digest, digestBytes, ed25519PublicJwk, hexDecode, hexEncode, isTestKid, isTimestamp, jwkFromP256Spki, kidOf, newNonce, newUuidV7, p1363ToDer, parseJson, sha256Bytes, signEd25519, signatureFromAssertion, signingInput, thumbprintMembers, timestampFromMs, utf8Encode, verifyEnvelope, webauthnChallenge`
  - audit = `appendEvent, createCheckpoint, eventHash, lintPersonalData, parseExport, prunedEventDraft, serializeExport, verifyChain, CHECKPOINT_POLICY`
  - approval = `CHECKPOINT_POLICY, DECISION_POLICY, MemoryConsumedIdStore, REGISTRY_POLICY, SKEW_SECONDS, breakGlassDigest, createApprovalRequest, decisionPayload, matchingCode, newBreakGlassCode, trustedKeysFromRegistry, verifyAndConsume, verifyApproval, verifyBreakGlass, verifyRegistryChain`
  - rulepack = `activeRules, loadPack, localDate, selectAsOf`
  - detect = `MAX_SCAN_INPUT, gstinValid, maskSecret, redact, scan, shannonEntropy, upiHandleValid, verhoeffValid`
  - packs = `BUILTIN_PACKS`
  - root index = the union of all lists above (each name once).
  To make core match: move `PLINTH_VERSION` from `src/index.ts` into a new `src/version.ts`, and have `src/core/index.ts` add `export * from '../errors.js'; export { PLINTH_VERSION } from '../version.js';` (the root index keeps re-exporting core, so nothing else changes). This task may modify `src/index.ts`, `src/version.ts`, `src/core/index.ts` and `packages/ts/test/version.test.ts` (import path only).
  If an internal helper shows up in a list, move it out of the index file (do not add it to the list).
- **Run:** `npm run typecheck` → 0 errors; `npm test -- api-conformance`
- **Stop and ask the owner if:** a type cannot match without changing `contracts/api/plinth-api.d.ts`.
- **Commit:** `test: lock the public API to the contract (T-M6-01)`

### T-M6-02 · tools/conformance.ts: the plinth-conformance CLI
- **Size:** M
- **Depends on:** T-M6-01
- **Covers:** AC-19.1, US-19, NFR-10
- **Read first:** `contracts/test-vectors/README.md` (ops table: runtime ops only)
- **Create:** `packages/ts/src/tools/conformance.ts`, `packages/ts/test/tools/conformance.test.ts`
- **Modify:** root `package.json` (add `"conformance": "node packages/ts/dist/tools/conformance.js contracts/test-vectors"` and set `"check": "npm run lint && npm run typecheck && npm test && npm run packs:check && npm run conformance"`), `.github/workflows/ci.yml` (fast job: add `- run: npm run conformance` after `packs:check`)
- **Interface (exact):** `export function runConformance(vectorsDir: string): { passed: number; total: number; failures: { id: string; reason: string }[]; skipped: number }`. Imports only from `../index.js`, `../packs/index.js`, `node:fs`, `node:path`. First line of the file: `#!/usr/bin/env node`. Tool ops (`yamlSubset`, `lintRegex`, `compilePackDigests`) are counted in `skipped`. Comparison: deep equality on JSON values (write a small `jsonEqual(a, b)` that ignores member order). Script mode prints each failure as `FAIL <id>: <reason>` (reason = `expected <JSON> got <JSON>`, each cut to 200 characters), then `PASS <passed>/<total>` when no failures (exit 0) or `FAILED <failures>/<total>` (exit 1); stderr `usage: plinth-conformance <vectors-dir>` exit 2 without an argument.
- **Tests (write first):** `runConformance(VECTORS_DIR)` → `{passed:150, total:150, failures:[], skipped:27}`; copy the vectors dir to a temp dir, change `expect.digest` of `k0/k0-jcs-sort-basic.json` to `'sha256:' + '0'.repeat(64)` → one failure with id `k0-jcs-sort-basic`.
- **Run:** `npm run build && npm run conformance` → `PASS 150/150`
- **Commit:** `feat(tools): plinth-conformance CLI for consumers (T-M6-02)`

### T-M6-03 · Package build: exports, bin, files, LICENSE/NOTICE, size
- **Size:** S
- **Depends on:** T-M6-02
- **Covers:** NFR-9, ADR-0014
- **Modify:** `packages/ts/package.json`: set `exports` to
  ```json
  {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./core": { "types": "./dist/core/index.d.ts", "default": "./dist/core/index.js" },
    "./audit": { "types": "./dist/audit/index.d.ts", "default": "./dist/audit/index.js" },
    "./approval": { "types": "./dist/approval/index.d.ts", "default": "./dist/approval/index.js" },
    "./rulepack": { "types": "./dist/rulepack/index.d.ts", "default": "./dist/rulepack/index.js" },
    "./detect": { "types": "./dist/detect/index.d.ts", "default": "./dist/detect/index.js" },
    "./packs": { "types": "./dist/packs/index.d.ts", "default": "./dist/packs/index.js" }
  }
  ```
  and add `"bin": { "plinth-conformance": "./dist/tools/conformance.js" }`.
- **Create:** `packages/ts/LICENSE` and `packages/ts/NOTICE` (byte copies of the root files), `packages/ts/test/package.test.ts`
- **Tests (write first):** run `npm pack --dry-run --json --workspace packages/ts` with `execFileSync('npm', …, {shell: true})`; parse JSON; › `package contains no repo-tools or tests`: no file path starts with `dist/repo-tools` or `test/` or `src/`; › `package contains the entry points`: includes `dist/index.js`, `dist/core/index.js`, `dist/packs/builtin.js`, `dist/tools/conformance.js`, `LICENSE`, `NOTICE`, `README.md`, `package.json`; › `unpacked size within budget`: `unpackedSize <= 600000`; › `LICENSE copies are identical`.
- **Run:** `npm run build && npm test -- package`
- **Commit:** `build: finalise plinth-kit package exports and contents (T-M6-03)`

### T-M6-04 · Library E2E scenarios and M6 close (gate R2)
- **Size:** M
- **Depends on:** T-M6-03
- **Covers:** E2E-1…E2E-4 (`docs/testing.md` §4), AC-4.1–4.3, AC-11.3, AC-8.1, AC-17.3
- **Create:** `packages/ts/test/e2e/library.test.ts` importing only from the built package through its public subpaths: `plinth-kit/core`, `plinth-kit/audit`, `plinth-kit/approval`, `plinth-kit/rulepack`, `plinth-kit/detect`, `plinth-kit/packs` (the workspace links `plinth-kit` to `packages/ts`; run `npm run build` before the test).
- **Tests (write first):** E2E-1 (sign with ed25519-test-1, verify valid, flip `payload.note` → `PK_SIG_INVALID`); E2E-2 (take vector `k2-approval-valid-webauthn`, `verifyAndConsume` with a `MemoryConsumedIdStore` twice → valid then `PK_APPROVAL_REPLAYED`); E2E-3 (append the 5 drafts of `k1-chain-valid-anchored`'s events with `appendEvent`, checkpoint seq 4 with ed25519-test-2 at `2026-11-02T10:00:00.000Z`, `serializeExport` → `parseExport` → `verifyChain` → `status:'verified'`; the produced lines deep-equal the vector's lines); E2E-4 (`redact` the `k5-redact-mixed` text → its expected output).
- **Steps:** after green: `npm run check`; ask the owner to run **gate R2** (`docs/testing.md` §8 with `<M6>`); record in LOG; critical/high findings become `T-M6-05…` fix tasks before MR.
- **Run:** `npm run build && npm test -- e2e`; `npm run check`
- **Done when:** E2E green · R2 recorded · STATUS "Next step: T-MR-01"
- **Commit:** `test(e2e): library scenarios through public subpaths; close M6 (T-M6-04)`
