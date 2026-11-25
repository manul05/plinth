import { describe, expect, it } from 'vitest';
import {
  createEnvelope,
  hexDecode,
  signEd25519,
  type TrustedKey,
  type TypePolicy,
  verifyEnvelope,
} from '../../src/index.js';
import { loadKey } from '../vectors.js';

describe('verifyEnvelope never throws', () => {
  const key = loadKey('keys/ed25519-test-1.json');
  const trustedKeys: TrustedKey[] = [
    {
      kid: key.kid as TrustedKey['kid'],
      jwk: key.public_jwk as TrustedKey['jwk'],
    },
  ];
  const policy: TypePolicy = {
    'a.b': { algs: ['Ed25519'], min_signatures: 1 },
  };

  it('returns PK_ENVELOPE_MALFORMED for non-objects and malformed shapes', () => {
    const malformedInputs: unknown[] = [
      null,
      42,
      'x',
      {},
      [],
      { spec: 'pk-sig/1.0', type: 'a.b', payload: {}, signatures: [{ kid: 1 }] },
    ];
    for (const input of malformedInputs) {
      expect(verifyEnvelope(input, { trustedKeys, policy })).toEqual({
        valid: false,
        error: 'PK_ENVELOPE_MALFORMED',
      });
    }
  });

  it('returns canonicalisation error code without throwing', () => {
    const validSig = signEd25519('a.b', {}, hexDecode(key.private_hex), 'producer');
    const badPayloadEnv = createEnvelope('a.b', { n: 1.5 }, [validSig]);
    expect(verifyEnvelope(badPayloadEnv, { trustedKeys, policy })).toEqual({
      valid: false,
      error: 'PK_JCS_NON_INTEGER',
    });
  });

  it('does not match Object.prototype keys in policy', () => {
    const validSig = signEd25519('toString', {}, hexDecode(key.private_hex), 'producer');
    const env = createEnvelope('toString', {}, [validSig]);
    expect(verifyEnvelope(env, { trustedKeys, policy })).toEqual({
      valid: false,
      error: 'PK_SIG_TYPE_NOT_ALLOWED',
    });
  });
});
