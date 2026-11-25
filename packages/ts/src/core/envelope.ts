import type { ErrorCode } from '../errors.js';
import type { Digest } from './jcs.js';
import type { JsonObject } from './json.js';
import type { PublicJwk } from './keys.js';

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

export function signingInput(_type: string, _payload: object): Uint8Array {
  throw new Error('not implemented');
}

export function signEd25519(_type: string, _payload: object, _secretKey: Uint8Array, _role: string): SignaturePlain {
  throw new Error('not implemented');
}

export function createEnvelope<P extends object>(
  _type: string,
  _payload: P,
  _signatures: SignatureEntry[],
): Envelope<P> {
  throw new Error('not implemented');
}

export function verifyEnvelope(
  _envelope: unknown,
  _opts: { trustedKeys: readonly TrustedKey[]; policy: TypePolicy },
): VerifyResult {
  throw new Error('not implemented');
}
