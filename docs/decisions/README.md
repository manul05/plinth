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
| 0015 | [The subject digest is defined by each product, not by Plinth](0015-subject-digest-is-product-defined.md) | Accepted | 2026-11-07 |
| 0016 | [Re-pin Node.js to 26.13.1 and npm to 11.20.0](0016-repin-node-26-13-1-npm-11-20-0.md) | Accepted | 2026-11-25 |
| 0017 | [Declare property "d" inside "not" in jwk.schema.json for Ajv strict mode](0017-jwk-schema-strict-required.md) | Accepted | 2026-11-25 |
| 0018 | [Add real-authenticator WebAuthn vectors](0018-add-real-authenticator-vectors.md) | Accepted | 2026-11-25 |
| 0019 | [Enforcement-side action policies and authenticated requester identity](0019-enforcement-action-policies-and-requester-id.md) | Accepted | 2026-11-25 |
| 0020 | [Registry update threshold by distinct approver IDs](0020-registry-update-threshold-distinct-approvers.md) | Accepted | 2026-11-25 |
| 0021 | [Harden K2 validation guards and document K1 anchor limit](0021-harden-k2-validation-and-k1-anchor-limit.md) | Accepted | 2026-11-25 |
| 0022 | [Verified Indian key formats (gate G-K5)](0022-verified-indian-key-formats.md) | Accepted | 2026-11-25 |
| 0023 | [Adjust NFR-2 pure-JS crypto verification budgets](0023-adjust-crypto-nfr2-perf-budgets.md) | Accepted | 2026-11-25 |
| 0024 | [Enforce approver profile and synced-passkey checks on registry chain](0024-enforce-registry-profile-and-synced-passkey-checks.md) | Accepted | 2026-11-26 |
