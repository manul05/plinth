import type { SignatureWebauthn } from './envelope.js';
import type { Digest } from './jcs.js';

export function signatureFromAssertion(_input: {
  kid: Digest;
  role: string;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signature: Uint8Array;
}): SignatureWebauthn {
  throw new Error('not implemented');
}
