# ADR-0022: Verified Indian key formats (gate G-K5)

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: `"b1"` (selecting Option b1: update Cashfree regex/entropy/allow in `rev: 2`, promote verified Razorpay rules to `rev: 2`, update `k4-pack-digests-pk-secrets-india.json` and `contracts/test-vectors/index.json`).

## Context
During owner gate G-K5 (`T-M5-09`), the owner tested real retired Test-mode API keys from Razorpay and Cashfree locally using `detect-file.js` (values never stored in the repo):
- `pk.secret.razorpay.key_id_test` matched the real test key ID (`rzp_test_` + 14 alphanumeric characters, length 23).
- `pk.secret.razorpay.key_secret` matched the real key secret (24 alphanumeric characters, paired with the key ID).
- `pk.secret.cashfree.credential` missed both Cashfree test credentials:
  1. `x-client-id` (`TEST` + 36 lowercase hex characters, length 40) matched the regex but was dropped because natural hex character distribution had Shannon entropy below `4.0`.
  2. `x-client-secret` (`cfsk_ma_test_` + 32 hex + `_` + 8 hex, length 54) was not matched because rev 1 only accepted `TEST`/`PROD` prefixes and required `entropy_min: '4.0'`.

## Options
1. **Option (b1) — Promote verified Razorpay rules to `rev: 2` (`stable`/`verified`) and revise `pk.secret.cashfree.credential` (`rev: 2`)** to match both `TEST`/`PROD` and `cfsk_<module>_(test|prod)_*` formats with `entropy_min: '3.5'`, keyword `'cfsk_'`, and `allow: ['^(?:TEST|PROD)[A-Z_]+$']`, plus synthetic positive and negative tests; rebuild `packs/` and regenerate `k4-pack-digests-pk-secrets-india.json` and `contracts/test-vectors/index.json`.
2. **Option (b2) — Keep `pk.secret.cashfree.credential` `experimental`/`unverified`** and document the missed format in `docs/05-threat-model.md` TM-22.

## Decision
Option (b1). Record `rev: 2` (`effective_from: '2026-11-25'`, `status: 'stable'`, `verified.state: 'verified'`) for `pk.secret.razorpay.key_id_test`, `pk.secret.razorpay.key_secret`, and `pk.secret.cashfree.credential` in `rules/pk.secrets.india/rules.yaml` (preserving `rev: 1` with `effective_until: '2026-11-25'` so pre-2026-11-25 `k5` vectors remain unchanged), add 3 synthetic Cashfree tests in `rules/pk.secrets.india/tests.yaml`, rebuild compiled packs, and refresh the `k4-pack-digests-pk-secrets-india` golden vector.

### One-off script used to regenerate the K4 digest vector and `index.json`
```sh
node --input-type=module -e "import { createHash } from 'node:crypto'; import { readFileSync, writeFileSync } from 'node:fs'; import { digest } from './packages/ts/dist/index.js'; const manifest = JSON.parse(readFileSync('packs/pk.secrets.india/pack.json', 'utf8')); const rules = JSON.parse(readFileSync('packs/pk.secrets.india/rules.json', 'utf8')); const tests = JSON.parse(readFileSync('packs/pk.secrets.india/tests.json', 'utf8')); const vecPath = 'contracts/test-vectors/k4/k4-pack-digests-pk-secrets-india.json'; const vec = JSON.parse(readFileSync(vecPath, 'utf8')); vec.expect = { manifest_files: manifest.files, manifest_digest: digest(manifest), rule_count: rules.rules.length, test_count: tests.tests.length }; const vecBytes = Buffer.from(JSON.stringify(vec, null, 2) + '\n', 'utf8'); writeFileSync(vecPath, vecBytes); const idxPath = 'contracts/test-vectors/index.json'; const idx = JSON.parse(readFileSync(idxPath, 'utf8')); const rel = 'k4/k4-pack-digests-pk-secrets-india.json'; const entry = idx.files.find(f => f.path === rel); entry.sha256 = 'sha256:' + createHash('sha256').update(vecBytes).digest('hex'); writeFileSync(idxPath, JSON.stringify(idx, null, 2) + '\n', 'utf8');"
```

## Consequences
- `pk.secret.razorpay.key_id_test`, `pk.secret.razorpay.key_secret`, and `pk.secret.cashfree.credential` are `verified` / `stable` from `2026-11-25`.
- `packs/pk.secrets.india/` now holds 11 rule-revision entries (8 active on `2026-11-25`) and 19 tests (73 tests total across the 4 packs).
- `contracts/test-vectors/k4/k4-pack-digests-pk-secrets-india.json` (`manifest_digest: sha256:96d8dc6408e8132a603de4aa281dcf8719b75509435f4e16c0153029c374f31d`) and `contracts/test-vectors/index.json` are updated.
- Live-mode keys (`rzp_live_`, `PROD`, `cfsk_ma_prod_`) and the remaining India rules (`msg91`, `zoho`, `instamojo`) remain unverified against live dashboards.
