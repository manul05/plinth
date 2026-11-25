import type { Digest } from './jcs.js';

export type Ed25519PublicJwk = { kty: 'OKP'; crv: 'Ed25519'; x: string };
export type P256PublicJwk = { kty: 'EC'; crv: 'P-256'; x: string; y: string };
export type PublicJwk = Ed25519PublicJwk | P256PublicJwk;

export const TEST_KIDS: readonly Digest[] = [];

export function thumbprintMembers(_jwk: unknown): PublicJwk {
  throw new Error('not implemented');
}

export function kidOf(_jwk: unknown): Digest {
  throw new Error('not implemented');
}

export function jwkFromP256Spki(_spki: Uint8Array): P256PublicJwk {
  throw new Error('not implemented');
}

export function ed25519PublicJwk(_secretKey: Uint8Array): Ed25519PublicJwk {
  throw new Error('not implemented');
}

export function isTestKid(_kid: string): boolean {
  throw new Error('not implemented');
}
