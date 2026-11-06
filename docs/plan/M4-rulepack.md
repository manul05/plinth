# M4 K4 Rule-pack format — task cards

**Goal:** the 35 `k4` vectors pass; `rules/` compiles to `packs/` and `src/packs/builtin.ts` reproducibly; `loadPack` checks digests. Pack **tests** start running in M5 (they need the matcher).
**Demo:** `npm run packs:check` → `packs: up to date`; change one character in `packs/pk.pii.india/rules.json` → exit 1 naming the file.
Runtime files: `packages/ts/src/rulepack/`; Node-only compiler: `packages/ts/src/repo-tools/`; tests: `packages/ts/test/rulepack/` and `test/repo-tools/`.

---

### T-M4-01 · Red skeleton: k4 vector runner
- **Size:** S
- **Depends on:** T-M3-09
- **Covers:** AC-13.1–13.3, AC-14.1 (failing harness)
- **Read first:** `contracts/spec/k4-rulepack.md`
- **Create:** `packages/ts/test/rulepack/k4-vectors.test.ts`; stubs `packages/ts/src/rulepack/index.ts`, `asof.ts`, `load.ts` (runtime names from the API file) and `packages/ts/src/repo-tools/yaml-subset.ts` (`export function yamlToValue(text: string, fileName: string): unknown`), `regex-lint.ts` (`export function lintRegex(pattern: string, flags: string): void`), `compile-packs.ts` (`export function compilePacks(opts: { rulesDir: string; packsDir: string; builtinPath: string; check: boolean; runTests: boolean }): { packs: number; rules: number; tests: number; differing: string[] }`), all throwing `not implemented`.
- **Modify:** `packages/ts/src/index.ts` (add `export * from './rulepack/index.js';`)
- **Tests (write first):** ops `selectAsOf` (`r = selectAsOf(rules, rule_id, date)`; `{found: r !== null, rev: r ? r.rev : 0}` equals expect), `localDate` (value or `PlinthError` code), `yamlSubset` (`yamlToValue(yaml_text, 'x.yaml')` deep-equals `expect.value` or throws code), `lintRegex` (no throw ⇔ `expect.ok`, else code), `compilePackDigests` (call `compilePacks({rulesDir: REPO_ROOT+'/rules', packsDir: <temp dir from fs.mkdtempSync>, builtinPath: <temp file>, check:false, runTests:false})` once in `beforeAll`, then read `<temp>/<pack_id>/pack.json`; its `files` equals `expect.manifest_files`, `digest(manifest) === expect.manifest_digest`, rule and test counts equal).
- **Run:** `npm test -- k4` → 35 failed. Paste.
- **Commit:** `test(rulepack): add failing k4 golden-vector runner (T-M4-01)`

### T-M4-02 · asof.ts: selectAsOf and localDate
- **Size:** S
- **Depends on:** T-M4-01
- **Covers:** AC-14.1
- **Read first:** `contracts/spec/k4-rulepack.md` §4
- **Modify:** `packages/ts/src/rulepack/asof.ts`
- **Steps:** exactly spec §4. `localDate`: `Asia/Kolkata` → `new Date(Date.parse(ts) + 19800000).toISOString().slice(0, 10)`; `UTC` → `new Date(Date.parse(ts)).toISOString().slice(0, 10)`; check the tz first: any tz other than these two → `PK_RULEPACK_TZ_UNSUPPORTED`; then a `ts` for which `isTimestamp(ts)` is false → `PlinthError('PK_ENCODING_INVALID', 'ts')`.
- **Tests (write first):** 8 runtime k4 vectors; `localDate('nope','UTC')` → `PK_ENCODING_INVALID`.
- **Run:** `npm test -- k4` → 8 pass
- **Commit:** `feat(rulepack): as-of selection and local dates (T-M4-02)`

