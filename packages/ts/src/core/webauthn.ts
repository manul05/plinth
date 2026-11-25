import type { ErrorCode } from '../errors.js';
import type { AuthenticatorFlags, SignatureWebauthn, TrustedKey } from './envelope.js';
import type { Digest } from './jcs.js';

export function verifyWebauthnSignature(
  _entry: Record<string, unknown>,
  _m: Uint8Array,
  _key: TrustedKey,
): { ok: true; flags: AuthenticatorFlags } | { ok: false; error: ErrorCode } {
  return { ok: false, error: 'PK_SIG_INVALID' };
}

export function signatureFromAssertion(_input: {
  kid: Digest;
  role: string;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signature: Uint8Array;
}): SignatureWebauthn {
  throw new Error('not implemented');
}
