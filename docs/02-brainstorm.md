# Plinth: Stage 2 brainstorm (short form)

**Status:** v1.0 (2026-10-31, written at the start of Stage 3 because Plinth is a programme foundation, not one of the 21 brainstormed projects). Sources: `docs/01-research.md` (platform-kit design, copied verbatim) and the programme decisions log of 2026-10-28 and 2026-10-31.

> Legend: **[Manul]** = decided by Manul · **[Claude]** = Claude's call, open to override.

## 1. One-liner
Plinth is the portfolio's **shared platform kit**: small written contracts (canonical JSON, signed envelopes, a tamper-evident audit chain, signed "two hands" approvals, versioned rule packs, secret and Indian-PII detection) with golden test vectors and a thin TypeScript library, so every product produces and checks **the same bytes**. **[Claude, accepted with the foundations 2026-10-31]**

## 2. What it is not
Not a framework, server, UI library, auth system, database or crypto library. It never runs as a service and never phones home. Product-specific rule content stays in products. (`01-research.md` §2b) **[Claude]**

## 3. Components (K0–K7) and what Phase 1 = release 0.1 contains
| Component | In 0.1? | Why |
|---|---|---|
| K0 Core: strict JSON, pk-JCS, digests, kid, signed envelope (Ed25519, ES256, WebAuthn-ES256) | **Yes** | Base of everything **[Claude]** |
| K1 Audit chain | **Yes** | Every web project's Phase 1 has an audit log **[Claude]** |
| K2 Approvals ("two hands") | **Yes** | Passdown goes first and needs passkey-signed approvals on day one; the design says K2 moves into 0.1 in that case **[Manul: build order 2026-10-31]** |
| K3 Evidence bundle + verify page | No (0.2) | First needed by Toolmark / Muster **[Claude]** |
| K4 Rule-pack format + compiler | **Yes** | Needed by K5 **[Claude]** |
| K5 Detection packs + TS matcher | **Yes** | Passdown redacts secrets and Indian PII before storage; Gatecrasher next **[Claude]** |
| K6 India compliance data | No (0.2) | Retention default (180 days) lives in Passdown config for now **[Claude]** |
| K7 Signed webhooks | No (0.6) | No producer–consumer pair yet **[Claude]** |
| Docs pattern `two-hands-ux.md` | **Yes** | Listed in the design for 0.1 **[Claude]** |

## 4. Consumers
1. **Passdown** (cross-agent handoff hub, Cloudflare Workers, TypeScript) — first consumer: K0 envelopes and handoff signatures, K1 hash-chained ledger, K2 passkey gate for pushes to protected refs, K5 redaction and hidden-text checks.
2. Then Gatecrasher (K5), Toolmark (K0, K3 in 0.2), Rounds, Muster, Common Seal; desktop and Android projects later through C# (0.3) and Kotlin (0.5) bindings that must pass the same vectors.

## 5. Decisions carried in
- **[Manul, 2026-10-31]** Plinth repo goes **public once tested** (the only exception to "private until done"); licence **MIT**.
- **[Manul, 2026-10-31]** Projects consume a **hash-pinned snapshot** (vendored), not a registry or submodule.
- **[Manul, 2026-10-31]** **Synced passkeys allowed for solo tools** (Passdown), **device-bound keys for business and regulated products**.
- **[Manul, 2026-10-31]** **C# and Kotlin bindings only when first needed**; vectors are language-neutral now.
- **[Manul, 2026-10-31]** Specs and vectors first; code is built just in time for the first consumer (Plinth's Phase 1 runs right before Passdown's build).
- **[Manul, 2026-10-28]** India-first, global-ready; zero budget; MIT for kits; "the dangerous button needs two hands".
- **[Claude, 2026-10-31]** Two algorithms only (Ed25519 software keys, P-256 hardware/passkey keys); integers-only, no-null JCS profile; DSSE-style domain-separated signing input; keep the `pk` prefix.

## 6. Phases
- **Phase 1 = Plinth 0.1** (this plan): K0, K1, K2, K4, K5 in TypeScript, 177 golden vectors, tagged snapshot vendored by Passdown.
- **Later (outlines in `06-plan.md`):** 0.2 K3 + K6; 0.3 C# binding; 0.4 Windows TPM profile + K6 clocks; 0.5 Kotlin binding; 0.6 K7; 1.0 freeze after two shipped consumers per component.

## 7. Success criteria
Passdown builds on 0.1 without changing any kit format; 100 % of runtime vectors pass in Plinth CI and in Passdown CI (drift check); zero raw secrets in any test fixture; the repo is public with a ruleset on `main` after the release.

## 8. Decisions log
- 2026-10-31: short-form brainstorm written at Stage 3 start from the platform-kit draft and the 2026-10-31 programme decisions. **[Claude]**
