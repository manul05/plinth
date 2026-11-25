# Do not break

Behaviours that look like bugs, dead code or over-caution but are deliberate. Read the entry
before editing anything it names. Cap: 16 KB; when an entry needs a long story, write an ADR
and link it. Add entries in the same commit as the code they protect.

Entry shape (keep each under 8 lines):

```
## DNB-001: <short name>
- Where: path/to/file.ext (function or symbol name, not a line number)
- Rule: what must stay true
- Why: what goes wrong if someone "fixes" it (link ADR-NNNN if there is one)
- Test: the test that fails if it breaks
```

## DNB-001: Byte-exact contract and pack files
- Where: .gitattributes (last block), contracts/test-vectors/**, packs/**, SHA256SUMS
- Rule: these files are never line-ending converted, reformatted or pretty-printed; packs are single-line canonical JSON with no trailing newline
- Why: index.json, pack manifests and snapshot pins hash the exact bytes; CRLF conversion on Windows breaks every hash
- Test: packages/ts/test/contracts.test.ts :: vector files match index.json; npm run packs:check

## DNB-002: Key order uses UTF-16 code units
- Where: packages/ts/src/core/jcs.ts (canonicalize)
- Rule: object keys are sorted with the default Array.prototype.sort(), never localeCompare or Intl.Collator
- Why: RFC 8785 orders by UTF-16 code units; any other order changes every hash and breaks other languages
- Test: k0-jcs-utf16-order, k0-jcs-utf16-vs-codepoint

## DNB-003: ECDSA verification passes lowS: false
- Where: packages/ts/src/core/envelope.ts and core/webauthn.ts (p256.verify calls)
- Rule: every p256.verify call passes { lowS: false }
- Why: noble rejects high-S by default; authenticators and other languages may produce high-S signatures, which are valid ECDSA
- Test: k0-env-valid-es256-high-s

(DNB-004 is added by task T-M5-11.)
