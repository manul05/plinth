import { ed25519 } from '@noble/curves/ed25519.js';
import { concatBytes } from '@noble/hashes/utils.js';
import { type ErrorCode, PlinthError } from '../errors.js';
import { b64urlEncode, sha256Bytes, utf8Encode } from './bytes.js';
import { canonicalize, type Digest } from './jcs.js';
import type { JsonObject } from './json.js';
import { ed25519PublicJwk, kidOf, type PublicJwk } from './keys.js';

export type Alg = 'Ed25519' | 'ES256' | 'webauthn-ES256';

export interface SignaturePlain {
  kid: Digest;
  alg: 'Ed25519' | 'ES256';
  role: string;
  sig: string;
}

export interface SignatureWebauthn {
  kid: Digest;
  alg: 'webauthn-ES256';
  role: string;
  sig: string;
  authenticator_data: string;
  client_data_json: string;
}

export type SignatureEntry = SignaturePlain | SignatureWebauthn;

export interface Envelope<P extends object = JsonObject> {
  spec: 'pk-sig/1.0';
  type: string;
  payload: P;
  signatures: SignatureEntry[];
}

export interface TrustedKey {
  kid: Digest;
  jwk: PublicJwk;
  webauthn?: { rp_id: string; origins: string[] };
}

export type TypePolicy = Readonly<Record<string, { algs: readonly Alg[]; min_signatures: number }>>;

export interface AuthenticatorFlags {
  up: boolean;
  uv: boolean;
  be: boolean;
  bs: boolean;
}

export interface SignerInfo {
  kid: Digest;
  alg: Alg;
  role: string;
  flags?: AuthenticatorFlags;
}

export type VerifyResult = { valid: true; signers: SignerInfo[] } | { valid: false; error: ErrorCode };

export function signingInput(type: string, payload: object): Uint8Array {
  return concatBytes(utf8Encode(`pk-sig/1\n${type}\n`), sha256Bytes(utf8Encode(canonicalize(payload))));
}

export function webauthnChallenge(type: string, payload: object): Uint8Array {
  return sha256Bytes(signingInput(type, payload));
}

export function signEd25519(type: string, payload: object, secretKey: Uint8Array, role: string): SignaturePlain {
  if (!(secretKey instanceof Uint8Array) || secretKey.length !== 32) {
    throw new PlinthError('PK_KEY_INVALID');
  }
  const kid = kidOf(ed25519PublicJwk(secretKey));
  const sig = b64urlEncode(ed25519.sign(signingInput(type, payload), secretKey));
  return { kid, alg: 'Ed25519', role, sig };
}

export function createEnvelope<P extends object>(type: string, payload: P, signatures: SignatureEntry[]): Envelope<P> {
  return { spec: 'pk-sig/1.0', type, payload, signatures };
}

export function verifyEnvelope(
  _envelope: unknown,
  _opts: { trustedKeys: readonly TrustedKey[]; policy: TypePolicy },
): VerifyResult {
  throw new Error('not implemented');
}
