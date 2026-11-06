# M0 Setup — task cards

**Goal:** a working repo on `development` with hooks, the pinned toolchain, contract self-checks and CI green on an (almost) empty library.
**Before T-M0-01, owner gate G0** (plain English, about 10 minutes on github.com, on your **personal** GitHub account, not `hitarthigroup`):
1. Create a new **private** repository named `plinth`, with no README, licence or .gitignore.
2. Settings → General → Pull Requests: tick only "Allow merge commits"; untick squash and rebase; leave "Automatically delete head branches" OFF.
3. Settings → Code security: turn on Dependabot alerts and security updates.
4. Settings → Actions → General → Workflow permissions: "Read repository contents".
5. Tell the agent the repository URL (for example `https://github.com/<your-user>/plinth.git`).

All commands run from the repo root in **Git Bash** unless stated.

---

### T-M0-01 · Initialise git, install hooks, prove the guard
- **Size:** S
- **Depends on:** gate G0
- **Covers:** NFR-8 (setup), TM-32 (guard layer)
- **Read first:** `START-HERE.md`; `AGENTS.md`; `docs/decisions/0001-adopt-repo-conventions.md`
- **Create:** nothing new (all files already exist from Stage 3)
- **Modify:** `docs/status/STATUS.md`, `docs/status/LOG.md`
- **Do not touch:** anything else. If another file seems to need changing, STOP and ask.
- **Steps:**
  1. `git init -b development` then `git remote add origin <URL from the owner>`.
  2. `sh scripts/install-hooks.sh` → expect `Installed: core.hooksPath=.githooks`. Then `sh scripts/install-hooks.sh --check` → expect `OK: hooks active (core.hooksPath=.githooks).`
  3. `git add -A` and `git commit -m "chore: import Stage 3 plan and repo skeleton (T-M0-01)"` (Conventional Commit body: `Why: start Plinth from the Stage 3 plan.`).
  4. `git push -u origin development`. Then `git ls-remote origin` must show `refs/heads/development` and **no** `refs/heads/main`.
  5. Prove the guard: `git push origin development:main` → must print `BLOCKED: push to protected ref 'refs/heads/main'` and `no owner approval`. Then `OWNER_APPROVES_PUSH=deadbee git push origin development:main` → must print `BLOCKED` and `different commit`.
  6. Ask the owner to: (a) set the default branch to `development` (Settings → General); (b) create `main` from `development` on GitHub (branch dropdown → "Create branch main from development"); (c) close the ALARM issue that `main-alarm` opens with the comment `initial main, expected`.
  7. Ask each agent in a fresh session (Claude Code, Antigravity, Codex if used): "What is Rule 0 item 1 in this repo, and what is the merge phrase?" Paste the three answers. The merge phrase must be `now it is time to merge plinth to main`.
- **Tests (write first):** none (no code). The checks are the outputs in steps 2, 4, 5, 7.
- **Run:** the commands above; paste every output line that is quoted as "expect".
- **Done when:** both BLOCKED messages pasted · `git ls-remote origin` shows development (and main only after the owner created it) · agent answers pasted · STATUS and LOG updated
- **Stop and ask the owner if:** any expected text differs; an agent cannot answer from `AGENTS.md` (note it in LOG; do not "fix" AGENTS.md).
- **Commit:** `chore: import Stage 3 plan and repo skeleton (T-M0-01)`

