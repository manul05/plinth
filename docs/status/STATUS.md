# Status: Plinth

The current state and the handoff to the next session. OVERWRITE this file at the end of every
session; history goes in `LOG.md`. Cap: 4 KB. Never put secrets or personal data here.

- **Updated:** 2026-11-25 by Antigravity (Gemini 4 Hydrogen (High))
- **Stage / phase:** Phase 1 (release 0.1.0), M0 Setup — T-M0-01 complete
- **Branch / HEAD:** `development` at `d674bf9` (about to commit T-M0-01; `origin/main` at `650cc02`)
- **Uncommitted or unapplied work:** none once T-M0-01 is committed; local `core.hooksPath=.githooks` active.

## Last verified checks
| Check | Result | At commit |
|---|---|---|
| `sh scripts/install-hooks.sh --check` (Git Bash) | `OK: hooks active (core.hooksPath=.githooks).` | `d674bf9` |
| G0 GitHub settings (`gh repo view`, `gh api`, `gh issue list`) | Private (`manul05/plinth`), `defaultBranchRef=development`, `mergeCommitAllowed=true`, `squashMergeAllowed=false`, `rebaseMergeAllowed=false`, `deleteBranchOnMerge=false`, Actions perms `read`, `vulnerability-alerts` HTTP 204, `automated-security-fixes` `enabled=true`, Issue #1 ALARM closed | `d674bf9` |
| T-M0-01 step 5 guard proof (`git push origin development:main`) | Unapproved: `BLOCKED: push to protected ref 'refs/heads/main'` (`no owner approval`). Wrong SHA (`deadbee`): `BLOCKED` (`OWNER_APPROVES_PUSH names a different commit than d674bf9`). `origin/refs/heads/main` unchanged at `650cc02` | `d674bf9` |
| T-M0-01 step 7 (Rule 0 item 1 & merge phrase) | Verified by Antigravity (`now it is time to merge plinth to main`); Antigravity owns M0 | `d674bf9` |
| `sh scripts/check-doc-sizes.sh` | Exited 0 | `d674bf9` |

## Done recently
- T-M0-01: verified and fixed remaining G0 settings on `manul05/plinth`, activated local `.githooks`, and proved the `pre-push` guard against `origin`.

## Next step
1. Create ADR-0016 and update documented Node/npm pins from `24.16.0` / `11.13.0` to `26.13.1` / `11.20.0` (per owner decision 2026-11-25), then proceed to **T-M0-02**.

## Blocked on / questions for the owner
- None for T-M0-01.

## Open windows and approvals
- Production: CLOSED. (Windows never carry over between sessions.)
- Owner, 2026-11-25: `"G0 GitHub settings - you do it"`, `"Guard proof & commit - yes"`, `"Node/npm decision - re-pin Plinth to 26.13.1 / 11.20.0"`.
