import { describe, expect, it } from 'vitest';
import {
  b64urlEncode,
  canonicalize,
  derToP1363,
  digest,
  hexDecode,
  hexEncode,
  kidOf,
  PlinthError,
  p1363ToDer,
  parseJson,
  signEd25519,
  signingInput,
  type TrustedKey,
  type TypePolicy,
  thumbprintMembers,
  verifyEnvelope,
  webauthnChallenge,
} from '../../src/index.js';
import { loadKey, loadVectors } from '../vectors.js';

function expectPlinthError(fn: () => unknown, expectedCode: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${expectedCode})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(expectedCode);
  }
}

describe('k0 parseAndCanonicalize', () => {
  for (const vec of loadVectors('k0', 'parseAndCanonicalize')) {
    it(vec.id, () => {
      const jsonText = vec.input.json_text as string;
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => canonicalize(parseJson(jsonText)), vec.expect.error);
      } else {
        const parsed = parseJson(jsonText);
        expect(canonicalize(parsed)).toBe(vec.expect.canonical);
        expect(digest(parsed)).toBe(vec.expect.digest);
      }
    });
  }
});

describe('k0 kidOf', () => {
  for (const vec of loadVectors('k0', 'kidOf')) {
    it(vec.id, () => {
      const jwk = vec.input.jwk;
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => kidOf(jwk), vec.expect.error);
      } else {
        expect(kidOf(jwk)).toBe(vec.expect.kid);
        expect(canonicalize(thumbprintMembers(jwk))).toBe(vec.expect.canonical_member_set);
      }
    });
  }
});

describe('k0 p1363ToDer', () => {
  for (const vec of loadVectors('k0', 'p1363ToDer')) {
    it(vec.id, () => {
      const p1363Hex = vec.input.p1363_hex as string;
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => p1363ToDer(hexDecode(p1363Hex)), vec.expect.error);
      } else {
        expect(hexEncode(p1363ToDer(hexDecode(p1363Hex)))).toBe(vec.expect.der_hex);
      }
    });
  }
});

describe('k0 derToP1363', () => {
  for (const vec of loadVectors('k0', 'derToP1363')) {
    it(vec.id, () => {
      const derHex = vec.input.der_hex as string;
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => derToP1363(hexDecode(derHex)), vec.expect.error);
      } else {
        expect(hexEncode(derToP1363(hexDecode(derHex)))).toBe(vec.expect.p1363_hex);
      }
    });
  }
});

describe('k0 signingInput', () => {
  for (const vec of loadVectors('k0', 'signingInput')) {
    it(vec.id, () => {
      const type = vec.input.type as string;
      const payload = vec.input.payload as object;
      expect(hexEncode(signingInput(type, payload))).toBe(vec.expect.signing_input_hex);
      expect(canonicalize(payload)).toBe(vec.expect.payload_canonical);
      expect(b64urlEncode(webauthnChallenge(type, payload))).toBe(vec.expect.webauthn_challenge_b64url);
    });
  }
});

describe('k0 signEd25519', () => {
  for (const vec of loadVectors('k0', 'signEd25519')) {
    it(vec.id, () => {
      const type = vec.input.type as string;
      const payload = vec.input.payload as object;
      const role = vec.input.role as string;
      const key = loadKey(vec.input.key_file as string);
      expect(signEd25519(type, payload, hexDecode(key.private_hex), role)).toEqual(vec.expect.signature);
    });
  }
});

describe('k0 verifyEnvelope', () => {
  for (const vec of loadVectors('k0', 'verifyEnvelope')) {
    it(vec.id, () => {
      const result = verifyEnvelope(vec.input.envelope, {
        trustedKeys: vec.input.trusted_keys as TrustedKey[],
        policy: vec.input.policy as TypePolicy,
      });
      expect(result).toEqual(vec.expect);
    });
  }
});