### T-M0-02 · Root npm workspace and the pinned toolchain
- **Size:** M
- **Depends on:** T-M0-01
- **Covers:** NFR-4, NFR-8, TM-28
- **Read first:** `docs/04-architecture.md` §2–§3; `docs/decisions/0003-npm-not-pnpm.md`, `0008-exact-pins-with-cooldown.md`, `0009-tooling.md`
- **Create:** `package.json`, `.nvmrc`, `tsconfig.base.json`, `biome.json`, `vitest.config.ts`, `vitest.perf.config.ts`, `packages/ts/package.json`, `packages/ts/tsconfig.json`, `packages/ts/tsconfig.test.json`, `packages/ts/src/index.ts`, `packages/ts/README.md`, `package-lock.json` (generated)
- **Modify:** `.gitignore` (append 3 lines)
- **Do not touch:** anything else.
- **Exact file contents:**
  - `.nvmrc`: `24.16.0`
  - `package.json`:
    ```json
    {
      "name": "plinth-repo",
      "private": true,
      "version": "0.1.0",
      "type": "module",
      "license": "MIT",
      "engines": { "node": ">=24.16.0 <25" },
      "workspaces": ["packages/ts"],
      "scripts": {
        "typecheck": "tsc -p packages/ts/tsconfig.json --noEmit && tsc -p packages/ts/tsconfig.test.json --noEmit",
        "lint": "biome check .",
        "format": "biome format --write .",
        "test": "vitest run",
        "test:perf": "vitest run --config vitest.perf.config.ts",
        "build": "tsc -p packages/ts/tsconfig.json",
        "check": "npm run lint && npm run typecheck && npm test && npm run build"
      },
      "devDependencies": {
        "@biomejs/biome": "2.5.15",
        "@types/node": "24.19.2",
        "ajv": "8.20.0",
        "safe-regex2": "5.1.2",
        "typescript": "7.0.2",
        "vite": "8.3.4",
        "vitest": "5.0.5",
        "yaml": "2.9.1"
      }
    }
    ```
  - `tsconfig.base.json`:
    ```json
    {
      "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2024", "DOM"],
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitOverride": true,
        "verbatimModuleSyntax": true,
        "isolatedModules": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
      }
    }
    ```
  - `packages/ts/tsconfig.json` (build: library + tools):
    ```json
    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": { "outDir": "dist", "rootDir": "src", "declaration": true, "sourceMap": false, "types": ["node"] },
      "include": ["src"]
    }
    ```
    (`types: ["node"]` is needed by `src/tools` and `src/repo-tools`; library code is kept free of Node by the portability test, T-M0-06.)
  - `packages/ts/tsconfig.test.json`:
    ```json
    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": { "noEmit": true, "types": ["node"], "rootDir": "../.." },
      "include": ["src", "test", "../../contracts/api"]
    }
    ```
  - `packages/ts/package.json`:
    ```json
    {
      "name": "plinth-kit",
      "version": "0.1.0",
      "description": "Plinth: canonical JSON, signed envelopes, audit chain, two-hands approvals, rule packs and secret/PII detection, with golden test vectors.",
      "license": "MIT",
      "type": "module",
      "sideEffects": false,
      "engines": { "node": ">=24.16.0" },
      "exports": {
        ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
      },
      "files": ["dist/index.js", "dist/index.d.ts", "dist/errors.js", "dist/errors.d.ts", "dist/core", "dist/audit", "dist/approval", "dist/rulepack", "dist/detect", "dist/packs", "dist/tools", "LICENSE", "NOTICE", "README.md"],
      "dependencies": { "@noble/curves": "2.4.0", "@noble/hashes": "2.4.0", "@scure/base": "2.4.0" }
    }
    ```
    (More `exports` entries and `bin` are added in T-M6-03.)
  - `biome.json`:
    ```json
    {
      "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
      "files": { "includes": ["**", "!**/dist", "!**/node_modules", "!contracts/test-vectors", "!packs", "!snapshot", "!packages/ts/src/packs/builtin.ts", "!**/package-lock.json"] },
      "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 120 },
      "linter": { "enabled": true, "rules": { "recommended": true } },
      "javascript": { "formatter": { "quoteStyle": "single" } }
    }
    ```
  - `vitest.config.ts`:
    ```ts
    import { defineConfig } from 'vitest/config';
    export default defineConfig({
      test: { include: ['packages/ts/test/**/*.test.ts'], testTimeout: 20000, pool: 'forks' },
    });
    ```
  - `vitest.perf.config.ts`:
    ```ts
    import { defineConfig } from 'vitest/config';
    export default defineConfig({
      test: { include: ['packages/ts/test/perf/**/*.perf.ts'], testTimeout: 120000, pool: 'forks', fileParallelism: false },
    });
    ```
  - `packages/ts/src/index.ts`: `export const PLINTH_VERSION = '0.1.0' as const;`
  - `packages/ts/README.md`: two lines: `# plinth-kit` and `TypeScript binding of Plinth 0.1. Contracts, vectors and docs: see the Plinth repository (contracts/README.md, docs/consuming.md). Licence: MIT.`
  - Append to `.gitignore`: `snapshot/`, `packages/ts/dist/`, `spike-output/`
- **Steps:**
  1. Write the files above exactly.
  2. `npm install` (creates `package-lock.json`). Then `npm ls --depth=0` must list exactly the 8 dev dependencies at the pinned versions and `plinth-kit@0.1.0 -> ./packages/ts`.
  3. `npm ls @noble/curves @noble/hashes @scure/base` shows 2.4.0 for each.