### T-M4-03 · repo-tools/yaml-subset.ts
- **Size:** M
- **Depends on:** T-M4-01
- **Covers:** AC-13.1, TM-26
- **Read first:** `contracts/spec/k4-rulepack.md` §2 (the whole algorithm, with the exact `yaml` options)
- **Modify:** `packages/ts/src/repo-tools/yaml-subset.ts`
- **Steps:** `import { parseDocument, visit, isScalar } from 'yaml'`. Errors in order: first `doc.errors` entry decides (codes as spec). Then `visit(doc, { Alias: () => fail ANCHOR, Node(_k, n) { if anchor → ANCHOR; if tag → TAG; if isScalar(n) && n.type === 'PLAIN' → scalar rule } })` — collect the first error, return `visit.BREAK`, throw after the visit. Then `const v = doc.toJS(); canonicalize(v); return v;`. Throw `PlinthError(code, fileName)`.
- **Tests (write first):** 10 `yamlSubset` vectors; plus `yamlToValue("a: 'x'\n", 'f.yaml')` deep-equals `{a:'x'}` and `yamlToValue('a: -5\n','f')` → `{a:-5}`.
- **Run:** `npm test -- k4`
- **Commit:** `feat(rulepack): safe YAML subset reader (T-M4-03)`

### T-M4-04 · repo-tools/regex-lint.ts
- **Size:** S
- **Depends on:** T-M4-01
- **Covers:** AC-13.2, TM-23
- **Read first:** `contracts/spec/k4-rulepack.md` §5
- **Modify:** `packages/ts/src/repo-tools/regex-lint.ts`
- **Steps:** exactly the 4 steps; allowed escapes set `['b','n','r','t','\\','.','-','/','[',']','(',')','{','}','*','+','?','|','^','$']`; `\x` + 2 hex. `import safeRegex from 'safe-regex2'`.
- **Tests (write first):** 13 `lintRegex` vectors; and every `regex` in `rules/*/rules.yaml` passes (read with `yamlToValue`).
- **Run:** `npm test -- k4`
- **Commit:** `feat(rulepack): portable regex dialect lint (T-M4-04)`

### T-M4-05 · repo-tools/schema.ts: Ajv validators for contracts
- **Size:** S
- **Depends on:** T-M4-01
- **Covers:** compile step 2 (`PK_RULEPACK_SCHEMA`)
- **Create:** `packages/ts/src/repo-tools/schema.ts`, `packages/ts/test/repo-tools/schema.test.ts`
- **Interface (exact):** `export function validateAgainst(schemaFile: string, value: unknown): string | null` — returns `null` when valid, else `"<instancePath> <message>"` of the first Ajv error. Loads all schemas once from `<repo root>/contracts/schemas` (repo root = 4 levels up from `dist/repo-tools/schema.js`, computed with `fileURLToPath(new URL('../../../../', import.meta.url))`).
- **Tests (write first):** each `rules/*/pack.yaml` value is valid for `pk-rulepack.pack-source.schema.json`; `validateAgainst('pk-rulepack.pack-source.schema.json', {spec:'x'})` returns a string (not `null`).
- **Commit:** `feat(rulepack): schema validation helper for repo tools (T-M4-05)`

