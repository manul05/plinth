import { p256 } from '@noble/curves/nist.js';
import { concatBytes } from '@noble/hashes/utils.js';
import type { ErrorCode } from '../errors.js';
import { b64urlDecode, b64urlEncode, sha256Bytes, utf8Encode } from './bytes.js';
import { derToP1363 } from './der.js';
import type { AuthenticatorFlags, SignatureWebauthn, TrustedKey } from './envelope.js';
import type { Digest } from './jcs.js';

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function verifyWebauthnSignature(
  entry: Record<string, unknown>,
  m: Uint8Array,
  key: TrustedKey,
): { ok: true; flags: AuthenticatorFlags } | { ok: false; error: ErrorCode } {
  // Step 1: trusted key has webauthn config
  if (!key.webauthn || typeof key.webauthn.rp_id !== 'string' || !Array.isArray(key.webauthn.origins)) {
    return { ok: false, error: 'PK_WEBAUTHN_NO_CONFIG' };
  }

  // Step 2: fields are strings and base64url decode succeeds
  if (typeof entry.authenticator_data !== 'string' || typeof entry.client_data_json !== 'string') {
    return { ok: false, error: 'PK_WEBAUTHN_MALFORMED' };
  }
  let sigBytes: Uint8Array;
  let authData: Uint8Array;
  let cdjBytes: Uint8Array;
  try {
    sigBytes = b64urlDecode(entry.sig as string);
    authData = b64urlDecode(entry.authenticator_data);
    cdjBytes = b64urlDecode(entry.client_data_json);
  } catch {
    return { ok: false, error: 'PK_ENCODING_INVALID' };
  }

  // Step 3: authenticatorData length >= 37
  if (authData.length < 37) {
    return { ok: false, error: 'PK_WEBAUTHN_MALFORMED' };
  }

  // Step 4: clientDataJSON decodes as strict UTF-8 and parses to an object
  let cd: Record<string, unknown>;
  try {
    const cdText = new TextDecoder('utf-8', { fatal: true }).decode(cdjBytes);
    const parsed: unknown = JSON.parse(cdText);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: 'PK_WEBAUTHN_MALFORMED' };
    }
    cd = parsed as Record<string, unknown>;
  } catch {
    return { ok: false, error: 'PK_WEBAUTHN_MALFORMED' };
  }

  // Step 5: type === "webauthn.get"
  if (cd.type !== 'webauthn.get') {
    return { ok: false, error: 'PK_WEBAUTHN_TYPE' };
  }

  // Step 6: challenge === base64url(SHA-256(M))
  const expectedChallenge = b64urlEncode(sha256Bytes(m));
  if (cd.challenge !== expectedChallenge) {
    return { ok: false, error: 'PK_WEBAUTHN_CHALLENGE' };
  }

  // Step 7: origin in webauthn.origins
  if (typeof cd.origin !== 'string' || !key.webauthn.origins.includes(cd.origin)) {
    return { ok: false, error: 'PK_WEBAUTHN_ORIGIN' };
  }

  // Step 8: crossOrigin !== true
  if (cd.crossOrigin === true) {
    return { ok: false, error: 'PK_WEBAUTHN_CROSS_ORIGIN' };
  }

  // Step 9: rpIdHash matches SHA-256(UTF-8(rp_id))
  const expectedRpIdHash = sha256Bytes(utf8Encode(key.webauthn.rp_id));
  if (!bytesEqual(authData.subarray(0, 32), expectedRpIdHash)) {
    return { ok: false, error: 'PK_WEBAUTHN_RPID' };
  }

  // Step 10: UP and UV flags
  const flagsByte = authData[32] ?? 0;
  const up = (flagsByte & 0x01) !== 0;
  if (!up) {
    return { ok: false, error: 'PK_WEBAUTHN_UP' };
  }
  const uv = (flagsByte & 0x04) !== 0;
  if (!uv) {
    return { ok: false, error: 'PK_WEBAUTHN_UV' };
  }

  // Step 11: strict DER + P-256 verify over authData || SHA-256(clientDataJSON)
  try {
    derToP1363(sigBytes);
    if (key.jwk.kty !== 'EC') {
      return { ok: false, error: 'PK_SIG_INVALID' };
    }
    const x = b64urlDecode(key.jwk.x);
    const y = b64urlDecode(key.jwk.y);
    if (x.length !== 32 || y.length !== 32) {
      return { ok: false, error: 'PK_SIG_INVALID' };
    }
    const pub = concatBytes(Uint8Array.of(4), x, y);
    const signedData = concatBytes(authData, sha256Bytes(cdjBytes));
    if (!p256.verify(sigBytes, signedData, pub, { format: 'der', lowS: false })) {
      return { ok: false, error: 'PK_SIG_INVALID' };
    }
  } catch {
    return { ok: false, error: 'PK_SIG_INVALID' };
  }

  // Step 12: return flags
  return {
    ok: true,
    flags: {
      up,
      uv,
      be: (flagsByte & 0x08) !== 0,
      bs: (flagsByte & 0x10) !== 0,
    },
  };
}

export function signatureFromAssertion(input: {
  kid: Digest;
  role: string;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signature: Uint8Array;
}): SignatureWebauthn {
  return {
    kid: input.kid,
    alg: 'webauthn-ES256',
    role: input.role,
    sig: b64urlEncode(input.signature),
    authenticator_data: b64urlEncode(input.authenticatorData),
    client_data_json: b64urlEncode(input.clientDataJSON),
  };
}