- **Tests (write first):** none in this task (T-M0-03 adds the first test).
- **Run:** `npm run typecheck` → exit 0; `npm run lint` → exit 0 (if Biome reports formatting in the new files, run `npm run format` once and re-run lint); `npm run build` → creates `packages/ts/dist/index.js` and `index.d.ts`.
- **Done when:** all three commands exit 0 · `package-lock.json` committed · versions in `npm ls` match exactly · STATUS updated
- **Stop and ask the owner if:** `npm install` changes any version; Biome rejects a key in `biome.json` (Biome 2.5 schema); TypeScript 7 reports an option as unknown.
- **Commit:** `build: add npm workspace and pinned toolchain (T-M0-02)`

### T-M0-03 · First test: version constant and test helper for vectors
- **Size:** S
- **Depends on:** T-M0-02
- **Covers:** NFR-8; groundwork for every vector test
- **Read first:** `contracts/test-vectors/README.md` (ops table)
- **Create:** `packages/ts/test/version.test.ts`, `packages/ts/test/vectors.ts`, `packages/ts/test/vectors.test.ts`
- **Modify:** none
- **Do not touch:** anything else.
- **Interface (exact)** for `packages/ts/test/vectors.ts`:
  ```ts
  export const REPO_ROOT: string;           // absolute path of the repo root, from import.meta.url (three levels up from test/)
  export const VECTORS_DIR: string;         // REPO_ROOT + '/contracts/test-vectors'
  export interface Vector { suite: string; id: string; op: string; description: string; input: Record<string, unknown>; expect: Record<string, unknown> }
  export function loadVectors(component: 'k0' | 'k1' | 'k2' | 'k4' | 'k5', op?: string): Vector[]; // sorted by id; reads every *.json in the folder
  export function loadKey(relPath: string): { name: string; alg: 'Ed25519' | 'ES256'; private_hex: string; public_jwk: Record<string, string>; kid: string };
  ```
  Use `node:fs` `readdirSync`/`readFileSync` and `node:path` `join`, `fileURLToPath(new URL('../../../', import.meta.url))` for `REPO_ROOT`.
- **Tests (write first):**
  - `version.test.ts` › `PLINTH_VERSION matches package.json`: `PLINTH_VERSION === '0.1.0'` and equals `JSON.parse(readFileSync('packages/ts/package.json')).version`.
  - `vectors.test.ts` › `vector counts`: `loadVectors('k0').length === 56`, `k1` 21, `k2` 45, `k4` 35, `k5` 20.
  - `vectors.test.ts` › `ops filter`: `loadVectors('k0', 'verifyEnvelope').length === 19`; `loadVectors('k2', 'verifyApproval').length === 31`.
  - `vectors.test.ts` › `loadKey`: `loadKey('keys/ed25519-test-1.json').kid === 'sha256:90facafea9b1556698540f70c0117a22ea37bd5cf3ed3c47093c1707282b4b89'`.
- **Run:** `npm test` → 4 tests pass; `npm run typecheck` → 0 errors; `npm run lint` → 0 errors
- **Done when:** all pass · no files changed outside Create · STATUS updated
- **Stop and ask the owner if:** a count differs (the vectors may have been changed: do not edit them).
- **Commit:** `test: add version test and golden-vector loader (T-M0-03)`

