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