### T-M4-06 · repo-tools/compile-packs.ts: compile and write packs + builtin.ts
- **Size:** M
- **Depends on:** T-M4-02, T-M4-03, T-M4-04, T-M4-05
- **Covers:** AC-13.3 (digests), NFR-7
- **Read first:** `contracts/spec/k4-rulepack.md` §1, §3
- **Create:** `packages/ts/src/packs/index.ts`, `packages/ts/src/packs/builtin.ts` (generated), `packs/` (generated)
- **Modify:** `packages/ts/src/repo-tools/compile-packs.ts`, root `package.json` (add scripts `"packs:build": "npm run build && node packages/ts/dist/repo-tools/compile-packs.js"` and `"packs:check": "npm run build && node packages/ts/dist/repo-tools/compile-packs.js --check"`)
- **Steps:** implement spec §3 steps 1–6 and 8 (step 7 when `runTests` is true: until T-M5-06 it throws `not implemented` if `runTests` is true). Write each JSON file as `canonicalize(value)` with **no trailing newline**. `builtin.ts` content, exactly:
  ```ts
  // GENERATED by packages/ts/src/repo-tools/compile-packs.ts from rules/. Do not edit.
  import type { CompiledPack } from '../rulepack/index.js';
  export const BUILTIN_PACKS = {
    'pk.pii.india': <canonical JSON of {manifest, rules, tests}> as CompiledPack,
    ...one line per pack, keys in ascending order...
  } as const;
  ```
  (each value is the canonical JSON text of `{manifest, rules, tests}` followed by ` as CompiledPack,`). `packs/index.ts`: `export { BUILTIN_PACKS } from './builtin.js'; export type BuiltinPackId = 'pk.secrets.global' | 'pk.secrets.india' | 'pk.pii.india' | 'pk.untrusted-text';`. When run as a script (`process.argv[1]` ends with `compile-packs.js`): `--check` sets `check:true`; default `runTests:false` until T-M5-06; prints `packs: 4 compiled, 35 rules, 70 tests` (or `packs: up to date` in check mode) and exits 0, or prints `packs: out of date: <paths>` / the error message to stderr and exits 1.
- **Order of work (chicken-and-egg):** write compile-packs.ts → `npm run build` → `node packages/ts/dist/repo-tools/compile-packs.js` (generates `packs/` and `builtin.ts`) → then create `packs/index.ts` → `npm run build` again.
- **Tests (write first):** the 4 `compilePackDigests` vectors; `builtin.ts` starts with the GENERATED comment line.
- **Run:** `npm test -- k4` → 35/35; `npm run packs:build`
- **Commit:** `feat(rulepack): compile rule packs to canonical JSON and builtin.ts (T-M4-06)`

### T-M4-07 · load.ts: loadPack and activeRules
- **Size:** S
- **Depends on:** T-M4-06
- **Covers:** AC-15.1, TM-25
- **Read first:** `contracts/spec/k4-rulepack.md` §4 (`activeRules`), §7
- **Modify:** `packages/ts/src/rulepack/load.ts`
- **Create:** `packages/ts/test/rulepack/load.test.ts`
- **Steps:** exactly spec §7 and §4.
- **Tests (write first):** `loadPack(BUILTIN_PACKS['pk.pii.india']).rules.length === 7`; global 12, india 8, untrusted 8; › `tampered rules file is refused`: deep copy, change `rules.rules[0].title` → `PK_RULEPACK_FILE_HASH_MISMATCH`; manifest `spec: 'pk-rulepack/2.0'` → `PK_SPEC_UNSUPPORTED`; `activeRules(loadPack(global), '2026-10-30').length === 0` (before effective_from) and `('2026-11-01')` → 12.
- **Commit:** `feat(rulepack): digest-checked pack loading (T-M4-07)`

### T-M4-08 · M4 close: packs:check in CI, status
- **Size:** S
- **Depends on:** T-M4-07
- **Covers:** AC-13.3 (drift), NFR-7
- **Modify:** `.github/workflows/ci.yml` (in `fast`, after `npm run build`, add `- run: npm run packs:check`), root `package.json` (`"check": "npm run lint && npm run typecheck && npm test && npm run packs:check"`), `.gitattributes` (only if DNB-001 lines are missing: see `docs/do-not-break.md`), STATUS, LOG, 06-plan
- **Tests (write first):** `packages/ts/test/repo-tools/packs-check.test.ts` › copy `packs/` to a temp dir, change one character in `pk.pii.india/rules.json`, run `compilePacks({... packsDir: temp, check:true, runTests:false})` with `builtinPath` = the real `packages/ts/src/packs/builtin.ts` → `differing` deep-equals `['pk.pii.india/rules.json']` (paths relative to `packsDir`, forward slashes, sorted). Unchanged copy → `[]`.
- **Run:** `npm run check` → green; push; CI green
- **Commit:** `ci: fail on rule-pack drift; close milestone M4 (T-M4-08)`