### T-M0-04 · Contract self-checks (schemas, vectors, index hashes, errors, dependencies)
- **Size:** M
- **Depends on:** T-M0-03
- **Covers:** TM-32, TM-28, NFR-4
- **Read first:** `contracts/README.md`; `contracts/errors.json`; `docs/decisions/0008-exact-pins-with-cooldown.md`
- **Create:** `packages/ts/test/contracts.test.ts`, `packages/ts/test/deps.test.ts`
- **Modify:** none
- **Do not touch:** anything under `contracts/`.
- **Steps:** load Ajv with `import { Ajv2020 } from 'ajv/dist/2020.js'`; `new Ajv2020({ strict: true, allErrors: true })`; `addSchema` every file in `contracts/schemas/`; fetch validators with `ajv.getSchema('https://plinth.invalid/schemas/<file>')`.
- **Tests (write first):** `contracts.test.ts`
  - `every schema compiles`: 17 schema files, each `getSchema` returns a function.
  - `every vector matches test-vector.schema.json`: all 177 vectors valid.
  - `every key file matches test-key.schema.json`: 5 files `keys/*-test-*.json` valid; `keys/test-kids.json` has exactly 5 kids equal to the 5 key files' kids.
  - `vector files match index.json`: for each entry in `contracts/test-vectors/index.json` (183 entries), `"sha256:" + sha256(file bytes)` (use `node:crypto` `createHash`) equals `sha256`; and no `.json` file in the folder (except `index.json`) is missing from the index.
  - `every error code used by vectors exists`: collect all strings matching `^PK_[A-Z0-9_]+$` in `expect` values of all vectors (74 distinct); each is in `errors.json` (97 entries, unique codes, every `message` non-empty and ending with `.`).
  - `vector files are ASCII`: no byte > 0x7E except LF in any vector file.
  `deps.test.ts`
  - `runtime dependencies are exactly the pinned three`: `packages/ts/package.json` `dependencies` deep-equals `{"@noble/curves":"2.4.0","@noble/hashes":"2.4.0","@scure/base":"2.4.0"}`.
  - `dev dependencies are pinned exactly`: every version in root `devDependencies` matches `^[0-9]+\.[0-9]+\.[0-9]+$`.
  - `lockfile agrees`: `package-lock.json` `packages["node_modules/@noble/curves"].version === "2.4.0"` (and the same for the other two runtime deps and `typescript` 7.0.2, `vitest` 5.0.5).
- **Run:** `npm test` → all pass; `npm run typecheck`; `npm run lint`
- **Done when:** all pass · STATUS updated
- **Stop and ask the owner if:** any contract check fails (never edit contracts to make it pass).
- **Commit:** `test: check contracts, vector hashes, error codes and pins (T-M0-04)`

### T-M0-05 · CI and security-scan workflows, Dependabot
- **Size:** M
- **Depends on:** T-M0-04
- **Covers:** TM-28, TM-30, NFR-8
- **Read first:** `docs/testing.md` §7; `docs/04-architecture.md` §2 (action and image versions)
- **Create:** `.github/workflows/ci.yml`, `packages/ts/test/workflows.test.ts`
- **Modify:** `.github/workflows/security-scan.yml` (replace the two `{{…}}` placeholders and the `actions/checkout@v4` line), `.github/dependabot.yml` (delete the `nuget` and `gradle` blocks)
- **Do not touch:** `main-alarm.yml`, hooks, anything else. (Editing workflows triggers an approval prompt for the owner: that is expected.)
- **Exact `ci.yml`:**
  ```yaml
  name: ci
  on:
    push:
      branches: [development]
      paths-ignore: ['**.md', 'docs/**']
    pull_request:
      branches: [main]
    workflow_dispatch:
  permissions:
    contents: read
  concurrency:
    group: ci-${{ github.ref }}
    cancel-in-progress: true
  jobs:
    fast:
      name: lint, typecheck, unit, build
      runs-on: ubuntu-latest
      timeout-minutes: 10
      steps:
        - uses: actions/checkout@v7
        - uses: actions/setup-node@v7
          with:
            node-version-file: .nvmrc
            cache: npm
        - run: npm ci
        - run: npm run lint
        - run: npm run typecheck
        - run: npm test
        - run: npm run build
        - run: sh scripts/check-doc-sizes.sh
    full:
      name: perf and release checks
      if: github.event_name != 'push'
      needs: fast
      runs-on: ubuntu-latest
      timeout-minutes: 15
      steps:
        - uses: actions/checkout@v7
        - uses: actions/setup-node@v7
          with:
            node-version-file: .nvmrc
            cache: npm
        - run: npm ci
        - run: npm run build
        - run: npm run test:perf --if-present
  ```
