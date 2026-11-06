#!/bin/sh
#
# install-hooks.sh -- point git at the repo's tracked hooks in .githooks/.
# Template: repo-conventions v1 (2026-10-28).
#
#   sh scripts/install-hooks.sh          install (run once per clone, e.g. on a new laptop)
#   sh scripts/install-hooks.sh --check  report only; exit 1 if the guard is not active
#
# Works in Git Bash on Windows, macOS and Linux. It changes only this clone's
# .git/config (core.hooksPath); nothing global.

root=$(git rev-parse --show-toplevel) || { echo "Not inside a git repo." >&2; exit 1; }
cd "$root" || exit 1

current=$(git config --get core.hooksPath 2>/dev/null)

if [ "${1:-}" = "--check" ]; then
	if [ "$current" = ".githooks" ] && [ -f .githooks/pre-push ]; then
		echo "OK: hooks active (core.hooksPath=.githooks)."
		exit 0
	fi
	echo "NOT ACTIVE: core.hooksPath='${current:-<unset>}'. Run: sh scripts/install-hooks.sh" >&2
	exit 1
fi

[ -f .githooks/pre-push ] || { echo ".githooks/pre-push is missing; copy it from the template first." >&2; exit 1; }

git config core.hooksPath .githooks
chmod +x .githooks/* scripts/*.sh 2>/dev/null
# Record the executable bit in git too, so macOS/Linux clones get runnable hooks.
git update-index --chmod=+x .githooks/pre-push .githooks/pre-commit 2>/dev/null

echo "Installed: core.hooksPath=.githooks"
echo "Protected: refs/heads/main and refs/tags/v* (see .githooks/pre-push)."
