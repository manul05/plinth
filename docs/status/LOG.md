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
