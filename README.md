# Plinth

> The shared trust layer under a portfolio of security products: one written set of rules — with golden test vectors and a small TypeScript library — for canonical JSON, signed envelopes, tamper-evident audit logs, "two hands" approvals, rule packs and secret / Indian-PII detection, so every product produces and checks the same bytes.

CI badge: added at release (T-MR-06) · Licence: MIT · Status: **Stage 3 planned; Phase 1 (release 0.1.0) not started**

## Demo

- **Video (3 min):** recorded at release 0.1.0 (script: `docs/testing.md` §10).
- **Live demo:** not hosted — Plinth is a library; the static verify page arrives with K3 in 0.2.

## What it does (release 0.1.0)

- **K0 Core:** strict I-JSON parsing, RFC 8785 canonical JSON (integers only, no null), SHA-256 digests, key IDs, signed envelopes (Ed25519, ES256, WebAuthn passkeys) with domain separation and fail-closed verification.
- **K1 Audit chain:** hash-chained events, signed checkpoints, 180-day pruning that stays verifiable, and a verifier that names the first tampered event.
- **K2 Approvals ("the dangerous button needs two hands"):** approval requests bound to exactly one action, 6-digit matching codes, passkey-signed decisions, approver registries that a compromised server cannot change, single use, break-glass codes.
- **K4 Rule packs:** versioned rules with source, effective dates and tests; safe YAML subset; portable regex dialect.
- **K5 Detection:** global and Indian secret rules (Razorpay, Cashfree, MSG91, Zoho, Instamojo), Indian PII (Aadhaar with Verhoeff, PAN, mobile, UPI, IFSC, GSTIN), hidden-Unicode and prompt-injection phrases; redaction with typed placeholders (`[REDACTED:github_pat:…6591]`, `[REDACTED:aadhaar]`).

**What it is not:** not a framework, server, UI library, auth system, database or crypto library. It never phones home and stores nothing.

## Why it exists

Twenty-one portfolio products across web, Windows and Android all need audit logs, signed approvals, evidence and redaction. Written once as contracts with language-neutral golden vectors, the TypeScript, C# and Kotlin versions must agree byte for byte, and the security properties are proven by tests anyone can run.

## Use it in a product

Products vendor a tagged snapshot pinned by hash: [docs/consuming.md](docs/consuming.md). The exact API is [contracts/api/plinth-api.d.ts](contracts/api/plinth-api.d.ts).

## Run it locally

Prerequisites: Git for Windows (Git Bash) and Node.js 26.13.1 (npm 11.20.0). Full steps: [START-HERE.md](START-HERE.md).

```sh
git clone <repo URL>
cd plinth
sh scripts/install-hooks.sh      # contributors: installs the git guard hooks
npm ci
npm run check                    # lint, typecheck, tests, pack drift check, conformance
```

Tests: `npm test` · Vectors in any language: [contracts/test-vectors/README.md](contracts/test-vectors/README.md)

## Architecture

Library modules `core → audit / approval / rulepack → detect`, plus Node-only tools. Details: [docs/04-architecture.md](docs/04-architecture.md).

## Security

- How to report a vulnerability: [SECURITY.md](SECURITY.md)
- Threat model: [docs/05-threat-model.md](docs/05-threat-model.md)
- **Security review:** [docs/07-security-review.md](docs/07-security-review.md) (written at release 0.1.0)
- Honest limits: synced passkeys are not device-bound (regulated realms refuse them); whoever controls the enforcement point can skip verification; secret and injection detection is defence in depth, not a guarantee.

## How I built this with AI

Planned in Stage 3 by Claude; built by directing AI coding agents (Antigravity, with Claude reviews) under written rules, owner gates and tests-first task cards.
Full write-up: [docs/08-how-i-built-this.md](docs/08-how-i-built-this.md) (written at release).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Crypto | @noble/curves 2.4.0, @noble/hashes 2.4.0, @scure/base 2.4.0 | ADR-0005 |
| Language / build | TypeScript 7.0.2, npm workspaces | ADR-0003, ADR-0009 |
| Tests / lint | Vitest 5.0.5, Biome 2.5.15 | ADR-0009 |
| Distribution | Hash-pinned vendored snapshot | ADR-0010 |

## Project docs

Research, spec, plan and decisions: [docs/00-index.md](docs/00-index.md). Changes: [CHANGELOG.md](CHANGELOG.md).

## Licence

MIT: see [LICENSE](LICENSE). Secret-detection regexes adapted from gitleaks (MIT): see [NOTICE](NOTICE).
