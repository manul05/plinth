import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  b64urlDecode,
  b64urlEncode,
  type SignatureWebauthn,
  signatureFromAssertion,
  type TrustedKey,
  type TypePolicy,
  utf8Encode,
  verifyEnvelope,
} from '../../src/index.js';
import { VECTORS_DIR } from '../vectors.js';

interface K2VectorInput {
  decisions: Array<{
    signatures: SignatureWebauthn[];
    [key: string]: unknown;
  }>;
  registry: {
    approvers: Array<{
      kid: TrustedKey['kid'];
      jwk: TrustedKey['jwk'];
      webauthn?: { rp_id: string; origins: string[] };
    }>;
  };
}

function loadK2DecisionCase(id: string): {
  envelope: K2VectorInput['decisions'][number];
  trustedKeys: TrustedKey[];
} {
  const vec = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2', `${id}.json`), 'utf8')) as {
    input: K2VectorInput;
  };
  const trustedKeys: TrustedKey[] = vec.input.registry.approvers.map((a) =>
    a.webauthn
      ? { kid: a.kid, jwk: a.jwk, webauthn: { rp_id: a.webauthn.rp_id, origins: a.webauthn.origins } }
      : { kid: a.kid, jwk: a.jwk },
  );
  const envelope = vec.input.decisions[0];
  if (!envelope) throw new Error(`Missing decision in ${id}`);
  return { envelope, trustedKeys };
}

const POLICY: TypePolicy = {
  'pk.approval.decision': { algs: ['webauthn-ES256', 'ES256'], min_signatures: 1 },
};

describe('webauthn', () => {
  it('verifies device-bound webauthn assertion with flags', () => {
    const { envelope, trustedKeys } = loadK2DecisionCase('k2-approval-valid-webauthn');
    const res = verifyEnvelope(envelope, { trustedKeys, policy: POLICY });
    expect(res).toEqual({
      valid: true,
      signers: [
        {
          kid: 'sha256:0cebf1bc9880748a95588905b79843b42ba75cb174055e3e246bf87fe00b4a6d',
          alg: 'webauthn-ES256',
          role: 'approver',
          flags: { up: true, uv: true, be: false, bs: false },
        },
      ],
    });
  });

  it('verifies synced passkey assertion with be/bs flags', () => {
    const { envelope, trustedKeys } = loadK2DecisionCase('k2-approval-synced-passkey-allowed');
    const res = verifyEnvelope(envelope, { trustedKeys, policy: POLICY });
    expect(res).toEqual({
      valid: true,
      signers: [
        {
          kid: 'sha256:3ac89067e535ba409c9073ef96f35548806a960e63fde900d70cc2d2fb82018c',
          alg: 'webauthn-ES256',
          role: 'approver',
          flags: { up: true, uv: true, be: true, bs: true },
        },
      ],
    });
  });

  const negativeCases: Array<[string, string]> = [
    ['k2-approval-wrong-origin', 'PK_WEBAUTHN_ORIGIN'],
    ['k2-approval-wrong-rpid', 'PK_WEBAUTHN_RPID'],
    ['k2-approval-uv-off', 'PK_WEBAUTHN_UV'],
    ['k2-approval-up-off', 'PK_WEBAUTHN_UP'],
    ['k2-approval-wrong-clientdata-type', 'PK_WEBAUTHN_TYPE'],
    ['k2-approval-wrong-challenge', 'PK_WEBAUTHN_CHALLENGE'],
    ['k2-approval-cross-origin', 'PK_WEBAUTHN_CROSS_ORIGIN'],
  ];

  for (const [id, expectedError] of negativeCases) {
    it(`rejects ${id} with ${expectedError}`, () => {
      const { envelope, trustedKeys } = loadK2DecisionCase(id);
      expect(verifyEnvelope(envelope, { trustedKeys, policy: POLICY })).toEqual({
        valid: false,
        error: expectedError,
      });
    });
  }

  it('rejects missing webauthn config with PK_WEBAUTHN_NO_CONFIG', () => {
    const { envelope, trustedKeys } = loadK2DecisionCase('k2-approval-valid-webauthn');
    const stripped = trustedKeys.map(({ kid, jwk }) => ({ kid, jwk }));
    expect(verifyEnvelope(envelope, { trustedKeys: stripped, policy: POLICY })).toEqual({
      valid: false,
      error: 'PK_WEBAUTHN_NO_CONFIG',
    });
  });

  it('signatureFromAssertion round-trips the valid signature entry', () => {
    const { envelope } = loadK2DecisionCase('k2-approval-valid-webauthn');
    const entry = envelope.signatures[0];
    if (!entry) throw new Error('Missing signature entry');
    const built = signatureFromAssertion({
      kid: entry.kid,
      role: entry.role,
      authenticatorData: b64urlDecode(entry.authenticator_data),
      clientDataJSON: b64urlDecode(entry.client_data_json),
      signature: b64urlDecode(entry.sig),
    });
    expect(built).toEqual(entry);
  });

  it('rejects short authenticator_data and malformed client_data_json with PK_WEBAUTHN_MALFORMED (R2-08)', () => {
    const { envelope, trustedKeys } = loadK2DecisionCase('k2-approval-valid-webauthn');

    const shortAuthEnv = structuredClone(envelope);
    if (!shortAuthEnv.signatures[0]) throw new Error('Missing signature');
    shortAuthEnv.signatures[0].authenticator_data = b64urlEncode(new Uint8Array(36));
    expect(verifyEnvelope(shortAuthEnv, { trustedKeys, policy: POLICY })).toEqual({
      valid: false,
      error: 'PK_WEBAUTHN_MALFORMED',
    });

    const badJsonEnv = structuredClone(envelope);
    if (!badJsonEnv.signatures[0]) throw new Error('Missing signature');
    badJsonEnv.signatures[0].client_data_json = b64urlEncode(utf8Encode('{not-json'));
    expect(verifyEnvelope(badJsonEnv, { trustedKeys, policy: POLICY })).toEqual({
      valid: false,
      error: 'PK_WEBAUTHN_MALFORMED',
    });
  });
});
