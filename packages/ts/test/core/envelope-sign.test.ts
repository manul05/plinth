import { describe, expect, it } from 'vitest';
import {
  createEnvelope,
  hexDecode,
  PlinthError,
  signEd25519,
  signingInput,
  webauthnChallenge,
} from '../../src/index.js';
import { loadKey } from '../vectors.js';

function expectKeyInvalid(fn: () => unknown): void {
  try {
    fn();
    expect.unreachable('Expected PlinthError(PK_KEY_INVALID)');
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe('PK_KEY_INVALID');
  }
}

describe('envelope signing', () => {
  it('rejects non-32-byte secret key with PK_KEY_INVALID', () => {
    expectKeyInvalid(() => signEd25519('t.x.y', {}, new Uint8Array(31), 'r'));
    expectKeyInvalid(() => signEd25519('t.x.y', {}, new Uint8Array(33), 'r'));
  });

  it('signing the same input twice gives identical sig and createEnvelope wraps it', () => {
    const sk = hexDecode(loadKey('keys/ed25519-test-1.json').private_hex);
    const payload = { a: 1, b: 'ok' };
    const sig1 = signEd25519('t.x.y', payload, sk, 'producer');
    const sig2 = signEd25519('t.x.y', payload, sk, 'producer');
    expect(sig1).toEqual(sig2);

    const env = createEnvelope('t.x.y', payload, [sig1]);
    expect(env).toEqual({ spec: 'pk-sig/1.0', type: 't.x.y', payload, signatures: [sig1] });
    expect(webauthnChallenge('t.x.y', payload)).toHaveLength(32);
    expect(signingInput('t.x.y', payload).length).toBeGreaterThan(32);
  });
});
