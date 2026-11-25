# How a product consumes Plinth (hash-pinned snapshot)

**Status:** Stage 3, v1.0 (2026-10-31). Decision: ADR-0010 (owner decision 2026-10-31: "projects consume a hash-pinned snapshot"). First consumer: **Passdown**. The same steps apply to every later TypeScript consumer.

## 1. What a snapshot is
`snapshot/plinth-<version>/`, built only from a clean checkout of the tag `v<version>` (T-MR-01):
```
plinth-0.1.0/
  PLINTH_VERSION            version=, tag=, commit= (40 hex), built_at= (UTC)
  SHA256SUMS                "<64 hex>  <relative path>" for every other file, sorted by path, LF line ends
  verify-snapshot.sh        consumer-side check (copy of scripts/verify-snapshot.sh)
  plinth-kit-0.1.0.tgz      `npm pack` of packages/ts (dist + package.json + LICENSE + NOTICE + README)
  LICENSE  NOTICE
  contracts/                spec/, api/, schemas/, test-vectors/, errors.json, README.md
  packs/                    compiled canonical rule packs (for non-TS consumers later)
  docs/patterns/two-hands-ux.md
  docs/consuming.md
```
The digest that pins a release is **`sums_sha256` = SHA-256 of the `SHA256SUMS` file**. It is recorded in Plinth's `docs/releases.md` (on `main`) and in each consumer's `plinth.pin`.

## 2. Vendoring Plinth 0.1.0 into Passdown (exact steps; run by an agent in a Passdown task, owner watching)
Paths below are relative. `<plinth>` = the local Plinth clone, `<passdown>` = the local Passdown clone. Use Git Bash.
1. In `<plinth>`: `git fetch --tags origin` then `git worktree add ../plinth-v0.1.0 v0.1.0` (a clean checkout of exactly the tag).
2. `cd ../plinth-v0.1.0 && npm ci && npm run snapshot -- --tag v0.1.0`. Expected last line: `snapshot: snapshot/plinth-0.1.0 sums_sha256=<64 hex>`.
3. Compare that `sums_sha256` with the row for 0.1.0 in `docs/releases.md` on `main`. **Different → stop and tell the owner.** (Rebuilding from the tag must give the same bytes; if not, the build is not reproducible and the owner decides.)
4. `npm run vendor -- --snapshot snapshot/plinth-0.1.0 --to <passdown>`. The tool:
   - deletes `<passdown>/vendor/plinth/` if present and copies the snapshot there;
   - writes `<passdown>/plinth.pin` (format in §3);
   - adds the line `vendor/plinth/** -text` to `<passdown>/.gitattributes` if it is missing (stops Windows line-ending conversion from breaking hashes);
   - prints: `vendored plinth 0.1.0 into <passdown>/vendor/plinth; next: npm install --save-exact ./vendor/plinth/plinth-kit-0.1.0.tgz`.
5. In `<passdown>`: `npm install --save-exact ./vendor/plinth/plinth-kit-0.1.0.tgz`. Check that `package.json` has `"plinth-kit": "file:vendor/plinth/plinth-kit-0.1.0.tgz"` and `package-lock.json` has an `"integrity": "sha512-…"` entry for it (npm's own hash pin).
6. In `<passdown>`: `sh vendor/plinth/verify-snapshot.sh` → `OK plinth 0.1.0 snapshot verified (N files)`.
7. Add to Passdown's CI fast job, after `npm ci`:
   ```yaml
   - run: sh vendor/plinth/verify-snapshot.sh
   - run: npx plinth-conformance vendor/plinth/contracts/test-vectors
   ```
   Expected: `OK plinth 0.1.0 …` and `PASS 156/156`.
8. Add a Passdown test that fails if any kid in its approver registry or trust list is a test kid: `import { isTestKid } from 'plinth-kit/core'`.
9. Add one line to Passdown's `AGENTS.md` project notes: `Never edit vendor/plinth/ or plinth.pin by hand; Plinth changes are made in the Plinth repo first and arrive by re-vendoring a new tag.`
10. Passdown ADR: "Use Plinth 0.1.0", quoting `commit`, `sums_sha256` and `tarball_sha256` from `plinth.pin`.
11. `git worktree remove ../plinth-v0.1.0` in `<plinth>`.

## 3. `plinth.pin` (consumer root, written by the vendor tool)
```
# Plinth snapshot pin. Written by the Plinth vendor tool. Do not edit by hand.
version=0.1.0
tag=v0.1.0
commit=<40 lowercase hex>
sums_sha256=<64 lowercase hex>
tarball=plinth-kit-0.1.0.tgz
tarball_sha256=<64 lowercase hex>
```

## 4. Using it in code (Passdown runs on Cloudflare Workers; the library has no Node built-ins)
```ts
import { digest, verifyEnvelope, isTestKid } from 'plinth-kit/core';
import { appendEvent, verifyChain } from 'plinth-kit/audit';
import { createApprovalRequest, matchingCode, verifyAndConsume } from 'plinth-kit/approval';
import { loadPack } from 'plinth-kit/rulepack';
import { BUILTIN_PACKS } from 'plinth-kit/packs';
import { redact, scan } from 'plinth-kit/detect';
const packs = [loadPack(BUILTIN_PACKS['pk.secrets.global']), loadPack(BUILTIN_PACKS['pk.secrets.india']), loadPack(BUILTIN_PACKS['pk.pii.india']), loadPack(BUILTIN_PACKS['pk.untrusted-text'])];
```
Only names in `vendor/plinth/contracts/api/plinth-api.d.ts` exist. If something seems missing, stop: the change belongs in Plinth first.

## 5. Upgrading
Repeat §2 with the new tag in a normal Passdown PR. `verify-snapshot.sh` and conformance must pass; update the Passdown ADR. Never mix files from two versions.

## 6. After Plinth is public
Vendoring stays the method for 0.x (owner question Q3 in `06-plan.md`). The public repo adds branch protection and lets anyone check `docs/releases.md`.

## 7. Other languages (later)
C# (0.3) and Kotlin (0.5) consumers vendor the same snapshot and run their binding against `contracts/test-vectors/` and `packs/*.json`.
