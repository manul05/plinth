# ADR-0020: Registry update threshold by distinct approver IDs

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: "Option 1 (Recommended)" (approving R1-02 fix ADR + `contracts/` update)

## Context
R1-02 identified a high-severity design flaw in K2 `verifyRegistryChain`: `REGISTRY_POLICY.min_signatures` is `1`, so any single approver from version `n` could sign version `n + 1` alone, add a sockpuppet approver key they control, or weaken `max_ttl_seconds`, `allow_synced_passkeys`, or `break_glass` in a multi-person realm.

## Options
1. **Add optional `update_threshold` (1–5, default 1) to `RegistryPayload`** and enforce in `verifyRegistryChain` step 4 that version `n + 1` is signed by at least `previous.update_threshold ?? 1` **distinct approver `id`s** from the previous registry version (not merely distinct `kid`s).
2. **Raise `REGISTRY_POLICY.min_signatures` globally to 2**, breaking solo realms and all 6 existing `k2-registry-*` vectors.

## Decision
Option 1. Add `update_threshold?: number` (integer 1–5, defaulting to 1 when omitted; multi-person business realms MUST set `update_threshold` ≥ the realm's highest `min_approvals`) and require that many distinct `approver.id`s from the previous registry to sign any update (`i > 0`), returning `PK_APPROVAL_REGISTRY_UNAUTHORISED` otherwise.

## One-off generator script (not committed)
```js
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { p256 } from '@noble/curves/nist.js';
import {
  b64urlEncode,
  createEnvelope,
  digest,
  hexDecode,
  sha256Bytes,
  signingInput,
  utf8Encode,
} from './packages/ts/dist/index.js';

const VECTORS_DIR = 'contracts/test-vectors';
const base = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2/k2-registry-update-valid.json'), 'utf8'));
const key1 = JSON.parse(readFileSync(join(VECTORS_DIR, 'keys/p256-test-1.json'), 'utf8'));
const key2 = JSON.parse(readFileSync(join(VECTORS_DIR, 'keys/p256-test-2.json'), 'utf8'));
// Signed k2-registry-update-threshold-insufficient.json (1 sig vs update_threshold=2)
// and k2-registry-update-threshold-valid.json (owner + reviewer sigs vs update_threshold=2)
// and regenerated index.json (189 entries).
```

## Consequences
- Multi-person realms can require `M` distinct approvers to evolve the registry, blocking single-insider sockpuppet attacks (`TM-36`).
- Two new golden vectors (`k2-registry-update-threshold-insufficient.json`, `k2-registry-update-threshold-valid.json`) raise `k2/` to 51 vectors (183 total, 156 runtime, 189 `index.json` entries).
- Existing v1/v2 vectors without `update_threshold` default to `1` and stay valid.
