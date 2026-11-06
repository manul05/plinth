# MR Release 0.1.0 — task cards

**Goal:** a tagged, reproducible snapshot that Passdown vendors, pinned by hash; security review; README and changelog; repo public. Procedure for consumers: `docs/consuming.md`.

---

### T-MR-01 · repo-tools/snapshot.ts
- **Size:** M
- **Depends on:** T-M6-04
- **Covers:** AC-20.1, US-20, TM-27
- **Read first:** `docs/consuming.md` §1
- **Create:** `packages/ts/src/repo-tools/snapshot.ts`, `packages/ts/test/repo-tools/snapshot.test.ts`
- **Modify:** root `package.json` (add `"snapshot": "npm run build && node packages/ts/dist/repo-tools/snapshot.js"`)
- **Interface (exact):** `export function buildSnapshot(opts: { repoRoot: string; outRoot: string; tag: string; allowDirty: boolean }): { dir: string; sumsSha256: string; tarballSha256: string; files: number }`
- **Steps:**
  1. `version` = `tag` without the leading `v`; must equal `packages/ts/package.json` version, else throw `Error('tag ' + tag + ' does not match package version ' + version)`.
  2. Unless `allowDirty`: `git status --porcelain` must be empty, and `git rev-parse HEAD` must equal `git rev-list -n 1 <tag>`; else throw with `snapshot must be built from a clean checkout of <tag>`.
  3. `dir = <outRoot>/plinth-<version>`; delete it if present; create it.
  4. `npm pack --workspace packages/ts --pack-destination <dir>` (child_process `execFileSync('npm', [...], {shell:true})`) → `plinth-kit-<version>.tgz`.
  5. Copy (byte copies, `fs.cpSync` with `recursive:true`): `LICENSE`, `NOTICE`, `contracts/` (whole), `packs/` (whole), `docs/patterns/two-hands-ux.md` → `docs/patterns/`, `docs/consuming.md` → `docs/`, `scripts/verify-snapshot.sh` → `verify-snapshot.sh`.
  6. Write `PLINTH_VERSION` (LF line ends): `version=<version>\ntag=<tag>\ncommit=<git rev-parse HEAD>\nbuilt_at=<timestampFromMs(Date.now())>\n`.
  7. List every file under `dir` except `SHA256SUMS`, paths relative to `dir` with `/`, sorted with the default string sort; write `SHA256SUMS` = for each `<sha256 hex of bytes>  <path>\n` (two spaces).
  8. `sumsSha256` = SHA-256 hex of the `SHA256SUMS` bytes; script mode prints `snapshot: <dir relative to repoRoot> sums_sha256=<hex>` and `tarball_sha256=<hex>`.
- **Tests (write first):** with `allowDirty:true`, `outRoot` = temp dir: `SHA256SUMS` lines all match `/^[0-9a-f]{64}  [^ ].*$/`, are sorted, cover every file except itself; `PLINTH_VERSION` has 4 lines with the keys in that order; the tarball exists and its listing (`tar -tzf`) contains `package/dist/index.js`; tag `v9.9.9` throws `does not match package version`.
- **Run:** `npm test -- snapshot`
- **Commit:** `feat(release): build hash-listed snapshots (T-MR-01)`

### T-MR-02 · scripts/verify-snapshot.sh (consumer-side check)
- **Size:** S
- **Depends on:** T-MR-01
- **Covers:** AC-20.2, TM-27
- **Create:** `scripts/verify-snapshot.sh` (exact content below), `packages/ts/test/repo-tools/verify-snapshot.test.ts`
- **Exact content:**
  ```sh
  #!/bin/sh
  # verify-snapshot.sh -- check a vendored Plinth snapshot against its SHA256SUMS and the consumer's plinth.pin.
  # Run from the consumer repo root:  sh vendor/plinth/verify-snapshot.sh
  # Exit 0 = OK; exit 1 = tampered, incomplete or not the pinned snapshot.
  set -u
  here=$(cd "$(dirname "$0")" && pwd)
  pin="$here/../../plinth.pin"
  fail=0
  [ -f "$pin" ] || { echo "PIN MISSING: $pin" >&2; exit 1; }
  want=$(sed -n 's/^sums_sha256=//p' "$pin")
  have=$(sha256sum "$here/SHA256SUMS" | cut -d' ' -f1)
  if [ "$want" != "$have" ]; then echo "PIN MISMATCH: plinth.pin says $want, SHA256SUMS is $have" >&2; exit 1; fi
  ( cd "$here" && sha256sum -c --strict --quiet SHA256SUMS ) || fail=1
  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  cut -c67- "$here/SHA256SUMS" | LC_ALL=C sort > "$tmp/listed"
  ( cd "$here" && find . -type f ! -name SHA256SUMS | sed 's|^\./||' | LC_ALL=C sort ) > "$tmp/actual"
  extra=$(comm -13 "$tmp/listed" "$tmp/actual")
  if [ -n "$extra" ]; then printf 'UNLISTED %s\n' $extra >&2; fail=1; fi
  pv=$(sed -n 's/^version=//p' "$here/PLINTH_VERSION")
  wv=$(sed -n 's/^version=//p' "$pin")
  if [ "$pv" != "$wv" ]; then echo "VERSION MISMATCH: snapshot $pv, pin $wv" >&2; fail=1; fi
  if [ "$fail" -ne 0 ]; then echo "plinth snapshot verification FAILED" >&2; exit 1; fi
  echo "OK plinth $pv snapshot verified ($(wc -l < "$here/SHA256SUMS" | tr -d ' ') files)"
  ```
  (`sha256sum -c` prints `<path>: FAILED` lines itself.)