- **security-scan.yml edits:** `actions/checkout@v4` → `actions/checkout@v7`; `{{GITLEAKS_VERSION}}` → `v8.30.1`; `{{OSV_SCANNER_VERSION}}` → `v2.7.0`; delete the two lines starting `# UNVERIFIED at time of writing` and the two lines after it.
- **Steps:** write files; commit; push to `development`; in GitHub → Actions run `ci` and `security-scan` once with "Run workflow".
- **Tests (write first):** `packages/ts/test/workflows.test.ts` › `workflows contain no template placeholders`: no file in `.github/workflows/` or `.github/dependabot.yml` matches the regex `/(?<!\$)\{\{/` (GitHub's own `${{ … }}` expressions are allowed; `pull_request_template.md` keeps its per-PR `{{…}}` blanks on purpose); › `ci uses the pinned node file`: `ci.yml` contains `node-version-file: .nvmrc` twice.
- **Run:** `npm test`; then the two workflow runs → paste both run URLs and their result (green).
- **Done when:** both runs green · STATUS updated with the run links
- **Stop and ask the owner if:** a docker image tag does not exist (pull error): report it; do not pick another version without the owner.
- **Commit:** `ci: add ci workflow, pin scanner images, trim dependabot (T-M0-05)`

### T-M0-06 · Portability guard (NFR-1)
- **Size:** S
- **Depends on:** T-M0-03
- **Covers:** NFR-1, NFR-12, ADR-0004
- **Read first:** `docs/decisions/0004-runtime-neutral-library.md`
- **Create:** `packages/ts/test/portability.test.ts`
- **Modify:** none
- **Tests (write first):** walk every `.ts` file under `packages/ts/src` **except** `src/tools/**`, `src/repo-tools/**` and `src/packs/builtin.ts`; for each file text:
  - `library code imports no node built-ins`: no match for `/from\s+['"]node:/` and `/import\(\s*['"]node:/`.
  - `library code has no eval, Function, require, fetch or console`: no match for `/\beval\s*\(/`, `/new\s+Function\b/`, `/\brequire\s*\(/`, `/\bfetch\s*\(/`, `/\bconsole\./`.
  - `library code does not import tool-only packages`: no match for `/from\s+['"](ajv|yaml|safe-regex2)/`.
  - `the walk found files`: at least 1 file (today only `index.ts`).
  Also: `tools never import repo-tools`: no file under `src/tools/` matches `/repo-tools/`.
- **Run:** `npm test` → pass
- **Done when:** pass · STATUS updated
- **Stop and ask the owner if:** never needed here.
- **Commit:** `test: guard runtime portability of library code (T-M0-06)`

### T-M0-07 · Errors module mirrored from contracts/errors.json
- **Size:** S
- **Depends on:** T-M0-04
- **Covers:** NFR-6 (error detail rule), all ACs that name error codes
- **Read first:** `contracts/spec/errors.md`; `contracts/api/plinth-api.d.ts` (PlinthError, ERROR_MESSAGES)
- **Create:** `packages/ts/src/errors.ts`, `packages/ts/test/errors.test.ts`
- **Modify:** `packages/ts/src/index.ts` (add `export * from './errors.js';`)
- **Interface (exact):**
  ```ts
  export type ErrorCode = `PK_${string}`;
  export const ERROR_MESSAGES: Readonly<Record<string, string>> = Object.freeze({ /* all 97 entries copied exactly from contracts/errors.json, same order */ });
  export class PlinthError extends Error {
    readonly code: ErrorCode;
    readonly detail: string | undefined;
    constructor(code: ErrorCode, detail?: string) {
      const base = `${code}: ${ERROR_MESSAGES[code] ?? 'Unknown error.'}`;
      super(detail === undefined ? base : `${base} (${detail})`);
      this.name = 'PlinthError'; this.code = code; this.detail = detail;
    }
  }
  ```
- **Tests (write first):** `errors.test.ts`
  - `ERROR_MESSAGES equals contracts/errors.json`: same 97 keys, same messages.
  - `message format`: `new PlinthError('PK_JCS_NULL').message === 'PK_JCS_NULL: null is not allowed; omit the member instead.'`; with detail `'a.b'` → `… instead. (a.b)`; `.name === 'PlinthError'`; `instanceof Error`.
- **Run:** `npm test`, `npm run typecheck`, `npm run lint`
- **Done when:** all pass · STATUS updated
- **Stop and ask the owner if:** never needed.
- **Commit:** `feat(core): add PlinthError and exact error messages (T-M0-07)`

### T-M0-08 · M0 close: full local check and status
- **Size:** S
- **Depends on:** T-M0-05, T-M0-06, T-M0-07
- **Covers:** milestone gate M0
- **Read first:** `docs/06-plan.md` §2
- **Create:** none
- **Modify:** `docs/status/STATUS.md`, `docs/status/LOG.md`, `docs/06-plan.md` (task statuses only)
- **Steps:** `npm ci` then `npm run check` → paste every result line with the short SHA; push; confirm CI `fast` green on that SHA.
- **Tests:** none new.
- **Run:** `npm run check`
- **Done when:** green locally and in CI · STATUS "Next step: T-M1-01"
- **Commit:** `docs: close milestone M0 (T-M0-08)`
