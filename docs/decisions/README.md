# Decisions (ADRs)

One decision per file: `NNNN-short-title.md`, numbered in order, copied from `0000-template.md`.
ADRs are never deleted; a changed mind is a new ADR that says `Supersedes ADR-NNNN`, and the old
one's status becomes `Superseded by ADR-MMMM`. Decisions made in Stage 2 stay in
`../02-brainstorm.md`; new ones start here.

| ADR | Title | Status | Date |
|---|---|---|---|
| 0001 | [Adopt the portfolio repo conventions v1](0001-adopt-repo-conventions.md) | Accepted | 2026-10-31 |
| 0002 | [Release 0.1 contains K0, K1, K2, K4 and K5](0002-scope-of-release-0-1.md) | Accepted | 2026-10-31 |
| 0003 | [Use npm (bundled with Node) with workspaces](0003-npm-not-pnpm.md) | Accepted | 2026-10-31 |
| 0004 | [Runtime-neutral library code; Node 24.16.0 for tools](0004-runtime-neutral-library.md) | Accepted | 2026-10-31 |
| 0005 | [Crypto via @noble/curves, @noble/hashes and @scure/base; accept high-S](0005-crypto-libraries.md) | Accepted | 2026-10-31 |
| 0006 | [Own strict JSON parser and pk-JCS canonicaliser](0006-own-json-and-jcs.md) | Accepted | 2026-10-31 |
| 0007 | [Verify WebAuthn assertions in the kit without SimpleWebAuthn](0007-webauthn-without-simplewebauthn.md) | Accepted | 2026-10-31 |
| 0008 | [Exact version pins with a 14-day publish cooldown](0008-exact-pins-with-cooldown.md) | Accepted | 2026-10-31 |
| 0009 | [TypeScript 7.0.2, Vitest 5.0.5, Biome 2.5.15; Ajv, yaml and safe-regex2 as dev-only tools](0009-tooling.md) | Accepted | 2026-10-31 |
| 0010 | [Consumers vendor a hash-pinned snapshot](0010-hash-pinned-snapshot.md) | Accepted | 2026-10-31 |
| 0011 | [Keep the `pk` prefix for specs, types, rule ids and error codes](0011-keep-pk-prefix.md) | Accepted | 2026-10-31 |
| 0012 | [Refinements of the platform-kit draft made in Stage 3](0012-stage3-refinements.md) | Accepted | 2026-10-31 |
| 0013 | [Synced-passkey policy per realm via the BE flag](0013-synced-passkey-policy.md) | Accepted | 2026-10-31 |
| 0014 | [Public once tested, MIT, package name `plinth-kit`](0014-public-mit-package-name.md) | Accepted | 2026-10-31 |
