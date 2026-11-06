#!/bin/sh
#
# check-doc-sizes.sh -- keep always-loaded agent files and the status log lean.
# Template: repo-conventions v1 (2026-10-28). Caps are defined in CONVENTIONS.md "Size caps".
# Run by .githooks/pre-commit and by CI. Exit 1 if a HARD cap is exceeded.
# Change a cap only with an ADR in docs/decisions/.

root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$root" || exit 1
fail=0

# file  hard-cap-in-bytes  what-to-do
check() {
	[ -f "$1" ] || return 0
	size=$(wc -c <"$1" | tr -d ' ')
	if [ "$size" -gt "$2" ]; then
		echo "  SIZE CAP: $1 is $size bytes (cap $2). $3" >&2
		fail=1
	fi
}

check AGENTS.md              8192  "Move detail into docs/ and link to it."
check CLAUDE.md              1536  "Keep it a thin pointer to AGENTS.md."
check GEMINI.md              1536  "Keep it a thin pointer to AGENTS.md."
check docs/status/STATUS.md  4096  "STATUS.md is the current state only; overwrite, don't append."
check docs/status/LOG.md    32768  "Move the oldest entries to docs/status/archive/YYYY-MM.md."
check docs/do-not-break.md  16384  "Fold old entries into ADRs; keep Rule/Why/Test short."

# Soft warning: any other doc over 100 KB is probably two docs.
for f in $(find docs -name '*.md' -not -path 'docs/status/archive/*' -size +100k 2>/dev/null); do
	echo "  WARNING: $f is over 100 KB; consider splitting it (not blocking)." >&2
done

exit $fail
