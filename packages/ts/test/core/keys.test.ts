import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ed25519PublicJwk, hexDecode, isTestKid, jwkFromP256Spki, PlinthError, TEST_KIDS } from '../../src/index.js';
import { loadKey, loadVectors, VECTORS_DIR } from '../vectors.js';

function expectPlinthCode(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${code})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(code);
  }
}

describe('keys', () => {
  const testKidsFile = JSON.parse(readFileSync(join(VECTORS_DIR, 'keys', 'test-kids.json'), 'utf8')) as {
    kids: string[];
  };

  it('TEST_KIDS equals test-kids.json', () => {
    expect(TEST_KIDS).toHaveLength(5);
    expect(TEST_KIDS).toEqual(testKidsFile.kids);
  });

  it('isTestKid recognises all five', () => {
    for (const kid of testKidsFile.kids) {
      expect(isTestKid(kid)).toBe(true);
    }
    expect(isTestKid(`sha256:${'a'.repeat(64)}`)).toBe(false);
  });

  it('ed25519PublicJwk derives public key', () => {
    const key = loadKey('keys/ed25519-test-1.json');
    expect(ed25519PublicJwk(hexDecode(key.private_hex))).toEqual(key.public_jwk);
  });

  for (const vec of loadVectors('k2', 'jwkFromP256Spki')) {
    it(vec.id, () => {
      const spki = hexDecode(vec.input.spki_hex as string);
      if (typeof vec.expect.error === 'string') {
        expectPlinthCode(() => jwkFromP256Spki(spki), vec.expect.error);
      } else {
        expect(jwkFromP256Spki(spki)).toEqual(vec.expect.jwk);
      }
    });
  }
});
