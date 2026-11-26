# ADR-0019: Enforcement-side action policies and authenticated requester identity

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: "Option 1 (Recommended)" (approving R1-01 fix ADR + `contracts/` update)

## Context
R1-01 identified a high-severity design flaw in K2 `verifyApproval`: `policy.min_approvals`, `policy.distinct_from_requester`, and `requester.human_id` were read exclusively from the untrusted `ApprovalRequest`. A compromised server or requesting agent could downgrade `min_approvals` to `1`, set `distinct_from_requester: false`, or spoof `requester.human_id` to bypass TM-12 self-approval protections.

## Options
1. **Add optional enforcement-side `actionPolicies` and `requesterHumanId` inputs** to `verifyApproval` and `verifyAndConsume`, take the stricter of request and enforcement policies (`max(min_approvals)`, `||` for `distinct_from_requester`), prefer `requesterHumanId` over `request.requester.human_id` whenever supplied, and require `action` to be an own property of `actionPolicies` when `actionPolicies` is provided.
2. **Require `actionPolicies` as a breaking change** across all 31 existing `k2-approval-*` golden vectors.

## Decision
Option 1. Add `ActionPolicy`, `actionPolicies?: Readonly<Record<string, ActionPolicy>>`, and `requesterHumanId?: string` to `verifyApproval` and `verifyAndConsume` (optional for backward compatibility with existing golden vectors; normative guidance requires products to always pass both from product code / enforcement auth).

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
const base = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2/k2-approval-valid-webauthn.json'), 'utf8'));
const key1 = JSON.parse(readFileSync(join(VECTORS_DIR, 'keys/p256-test-1.json'), 'utf8'));
const privBytes = hexDecode(key1.private_hex);

function signWebauthnDecision(payload, rpId = 'approvals.example', origin = 'https://approvals.example') {
  const challenge = b64urlEncode(sha256Bytes(signingInput('pk.approval.decision', payload)));
  const authData = new Uint8Array(37);
  authData.set(sha256Bytes(utf8Encode(rpId)), 0);
  authData[32] = 0x05;
  const cdj = utf8Encode(JSON.stringify({ type: 'webauthn.get', challenge, origin, crossOrigin: false }));
  const signedData = new Uint8Array(authData.length + 32);
  signedData.set(authData, 0);
  signedData.set(sha256Bytes(cdj), authData.length);
  const derSig = p256.sign(signedData, privBytes, { format: 'der' });
  return createEnvelope('pk.approval.decision', payload, [
    {
      alg: 'webauthn-ES256',
      kid: key1.kid,
      role: 'approver',
      sig: b64urlEncode(derSig),
      authenticator_data: b64urlEncode(authData),
      client_data_json: b64urlEncode(cdj),
    },
  ]);
}
// Built k2-approval-policy-downgrade.json and k2-approval-distinct-downgrade.json and regenerated index.json (187 entries).
```

## Consequences
- `verifyApproval` and `verifyAndConsume` enforce product-side policy floors and authenticated requester identity without trusting request claims.
- Two new golden vectors (`k2-approval-policy-downgrade.json`, `k2-approval-distinct-downgrade.json`) raise `k2/` to 49 vectors (181 total, 154 runtime, 187 `index.json` entries).
- `docs/05-threat-model.md` TM-12 updated to note enforcement-side `actionPolicies` and `requesterHumanId`.
