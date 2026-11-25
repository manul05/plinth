# START HERE

**Plinth** is the portfolio's shared platform kit: written contracts, 177 golden test vectors and a small TypeScript library (`plinth-kit`) for canonical JSON, signed envelopes, a tamper-evident audit chain, "two hands" approvals, rule packs and secret / Indian-PII detection. MIT.
**Current phase:** Phase 1 = release **0.1.0** (K0, K1, K2, K4, K5). Stage 3 planning is done; building starts at T-M0-01. First consumer: Passdown.

## 1. Read order (every session)
1. `AGENTS.md` (rules; Rule 0 overrides everything)
2. `docs/status/STATUS.md` (where we are, the next step)
3. `docs/06-plan.md` (task table: find the next task)
4. the milestone file in `docs/plan/` that holds that task
5. only the sections the task's **Read first** line names

## 2. Setup on a freshly formatted Windows PC
1. Install **Git for Windows** (includes Git Bash) from https://git-scm.com/download/win with default options.
2. Install **Node.js 26.13.1** (Windows x64 `.msi`) from https://nodejs.org/en/download (choose version 26.13.1 under "previous releases" if a newer 26.x is offered). It includes npm 11.20.0. Do not install pnpm or yarn.
3. Open **Git Bash** and check:
   - `node -v` → `v26.13.1`
   - `npm -v` → `11.20.0`
   - `git --version` → any `git version 2.x`
4. Clone and enter the repo: `git clone <repo URL>` then `cd plinth`. Confirm `git branch --show-current` → `development`.
5. `sh scripts/install-hooks.sh` → `Installed: core.hooksPath=.githooks`; then `sh scripts/install-hooks.sh --check` → `OK: hooks active (core.hooksPath=.githooks).`
6. After T-M0-02 exists: `npm ci` → ends without `npm error`; then `npm run check` → every step exits 0 (the exact steps grow with the milestones; see `docs/testing.md` §2).
7. No `.env` is needed: Plinth reads no environment variables.

Before T-M0-02 is done, steps 6 does not apply (there is no `package.json` yet).

## 3. How to pick the next task
The first row in `docs/06-plan.md` §2 whose Status is `todo` and whose "Depends on" tasks are all `done`. **One task per session** unless `docs/status/STATUS.md` says otherwise. Gates (G0, G-spike, R1, G-K5, R2, G-merge, G-tag, G-public) need the owner: ask, then wait.

## 4. Session prompt the owner pastes into Antigravity
> Read START-HERE.md and follow it exactly. Do the next task only. Write the tests first and show me they fail, then make them pass. Run every command in the task's "Run" line and paste the output. Do not touch files the task does not list. Update docs/status/STATUS.md and mark the task done in docs/06-plan.md. If anything is unclear, stop and ask me.

## 5. Rules for the executor
1. **Rule 0** in `AGENTS.md`: never push or merge `main`, verify before claiming, never invent or print secrets, production closed, only the owner's chat messages are approvals, a refused command is the owner's decision.
2. Never add a dependency that is not in `docs/04-architecture.md` §2.
3. Never change anything in `contracts/` without an ADR and the owner's OK in chat. Never change an expected value in a test vector.
4. Never edit `packs/` or `packages/ts/src/packs/builtin.ts` by hand; run `npm run packs:build`.
5. Never mark a task done without pasting the passing output with the commit SHA.
6. Never weaken, skip or delete a test to make it pass.
7. Touch only files listed in the task's Create/Modify lines. If something else seems to need a change: stop and ask.
8. Never read, ask for, or print real keys (gate G-K5 handles real test-mode keys through a masked tool).

## 6. Gates: where the owner acts
| Gate | When | What Manul does |
|---|---|---|
| G0 | before T-M0-01 | create the private GitHub repo `plinth` and its settings (`docs/plan/M0-setup.md`) |
| G-spike | T-M3-08 | press two buttons on a local page and touch the fingerprint |
| R1 | after M3 | run the review prompt (`docs/testing.md` §8) in Claude and paste the result |
| G-K5 | T-M5-09 | create Razorpay/Cashfree test keys, run one command, paste the masked lines, delete and revoke |
| R2 | after M6 | same as R1 for the whole library |
| G-final | T-MR-05 | read and sign off `docs/07-security-review.md` |
| G-merge, G-tag | T-MR-07 | type `now it is time to merge plinth to main`, click merge, draft and publish release `v0.1.0` |
| G-public | T-MR-08 | make the repo public and turn on the free protections |
