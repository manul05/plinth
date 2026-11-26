# How I built Plinth 0.1.0 with AI

A factual account of how Plinth 0.1.0 was planned, built, reviewed, and verified by directing AI agents under written rules, owner gates, and tests-first task cards. Every count below includes the command that produced it (measured on `development` at `fe74e23`, right after `T-MR-05` closed).

## 1. By the numbers (`fe74e23`)

| Metric | Value | Command |
|---|---|---|
| Total commits up to `T-MR-05` | `80` (`39` `feat`, `10` `fix`, `12` `test`, `9` `docs`, `9` `chore`/`ci`/`build`, `1` initial) | `git log --oneline fe74e23 \| wc -l` |
| AI-assisted commits (`Assisted-by:`) | `78` | `git log --grep="Assisted-by:" fe74e23 --oneline \| wc -l` |
| Architecture Decision Records | `27` (`ADR-0001`..`ADR-0027`; `14` Stage 3 + `13` implementation/review) | `ls docs/decisions/[0-9][0-9][0-9][0-9]-*.md \| grep -v 0000 \| wc -l` |
| Vector & key JSON files | `189` (`183` vectors: `156` runtime + `27` tool; `6` key/index files) | `ls contracts/test-vectors/*/*.json \| wc -l` |
| TypeScript source / test files | `47` source files, `47` test files | `find packages/ts/src -name '*.ts' \| wc -l` and `find packages/ts/test -name '*.test.ts' \| wc -l` |
| Automated checks at `7685414` | `430/430` unit/E2E tests, `6/6` perf tests, `PASS 156/156` conformance | `npm run check` and `npm run test:perf` |
| Mutation checks verified | `14/14` (`MC-1`..`MC-14`) | `docs/testing.md` §6, `docs/status/LOG.md`, `docs/status/archive/2026-11.md` |

## 2. The workflow: contracts first, then one task card at a time

1. **Stage 3 design before code (2026-10-31):** Claude (`claude-opus-5-5`, logged in `docs/status/archive/2026-10.md`) authored the specification (`docs/03-spec.md`), architecture (`docs/04-architecture.md`), threat model (`docs/05-threat-model.md`), 17 JSON Schemas, 177 golden test vectors, 4 rule-pack YAML sources, and 65 task cards (`docs/plan/M0-setup.md`..`MR-release.md`), plus `ADR-0001`..`ADR-0014`.
2. **Written guardrails (`AGENTS.md` + `.githooks/`):** Only the owner modifies `AGENTS.md` or merges into `main`. Every agent reads `docs/status/STATUS.md` at session start, follows red-first TDD on each task card, never changes `contracts/` without an ADR and owner approval in chat, and hands off in `STATUS.md` and `LOG.md`.
3. **Implementation & verification (Antigravity `Gemini 4 Hydrogen (High)`):** Executed M0 through MR-05 in sequence:
   - Each task wrote failing tests first, observed the failure, implemented the minimal module, and ran `npm run check`.
   - Security-critical milestones ended with deliberate mutation checks (`MC-1`..`MC-14`): breaking a protecting line, watching the named vector or unit test fail, restoring it, and logging the result.

## 3. What caught bugs that unit tests alone missed

From the `AI:` notes in `docs/status/LOG.md` and `docs/status/archive/2026-11.md`:

- **Toolchain & schema strictness (`ADR-0016`, `ADR-0017`):** Re-pinning Node.js `26.13.1` / npm `11.20.0` matched the local Windows workstation; Ajv `8.20.0` `strictRequired` rejected `jwk.schema.json`'s `not: { required: ['d'] }` until `"properties": { "d": {} }` was declared explicitly.
- **Mutation check `MC-13` blind spot (`T-M5-11`):** Dropping `pair_with` proximity in `detect/scan.ts` initially passed existing pack tests because the test string lacked the `rzp_` keyword prefilter; adding an explicit proximity unit test made `MC-13` effective.
- **Real hardware & live test-mode gates (`T-M3-08`, `T-M5-09`):**
  - **Spike `T-M3-08` (`ADR-0018`):** Capturing real Windows Hello (`0x05`) and phone Google Password Manager (`0x1d`, high-S) assertions exposed that keeping captures only in git-ignored `spike-output/` caused CI to skip them; committing the public assertions as `k2-real-*` vectors locked in regression coverage.
  - **Gate `G-K5` (`ADR-0022`):** Scanning retired real Razorpay and Cashfree test-mode keys outside the repo showed that Cashfree `TEST` + 36-hex keys had Shannon entropy below `4.0` and `cfsk_ma_test_` used a 54-char format missed by rev 1, leading to `rev: 2` rules.
- **Three independent model reviews (`R1`, `R2`, `<MR>`):** Running separate fresh-session reviews against `contracts/spec/*.md` and `docs/05-threat-model.md` found real gaps that happy-path and vector tests missed:
  - **R1 (`2026-11-25`, 2 High, 5 Medium):** Untrusted `ApprovalRequest` policy/requester fields (`ADR-0019`), missing distinct-approver `update_threshold` (`ADR-0020`), and K2 validation / K1 external-anchor bounds (`ADR-0021`).
  - **R2 (`2026-11-26`, 1 Critical, 2 High, 5 Medium):** Missing `dist/version.{js,d.ts}` in `packages/ts/package.json` `files` (`R2-01`), `verifyRegistryChain` missing `profile`/alg and `allow_synced_passkeys` checks (`ADR-0024`), and CI running `typecheck`/`test` before `build` (`R2-03`).
  - **`<MR>` (`2026-11-26`, 0 Critical, 3 High, 4 Medium, 4 Low):** `redact()` partial-overlap secret tail bypass (`ADR-0026`), symlink and nested `SHA256SUMS` snapshot verification gaps, `shell: true` in `snapshot.ts`, unvalidated K4 `date` strings and nested `data.prev` in `lintPersonalData` (`ADR-0027`), non-deterministic snapshot `built_at`, and Windows CRLF handling on `plinth.pin`.
- **Windows environment realities:** Running `verify-snapshot.sh` on Windows required resolving Git's `sh.exe` outside the restricted terminal sandbox (`0xC0000022`), temp `--cache` directories for `npm pack`, `plinth.pin -text` in `.gitattributes`, and junction symlinks in tests where unprivileged file symlinks return `EPERM`.

## 4. Where the owner stepped in

Every contract change, security gate, and branch boundary required explicit human approval in chat:
- Setup and branch guard configuration (`G0`, `T-M0-01`).
- Re-pinning Node/npm (`ADR-0016`) and fixing `jwk.schema.json` (`ADR-0017`).
- Running the physical passkey spike (`G-spike`, `T-M3-08`) and real test-mode key check (`G-K5`, `T-M5-09`), plus relaxing crypto perf budgets (`ADR-0023`).
- Initiating and triaging all three independent security reviews (`R1`, `R2`, `<MR>`), approving contract ADRs (`ADR-0018`..`ADR-0027`), and signing off `docs/07-security-review.md` (`G-final`).
