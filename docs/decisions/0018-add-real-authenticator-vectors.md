# ADR-0018: Add real-authenticator WebAuthn vectors

- **Status:** Accepted
- **Date:** 2026-11-25
- **Decided by:** Owner
- **Owner approval:** Owner, 2026-11-25: "Option 1 (Recommended): Yes, commit both as verifyEnvelope vectors (gives permanent regression coverage for a real Windows Hello assertion and a real high-S synced-passkey assertion, containing only public keys/signatures over the test payload)."

## Context
All prior WebAuthn vectors in `contracts/test-vectors/` were synthetic. During the T-M3-08 spike on `http://localhost:8787`, two real authenticator assertions were captured and verified cleanly:
1. Windows Hello (laptop PIN): flags `0x05` (`UP+UV`, `BE=false`, `BS=false`), low-S signature.
2. Phone passkey via Google Password Manager (phone PIN): flags `0x1d` (`UP+UV+BE+BS`), **high-S signature (`s > n/2`)**.

As flagged in R1-06, relying solely on `spike-output/` (which is git-ignored) causes `real-assertion.test.ts` to silently skip in CI and on fresh clones.

## Options
1. **Commit both real-authenticator assertions** as `verifyEnvelope` golden vectors (`contracts/test-vectors/k2/k2-real-windows-hello.json` and `k2-real-phone.json`, suite `pk-approval/1.0`), regenerate `contracts/test-vectors/index.json`, and run them unconditionally in `k2-vectors.test.ts`. They contain only public keys, synthetic `request_digest` (`sha256:abab...`), and signatures over that test payload (no secrets or PII).
2. **Keep `spike-output/` local only** and leave `contracts/test-vectors/k2/` synthetic-only.

## Decision
Option 1. Commit `k2-real-windows-hello.json` and `k2-real-phone.json` as runtime `verifyEnvelope` vectors in `contracts/test-vectors/k2/` and regenerate `contracts/test-vectors/index.json`.

## One-off generator script (not committed)
```js
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  b64urlDecode,
  createEnvelope,
  DECISION_POLICY,
  jwkFromP256Spki,
  kidOf,
  signatureFromAssertion,
  verifyEnvelope,
} from './packages/ts/dist/index.js';

const VECTORS_DIR = 'contracts/test-vectors';

const captures = [
  {
    src: 'spike-output/assertion-1.json',
    id: 'k2-real-windows-hello',
    description: 'Real Windows Hello assertion (flags 0x05 UP+UV, low-S) captured on http://localhost:8787',
  },
  {
    src: 'spike-output/assertion-2.json',
    id: 'k2-real-phone',
    description: 'Real phone passkey assertion via Google Password Manager (flags 0x1d UP+UV+BE+BS, high-S) captured on http://localhost:8787',
  },
];

for (const item of captures) {
  const captured = JSON.parse(readFileSync(item.src, 'utf8'));
  const jwk = jwkFromP256Spki(b64urlDecode(captured.spki_b64url));
  const kid = kidOf(jwk);
  const sig = signatureFromAssertion({
    kid,
    role: 'approver',
    authenticatorData: b64urlDecode(captured.authenticatorData),
    clientDataJSON: b64urlDecode(captured.clientDataJSON),
    signature: b64urlDecode(captured.signature),
  });
  const envelope = createEnvelope('pk.approval.decision', captured.payload, [sig]);
  const trustedKeys = [{ kid, jwk, webauthn: { rp_id: 'localhost', origins: ['http://localhost:8787'] } }];
  const expectRes = verifyEnvelope(envelope, { trustedKeys, policy: DECISION_POLICY });
  if (!expectRes.valid) throw new Error(`${item.id} failed verifyEnvelope: ${expectRes.error}`);
  const vec = {
    suite: 'pk-approval/1.0',
    id: item.id,
    op: 'verifyEnvelope',
    description: item.description,
    input: { envelope, trusted_keys: trustedKeys, policy: DECISION_POLICY },
    expect: expectRes,
  };
  writeFileSync(join(VECTORS_DIR, 'k2', `${item.id}.json`), `${JSON.stringify(vec, null, 2)}\n`, 'utf8');
}

function listJson(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...listJson(join(dir, entry.name), rel));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(rel);
  }
  return out;
}

const paths = listJson(VECTORS_DIR).filter((p) => p !== 'index.json').sort();
const files = paths.map((p) => ({
  path: p,
  sha256: `sha256:${createHash('sha256').update(readFileSync(join(VECTORS_DIR, p))).digest('hex')}`,
}));
const indexDoc = {
  description: 'Every vector and key file with the SHA-256 of its exact bytes. Regenerate only through an ADR (see README.md).',
  generated_for: 'plinth 0.1.0',
  files,
};
writeFileSync(join(VECTORS_DIR, 'index.json'), `${JSON.stringify(indexDoc, null, 2)}\n`, 'utf8');
```

## Consequences
- `contracts/test-vectors/k2/` now holds 47 vectors (45 original + 2 real-authenticator `verifyEnvelope` vectors).
- Total vectors rise from 177 to 179 (152 runtime + 27 tool); `contracts/test-vectors/index.json` rises from 183 to 185 entries.
- `k2-vectors.test.ts`, `contracts.test.ts`, and `vectors.test.ts` execute and validate both real assertions on every CI run without skipping.
