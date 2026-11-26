#!/bin/sh
# verify-snapshot.sh -- check a vendored Plinth snapshot against its SHA256SUMS and the consumer's plinth.pin.
# Run from the consumer repo root:  sh vendor/plinth/verify-snapshot.sh
# Exit 0 = OK; exit 1 = tampered, incomplete or not the pinned snapshot.
set -u
here=$(cd "$(dirname "$0")" && pwd)
pin="$here/../../plinth.pin"
fail=0
[ -f "$pin" ] || { echo "PIN MISSING: $pin" >&2; exit 1; }
want=$(sed -n 's/^sums_sha256=//p' "$pin" | tr -d '\r')
have=$(sha256sum "$here/SHA256SUMS" | cut -d' ' -f1)
if [ -z "$want" ] || [ -z "$have" ] || [ "$want" != "$have" ]; then echo "PIN MISMATCH: plinth.pin says $want, SHA256SUMS is $have" >&2; exit 1; fi
( cd "$here" && sha256sum -c --strict --quiet SHA256SUMS ) || fail=1
tmp=$(mktemp -d) || exit 1
trap 'rm -rf "$tmp"' EXIT
symlinks=$(cd "$here" && find . -type l)
if [ -n "$symlinks" ]; then printf '%s\n' "$symlinks" | sed 's|^\./||; s/^/SYMLINK /' >&2; fail=1; fi
cut -c67- "$here/SHA256SUMS" | LC_ALL=C sort > "$tmp/listed"
( cd "$here" && find . ! -type d ! -path ./SHA256SUMS | sed 's|^\./||' | LC_ALL=C sort ) > "$tmp/actual"
extra=$(comm -13 "$tmp/listed" "$tmp/actual")
if [ -n "$extra" ]; then printf '%s\n' "$extra" | sed 's/^/UNLISTED /' >&2; fail=1; fi
pv=$(sed -n 's/^version=//p' "$here/PLINTH_VERSION" | tr -d '\r')
wv=$(sed -n 's/^version=//p' "$pin" | tr -d '\r')
if [ -z "$pv" ] || [ "$pv" != "$wv" ]; then echo "VERSION MISMATCH: snapshot $pv, pin $wv" >&2; fail=1; fi
if [ "$fail" -ne 0 ]; then echo "plinth snapshot verification FAILED" >&2; exit 1; fi
echo "OK plinth $pv snapshot verified ($(wc -l < "$here/SHA256SUMS" | tr -d ' ') files)"
