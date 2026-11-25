import { ed25519 } from '@noble/curves/ed25519.js';
import { p256 } from '@noble/curves/nist.js';
import { concatBytes } from '@noble/hashes/utils.js';
import { PlinthError } from '../errors.js';
import { b64urlDecode, b64urlEncode, hexDecode } from './bytes.js';
import { type Digest, digest } from './jcs.js';
import { TEST_KIDS } from './test-kids.js';

export type Ed25519PublicJwk = { kty: 'OKP'; crv: 'Ed25519'; x: string };
export type P256PublicJwk = { kty: 'EC'; crv: 'P-256'; x: string; y: string };
export type PublicJwk = Ed25519PublicJwk | P256PublicJwk;

const P256_SPKI_PREFIX = hexDecode('3059301306072a8648ce3d020106082a8648ce3d030107034200');

export function thumbprintMembers(jwk: unknown): PublicJwk {
  if (typeof jwk !== 'object' || jwk === null || Array.isArray(jwk)) {
    throw new PlinthError('PK_KEY_UNSUPPORTED');
  }
  const obj = jwk as Record<string, unknown>;
  if (obj.kty === 'OKP' && obj.crv === 'Ed25519') {
    if (typeof obj.x !== 'string') {
      throw new PlinthError('PK_KEY_INVALID');
    }
    const xBytes = b64urlDecode(obj.x);
    if (xBytes.length !== 32) {
      throw new PlinthError('PK_KEY_INVALID');
    }
    return { kty: 'OKP', crv: 'Ed25519', x: obj.x };
  }
  if (obj.kty === 'EC' && obj.crv === 'P-256') {
    if (typeof obj.x !== 'string' || typeof obj.y !== 'string') {
      throw new PlinthError('PK_KEY_INVALID');
    }
    const xBytes = b64urlDecode(obj.x);
    const yBytes = b64urlDecode(obj.y);
    if (xBytes.length !== 32 || yBytes.length !== 32) {
      throw new PlinthError('PK_KEY_INVALID');
    }
    try {
      p256.Point.fromBytes(concatBytes(Uint8Array.of(4), xBytes, yBytes));
    } catch {
      throw new PlinthError('PK_KEY_INVALID');
    }
    return { kty: 'EC', crv: 'P-256', x: obj.x, y: obj.y };
  }
  throw new PlinthError('PK_KEY_UNSUPPORTED');
}

export function kidOf(jwk: unknown): Digest {
  return digest(thumbprintMembers(jwk));
}

export function jwkFromP256Spki(spki: Uint8Array): P256PublicJwk {
  if (!(spki instanceof Uint8Array) || spki.length !== 91 || spki[26] !== 0x04) {
    throw new PlinthError('PK_KEY_UNSUPPORTED');
  }
  for (let i = 0; i < P256_SPKI_PREFIX.length; i++) {
    if (spki[i] !== P256_SPKI_PREFIX[i]) {
      throw new PlinthError('PK_KEY_UNSUPPORTED');
    }
  }
  const x = b64urlEncode(spki.subarray(27, 59));
  const y = b64urlEncode(spki.subarray(59, 91));
  return thumbprintMembers({ kty: 'EC', crv: 'P-256', x, y }) as P256PublicJwk;
}

export function ed25519PublicJwk(secretKey: Uint8Array): Ed25519PublicJwk {
  if (!(secretKey instanceof Uint8Array) || secretKey.length !== 32) {
    throw new PlinthError('PK_KEY_INVALID');
  }
  return { kty: 'OKP', crv: 'Ed25519', x: b64urlEncode(ed25519.getPublicKey(secretKey)) };
}

export function isTestKid(kid: string): boolean {
  return TEST_KIDS.includes(kid as Digest);
}
