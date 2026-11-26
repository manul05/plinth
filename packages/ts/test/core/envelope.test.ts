import { p256 } from '@noble/curves/nist.js';
import { describe, expect, it } from 'vitest';
import {
  b64urlEncode,
  createEnvelope,
  hexDecode,
  kidOf,
  signEd25519,
  signingInput,
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

  it('rejects wrong JWK crv for Ed25519 and ES256 with PK_SIG_KEY_ALG_MISMATCH (R2-09)', () => {
    const validSig = signEd25519('a.b', {}, hexDecode(key.private_hex), 'producer');
    const env = createEnvelope('a.b', {}, [validSig]);
    const wrongEdCurve: TrustedKey[] = [
      {
        kid: key.kid as TrustedKey['kid'],
        jwk: { ...key.public_jwk, crv: 'Ed448' } as unknown as TrustedKey['jwk'],
      },
    ];
    expect(verifyEnvelope(env, { trustedKeys: wrongEdCurve, policy })).toEqual({
      valid: false,
      error: 'PK_SIG_KEY_ALG_MISMATCH',
    });

    const p256Key = loadKey('keys/p256-test-1.json');
    const p256Sig = {
      alg: 'ES256' as const,
      kid: p256Key.kid as TrustedKey['kid'],
      role: 'producer',
      sig: b64urlEncode(p256.sign(signingInput('a.b', {}), hexDecode(p256Key.private_hex), { prehash: true })),
    };
    const p256Env = createEnvelope('a.b', {}, [p256Sig]);
    const wrongEcCurve: TrustedKey[] = [
      {
        kid: p256Key.kid as TrustedKey['kid'],
        jwk: { ...p256Key.public_jwk, crv: 'P-384' } as unknown as TrustedKey['jwk'],
      },
    ];
    expect(
      verifyEnvelope(p256Env, {
        trustedKeys: wrongEcCurve,
        policy: { 'a.b': { algs: ['ES256'], min_signatures: 1 } },
      }),
    ).toEqual({
      valid: false,
      error: 'PK_SIG_KEY_ALG_MISMATCH',
    });
  });

  it('rejects malformed policy min_signatures/algs (SEC-R3-08) and Ed25519 small-order identity key (SEC-R3-10)', () => {
    const validSig = signEd25519('a.b', {}, hexDecode(key.private_hex), 'producer');
    const env = createEnvelope('a.b', {}, [validSig]);

    expect(
      verifyEnvelope(env, {
        trustedKeys,
        policy: { 'a.b': { algs: ['Ed25519'], min_signatures: Number.NaN } },
      }),
    ).toEqual({ valid: false, error: 'PK_SIG_TYPE_NOT_ALLOWED' });

    expect(
      verifyEnvelope(env, {
        trustedKeys,
        policy: { 'a.b': { algs: 'Ed25519' as unknown as readonly ['Ed25519'], min_signatures: 1 } },
      }),
    ).toEqual({ valid: false, error: 'PK_SIG_TYPE_NOT_ALLOWED' });

    const identityBytes = new Uint8Array(32);
    identityBytes[0] = 0x01;
    const identityJwk = { kty: 'OKP' as const, crv: 'Ed25519' as const, x: b64urlEncode(identityBytes) };
    const identityKid = kidOf(identityJwk);
    const trivialSig = new Uint8Array(64);
    trivialSig[0] = 0x01;
    const smallOrderEnv = createEnvelope('a.b', { msg: 'forged' }, [
      { kid: identityKid, alg: 'Ed25519', role: 'producer', sig: b64urlEncode(trivialSig) },
    ]);
    expect(
      verifyEnvelope(smallOrderEnv, {
        trustedKeys: [{ kid: identityKid, jwk: identityJwk }],
        policy,
      }),
    ).toEqual({ valid: false, error: 'PK_SIG_INVALID' });
  });
});
