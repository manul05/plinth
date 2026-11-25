# ADR-0023: Adjust NFR-2 pure-JS crypto verification budgets

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: `"option 1"` (adjusting NFR-2 `verifyEnvelope` and `verifyApproval` budgets in `03-spec.md`, `M5-detection.md`, and `budgets.perf.ts`)

## Context
During `T-M5-10` on the owner's i5-8300H laptop (Node 26.13.1), `npm run test:perf` measured:
- `canonicalize + digest` (10 KB): `0.506 ms` idle / `2.801 ms` loaded (budget `<= 5 ms`, pass)
- `verifyEnvelope` Ed25519: `5.450 ms` idle / `19.125 ms` loaded (bare Node micro-benchmark `min: 5.923 ms`, `median: 9.094–10.025 ms`, failing `<= 5 ms`)
- `verifyApproval` WebAuthn ES256: `12.250 ms` idle / `38.510 ms` loaded (failing `<= 20 ms` under load)
- `verifyChain` (10,000 events + checkpoint): `414.34 ms` idle / `1,168.57 ms` loaded (budget `<= 3,000 ms`, pass)
- `scan` (100,062 chars, all 4 packs): `21.274 ms` idle / `116.523 ms` loaded (budget `<= 200 ms`, pass)
- ReDoS adversarial check (35 active rules x 3 inputs): max `5.502 ms` idle / `24.779 ms` loaded (budget `<= 100 ms`, pass)

Pure-JS `@noble/curves` 2.4.0 (ADR-0005) BigInt field arithmetic cannot verify Ed25519 under `5 ms` on this CPU.

## Options
1. **Option 1 — Raise NFR-2 crypto budgets to `verifyEnvelope` Ed25519 `<= 25 ms` and `verifyApproval` WebAuthn `<= 50 ms`** while keeping all other NFR-2/NFR-3 budgets unchanged.
2. **Option 2 — Keep `20 ms` for `verifyApproval` and raise only `verifyEnvelope` to `<= 15 ms`** (still fragile under laptop thermal throttling or CI load).
3. **Option 3 — Switch verification to async WebCrypto**, breaking the synchronous API contract and ADR-0005.

## Decision
Option 1. Keep the runtime-neutral pure-JS synchronous crypto from ADR-0004/ADR-0005 and set NFR-2 `verifyEnvelope` Ed25519 to `<= 25 ms` and `verifyApproval` WebAuthn to `<= 50 ms`.

## Consequences
- `docs/03-spec.md`, `docs/plan/M5-detection.md`, and `packages/ts/test/perf/budgets.perf.ts` enforce realistic pure-JS budgets (`<= 25 ms` / `<= 50 ms`).
- Interactive approval checks and CI runs remain fast (~`5–39 ms` per verification) with zero API or dependency changes.
