# CLAUDE.md

@AGENTS.md

All rules for this repo live in `AGENTS.md` (imported above). Do not add rules here.
Claude Code specifics only:

- `.claude/settings.json` deny rules back Rule 0. Never edit them, and never work around a denial.
- A subagent gets no open production window and may hold an old copy of the rules: tell it to
  read `AGENTS.md` from disk first.