- **Tests (write first):** build a snapshot into `<temp>/consumer/vendor/plinth` (use `buildSnapshot` then `fs.cpSync`), write `<temp>/consumer/plinth.pin` with the right `sums_sha256` and `version=0.1.0`; run `sh vendor/plinth/verify-snapshot.sh` with `cwd` = consumer (`execFileSync('sh', …)`): › `valid snapshot passes` → stdout starts `OK plinth 0.1.0 snapshot verified`; › `tampered byte fails` → flip one byte of `vendor/plinth/contracts/errors.json` → exit code 1 and stderr/stdout contains `FAILED`; › `pin mismatch fails` → change one hex digit of the pin → exit 1 with `PIN MISMATCH`; › `unlisted file fails` → add `vendor/plinth/extra.txt` → exit 1 with `UNLISTED extra.txt`.
- **Run:** `npm test -- verify-snapshot` (Git Bash provides `sh` and `sha256sum` on Windows; CI is Linux)
- **Commit:** `feat(release): consumer-side snapshot verification script (T-MR-02)`

### T-MR-03 · repo-tools/vendor.ts
- **Size:** M
- **Depends on:** T-MR-02
- **Covers:** US-20, ADR-0010
- **Read first:** `docs/consuming.md` §2 step 4 and §3
- **Create:** `packages/ts/src/repo-tools/vendor.ts`, `packages/ts/test/repo-tools/vendor.test.ts`
- **Modify:** root `package.json` (add `"vendor": "node packages/ts/dist/repo-tools/vendor.js"`)
- **Interface (exact):** `export function vendorSnapshot(opts: { snapshotDir: string; consumerRoot: string }): { pinText: string }`. Script flags: `--snapshot <dir> --to <consumer root>`; missing either → stderr `usage: vendor --snapshot <dir> --to <consumer repo>` exit 2.
- **Steps:** (1) recompute the SHA-256 of every file listed in `<snapshotDir>/SHA256SUMS` in Node (the shell script cannot run yet because the consumer has no pin) and refuse (`Error('snapshot is not intact')`) on any mismatch; (2) `consumerRoot` must contain `package.json`, else `Error('not a consumer repo: package.json missing')`; (3) remove `<consumerRoot>/vendor/plinth` and copy the snapshot there; (4) write `<consumerRoot>/plinth.pin` exactly as `docs/consuming.md` §3 (values from `PLINTH_VERSION`, SHA-256 of `SHA256SUMS`, tarball name `plinth-kit-<version>.tgz` and its SHA-256); (5) append `vendor/plinth/** -text` to `<consumerRoot>/.gitattributes` if no line equals it (create the file if missing); (6) print `vendored plinth <version> into <consumerRoot>/vendor/plinth; next: npm install --save-exact ./vendor/plinth/plinth-kit-<version>.tgz`.
- **Tests (write first):** temp consumer with a minimal `package.json`: after `vendorSnapshot`, `plinth.pin` has 7 lines starting with the comment line, `sums_sha256` equals SHA-256 of the copied `SHA256SUMS`, `.gitattributes` contains the line once (running twice still once); a snapshot with one changed byte → throws `snapshot is not intact`; consumer without `package.json` → throws.
- **Commit:** `feat(release): vendor a snapshot into a consumer with a pin (T-MR-03)`

### T-MR-04 · E2E-5: scratch consumer installs the tarball
- **Size:** M
- **Depends on:** T-MR-03
- **Covers:** AC-19.1, AC-20.1, AC-20.2, E2E-5
- **Create:** `packages/ts/test/repo-tools/e2e-consumer.test.ts` (give the single `it` a timeout of 180000 ms: `it('…', async () => { … }, 180000)`)
- **Tests (write first):** temp consumer `{"name":"consumer","private":true,"type":"module"}` → `buildSnapshot(allowDirty:true)` → `vendorSnapshot` → `npm install --save-exact ./vendor/plinth/plinth-kit-0.1.0.tgz` (cwd consumer) → `package.json` dependency is `file:vendor/plinth/plinth-kit-0.1.0.tgz` and `package-lock.json` has an `integrity` starting `sha512-` for `node_modules/plinth-kit` → `node -e "import('plinth-kit/core').then(m => console.log(m.digest({})))"` prints `sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a` → `sh vendor/plinth/verify-snapshot.sh` prints `OK plinth 0.1.0` → `npx plinth-conformance vendor/plinth/contracts/test-vectors` prints `PASS 150/150`.
- **Run:** `npm test -- e2e-consumer` (needs network for npm to install the 3 runtime deps)
- **Commit:** `test(release): end-to-end vendoring into a scratch consumer (T-MR-04)`

