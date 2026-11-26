# contracts/ — the machine-readable truth for Plinth

Code and tests are checked against these files. **Never change anything here without an ADR in `docs/decisions/` and the owner's OK** (START-HERE.md, executor rules).

| Path | What it is |
|---|---|
| `spec/k0-core.md` | Strict JSON, pk-JCS canonical form, digests, keys and kid, DER/P1363, signed envelope `pk-sig/1.0`, WebAuthn signature entries |
| `spec/k1-audit.md` | Audit chain `pk-audit/1.0`: events, checkpoints, pruning, verification order, export, personal-data lint |
| `spec/k2-approval.md` | Approvals `pk-approval/1.0`: request, decision, registry, verification order, single use, break-glass |
| `spec/k4-rulepack.md` | Rule-pack format `pk-rulepack/1.0`: YAML subset, compiler, as-of selection, regex dialect, runtime loading |
| `spec/k5-detection.md` | Detection packs and the reference matcher: scan, redact, placeholders, validators |
| `spec/errors.md`, `errors.json` | All 97 error codes with exact messages (JSON is the source) |
| `api/plinth-api.d.ts` | The exact public TypeScript API of `plinth-kit` 0.1.0 |
| `schemas/*.json` | JSON Schema 2020-12 for every K0/K1/K2/K4/K5 object (`$id` base `https://plinth.invalid/schemas/`, a never-resolving placeholder host) |
| `test-vectors/` | 183 golden vectors + TEST-ONLY keys; see its README for how they were made and how each op is called |

Spec versions inside objects: `pk-sig/1.0`, `pk-audit/1.0`, `pk-approval/1.0`, `pk-rulepack/1.0`. Verifiers reject unknown majors and newer minors (`PK_SPEC_UNSUPPORTED`) and must keep verifying every older minor of a major forever.

The prefix `pk` ("Plinth kit") is kept from the design draft for every spec id, type string, rule id and error code (ADR-0011).
