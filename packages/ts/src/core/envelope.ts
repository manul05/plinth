import { ed25519 } from '@noble/curves/ed25519.js';
import { p256 } from '@noble/curves/nist.js';
import { concatBytes } from '@noble/hashes/utils.js';
import { type ErrorCode, PlinthError } from '../errors.js';
import { b64urlDecode, b64urlEncode, sha256Bytes, utf8Encode } from './bytes.js';
import { canonicalize, type Digest } from './jcs.js';
import type { JsonObject } from './json.js';
import { ed25519PublicJwk, kidOf, type PublicJwk } from './keys.js';
import { verifyWebauthnSignature } from './webauthn.js';

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

const KNOWN_ALGS: ReadonlySet<string> = new Set<Alg>(['Ed25519', 'ES256', 'webauthn-ES256']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function verifyPlainSignature(alg: 'Ed25519' | 'ES256', sigBytes: Uint8Array, m: Uint8Array, key: TrustedKey): boolean {
  if (sigBytes.length !== 64) {
    return false;
  }
  try {
    if (alg === 'Ed25519') {
      if (key.jwk.kty !== 'OKP') return false;
      const pub = b64urlDecode(key.jwk.x);
      if (pub.length !== 32) return false;
      return ed25519.verify(sigBytes, m, pub, { zip215: false });
    }
    if (key.jwk.kty !== 'EC') return false;
    const x = b64urlDecode(key.jwk.x);
    const y = b64urlDecode(key.jwk.y);
    if (x.length !== 32 || y.length !== 32) return false;
    const pub = concatBytes(Uint8Array.of(4), x, y);
    return p256.verify(sigBytes, m, pub, { lowS: false });
  } catch {
    return false;
  }
}

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
  envelope: unknown,
  opts: { trustedKeys: readonly TrustedKey[]; policy: TypePolicy },
): VerifyResult {
  try {
    // Step 1: top-level shape
    if (
      !isRecord(envelope) ||
      typeof envelope.spec !== 'string' ||
      typeof envelope.type !== 'string' ||
      !isRecord(envelope.payload) ||
      !Array.isArray(envelope.signatures) ||
      Object.keys(envelope).length !== 4
    ) {
      return { valid: false, error: 'PK_ENVELOPE_MALFORMED' };
    }

    // Step 2: spec
    if (envelope.spec !== 'pk-sig/1.0') {
      return { valid: false, error: 'PK_SPEC_UNSUPPORTED' };
    }

    // Step 3: policy allowlist
    if (!isRecord(opts) || !isRecord(opts.policy) || !Array.isArray(opts.trustedKeys)) {
      return { valid: false, error: 'PK_SIG_TYPE_NOT_ALLOWED' };
    }
    const typePolicy = Object.hasOwn(opts.policy, envelope.type) ? opts.policy[envelope.type] : undefined;
    if (
      !isRecord(typePolicy) ||
      !Array.isArray(typePolicy.algs) ||
      typeof typePolicy.min_signatures !== 'number' ||
      !Number.isSafeInteger(typePolicy.min_signatures) ||
      typePolicy.min_signatures < 1
    ) {
      return { valid: false, error: 'PK_SIG_TYPE_NOT_ALLOWED' };
    }

    // Step 4: non-empty signatures
    if (envelope.signatures.length === 0) {
      return { valid: false, error: 'PK_SIG_NONE' };
    }

    // Step 5: compute signing input M
    let m: Uint8Array;
    try {
      m = signingInput(envelope.type, envelope.payload);
    } catch (err) {
      const code = err instanceof PlinthError ? err.code : 'PK_JCS_UNSUPPORTED_TYPE';
      return { valid: false, error: code };
    }

    // Step 6: verify each signature in order
    const seenKids = new Set<string>();
    const signers: SignerInfo[] = [];

    for (const entry of envelope.signatures) {
      // 6(a): signature entry shape
      if (
        !isRecord(entry) ||
        typeof entry.kid !== 'string' ||
        typeof entry.alg !== 'string' ||
        typeof entry.role !== 'string' ||
        typeof entry.sig !== 'string'
      ) {
        return { valid: false, error: 'PK_ENVELOPE_MALFORMED' };
      }

      // 6(b): known alg
      if (!KNOWN_ALGS.has(entry.alg)) {
        return { valid: false, error: 'PK_SIG_UNKNOWN_ALG' };
      }
      const alg = entry.alg as Alg;

      // 6(c): alg allowed by policy
      if (!typePolicy.algs.includes(alg)) {
        return { valid: false, error: 'PK_SIG_ALG_NOT_ALLOWED' };
      }

      // 6(d): duplicate kid
      if (seenKids.has(entry.kid)) {
        return { valid: false, error: 'PK_SIG_DUPLICATE_KID' };
      }
      seenKids.add(entry.kid);

      // 6(e): trusted key lookup by exact kid
      const trustedKey = opts.trustedKeys.find((k) => k.kid === entry.kid);
      if (trustedKey === undefined) {
        return { valid: false, error: 'PK_SIG_UNKNOWN_KID' };
      }

      // 6(f): key type and curve match alg
      const kty = trustedKey.jwk?.kty;
      const crv = trustedKey.jwk?.crv;
      const matchesAlg = alg === 'Ed25519' ? kty === 'OKP' && crv === 'Ed25519' : kty === 'EC' && crv === 'P-256';
      if (!matchesAlg) {
        return { valid: false, error: 'PK_SIG_KEY_ALG_MISMATCH' };
      }

      // 6(g) & 6(h): decode and verify
      if (alg === 'webauthn-ES256') {
        const res = verifyWebauthnSignature(entry, m, trustedKey);
        if (!res.ok) {
          return { valid: false, error: res.error };
        }
        signers.push({ kid: trustedKey.kid, alg, role: entry.role, flags: res.flags });
        continue;
      }

      let sigBytes: Uint8Array;
      try {
        sigBytes = b64urlDecode(entry.sig);
      } catch (err) {
        const code = err instanceof PlinthError ? err.code : 'PK_ENCODING_INVALID';
        return { valid: false, error: code };
      }

      if (!verifyPlainSignature(alg, sigBytes, m, trustedKey)) {
        return { valid: false, error: 'PK_SIG_INVALID' };
      }

      signers.push({ kid: trustedKey.kid, alg, role: entry.role });
    }

    // Step 7: min_signatures threshold
    if (signers.length < typePolicy.min_signatures) {
      return { valid: false, error: 'PK_SIG_INSUFFICIENT' };
    }

    // Step 8: valid
    return { valid: true, signers };
  } catch {
    return { valid: false, error: 'PK_ENVELOPE_MALFORMED' };
  }
}