### T-MR-05 · Security review document
- **Size:** M
- **Depends on:** T-MR-04
- **Covers:** `docs/05-threat-model.md` §7 checklist (all TM rows)
- **Create:** `docs/07-security-review.md`
- **Steps:** follow the 9-item checklist in `docs/05-threat-model.md` §7 in order; paste result lines with SHA; findings table columns `ID | severity | where | status (fixed @ SHA with test / accepted with owner quote / open)`; include the "Not checked" section and the honest limits from `contracts/spec/k2-approval.md` §6. The independent review (item 7) is gate R2's result if R2 already covered the final code; otherwise ask the owner to run the §8 prompt again with `<MR>`.
- **Done when:** document complete; owner sign-off quoted (`Owner, <date>: "<words>"`).
- **Commit:** `docs: security review for release 0.1.0 (T-MR-05)`

### T-MR-06 · README, CHANGELOG 0.1.0, How I built this
- **Size:** M
- **Depends on:** T-MR-05
- **Covers:** `docs/testing.md` §11 checklist
- **Modify:** `README.md`, `CHANGELOG.md`
- **Create:** `docs/08-how-i-built-this.md` (draft from LOG `AI:` lines, ADRs and `git log` trailers; every number with the command that produced it, such as `git log --oneline | wc -l`), `docs/releases.md` (table header only: `| Version | Tag commit | sums_sha256 | tarball_sha256 | Date |`)
- **Steps:** README per the §11 checklist (keep the Stage 3 text, replace "planned" wording with facts); CHANGELOG: rename `[Unreleased]` items into `## [0.1.0] - <YYYY-MM-DD>` with Added lines for K0, K1, K2, K4, K5, four packs, conformance CLI, snapshot/vendor tools.
- **Commit:** `docs: README, changelog and write-up for 0.1.0 (T-MR-06)`

### T-MR-07 · Release: merge, tag, snapshot from the tag, record the pin
- **Size:** S
- **Depends on:** T-MR-06
- **Covers:** US-20, `docs/testing.md` §9 release checklist
- **Steps:**
  1. Wait for the owner's exact phrase `now it is time to merge plinth to main`. Then open the PR `development → main` with `gh pr create --base main --head development` and fill `.github/pull_request_template.md`. **Stop.** Owner (gate **G-merge**) reviews and clicks "Create a merge commit".
  2. Owner (gate **G-tag**, plain English): on GitHub → Releases → "Draft a new release" → "Choose a tag" → type `v0.1.0` → target `main` → title `Plinth 0.1.0` → paste the CHANGELOG 0.1.0 section → **Save draft** (do not publish yet).
  3. Agent: `git fetch --tags origin`; `git worktree add ../plinth-v0.1.0 v0.1.0`; in it `npm ci && npm run snapshot -- --tag v0.1.0`; paste the two printed lines.
  4. Build it a second time (delete `snapshot/`, rerun step 3's snapshot command) and confirm the same `tarball_sha256` (npm pack fixes file times). `sums_sha256` changes only because of `built_at`: record the **first** run's values. If the tarball hash differs between runs, STOP and tell the owner.
  5. On `development`: add the row to `docs/releases.md` (`| 0.1.0 | <commit> | <sums_sha256> | <tarball_sha256> | <date> |`); zip the snapshot folder: `cd ../plinth-v0.1.0/snapshot && zip -r -X plinth-0.1.0-snapshot.zip plinth-0.1.0` (Git Bash may lack `zip`: then use PowerShell `Compress-Archive -Path plinth-0.1.0 -DestinationPath plinth-0.1.0-snapshot.zip`), and give the owner the zip path and its `sha256sum`.
  6. Owner attaches the zip to the draft release, adds `sums_sha256` and the zip's SHA-256 to the notes, and publishes.
  7. Agent: `git worktree remove ../plinth-v0.1.0`; commit `docs/releases.md` on `development`.
- **Done when:** release published by the owner; `docs/releases.md` row committed; STATUS says "0.1.0 released; Passdown can vendor".
- **Commit:** `docs: record the 0.1.0 snapshot pin (T-MR-07)`

### T-MR-08 · Going public (gate G-public)
- **Size:** S
- **Depends on:** T-MR-07
- **Covers:** ADR-0014, TM-30
- **Steps (agent):** run `security-scan` with "Run workflow" and paste the result; read `docs/status/` and every ADR for personal data (owner quotes are fine) and list anything found.
- **Owner (plain English):** Settings → General → "Change visibility" → Public; set default branch to `main`; Settings → Rules → new ruleset for `main`: require a pull request, block force pushes and deletion, require status check `ci / lint, typecheck, unit, build`, no bypass; Settings → Code security: turn on secret scanning, push protection, CodeQL default setup and private vulnerability reporting.
- **Agent after:** update `SECURITY.md` (replace the "before the repo is public" sentence with the private-reporting instructions) and README badges; push a no-op branch commit to confirm push protection does not block the split test strings — if it blocks a file, STOP and tell the owner the file and line (do not bypass).
- **Commit:** `docs: switch to public-repository security settings (T-MR-08)`
