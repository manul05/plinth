import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  b64urlDecode,
  createEnvelope,
  DECISION_POLICY,
  jwkFromP256Spki,
  kidOf,
  signatureFromAssertion,
  type TrustedKey,
  verifyEnvelope,
} from '../../src/index.js';
import { REPO_ROOT } from '../vectors.js';

const SPIKE_DIR = join(REPO_ROOT, 'spike-output');
const ASSERTION_FILES = existsSync(SPIKE_DIR)
  ? readdirSync(SPIKE_DIR)
      .filter((name) => /^assertion-\d+\.json$/.test(name))
      .sort()
  : [];

interface CapturedAssertion {
  payload: Record<string, unknown>;
  spki_b64url: string;
  credential_id: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
}

describe.skipIf(ASSERTION_FILES.length === 0)('real authenticator assertions (T-M3-08)', () => {
  for (const file of ASSERTION_FILES) {
    it(`verifies ${file}`, () => {
      const captured = JSON.parse(readFileSync(join(SPIKE_DIR, file), 'utf8')) as CapturedAssertion;
      const spki = b64urlDecode(captured.spki_b64url);
      const jwk = jwkFromP256Spki(spki);
      const kid = kidOf(jwk);
      const sigEntry = signatureFromAssertion({
        kid,
        role: 'approver',
        authenticatorData: b64urlDecode(captured.authenticatorData),
        clientDataJSON: b64urlDecode(captured.clientDataJSON),
        signature: b64urlDecode(captured.signature),
      });
      const envelope = createEnvelope('pk.approval.decision', captured.payload, [sigEntry]);
      const trustedKey: TrustedKey = {
        kid,
        jwk,
        webauthn: {
          rp_id: 'localhost',
          origins: ['http://localhost:8787'],
        },
      };
      const result = verifyEnvelope(envelope, {
        trustedKeys: [trustedKey],
        policy: DECISION_POLICY,
      });
      expect(result.valid, JSON.stringify(result)).toBe(true);
    });
  }
});
