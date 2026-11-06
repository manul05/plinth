<!-- Template: repo-conventions v1. For development → main pull requests. For other PRs, delete what does not apply. -->

## What this brings to main

{{Plain-English summary for the owner: what changed for users, in 3–6 bullets.}}

## Owner's go-ahead

Owner, YYYY-MM-DD: "now it is time to merge plinth to main"   <!-- verbatim, from the owner's own chat message -->

## Checklist (the agent fills this in; the owner reads it and clicks merge)

**Checks**
- [ ] CI is green on this PR's head commit `{{sha}}` (paste the run link)
- [ ] Full checks run locally: `npm run check` → {{result line}} @ `{{sha}}`
- [ ] `security-scan` workflow green (gitleaks: no secrets; osv-scanner: no unaccepted high/critical)
- [ ] The core journey was run for real (localhost or preview), not just tests: {{what was clicked/run}}

**Docs**
- [ ] `CHANGELOG.md` "Unreleased" lists the user-visible changes
- [ ] `.env.example` matches every variable the code reads
- [ ] New decisions have ADRs; `docs/decisions/README.md` index updated
- [ ] `docs/05-threat-model.md` updated if a new surface, data store or third party was added
- [ ] `docs/status/STATUS.md` is current

**Safety**
- [ ] No secrets, keys, tokens or personal data in the diff or commit messages
- [ ] Database migrations (if any) are listed with how to roll back: {{none | details}}
- [ ] Nothing in `docs/do-not-break.md` was changed, or each change is explained here
- [ ] If this is a release: version bumped ({{vX.Y.Z}}) and `docs/07-security-review.md` updated for this release

**Merge method:** "Create a merge commit" (never squash or rebase: development and main must keep the same history).

## Not done / known issues

- {{anything left out, unverified or deferred; "none" if none}}
