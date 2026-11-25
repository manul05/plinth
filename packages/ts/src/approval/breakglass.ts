import { base32nopad } from '@scure/base';
import { type Digest, digestBytes, utf8Encode } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import type { RegistryPayload } from './registry.js';

const BREAK_GLASS_RE = /^[A-Z2-7]{20}$/;

function normaliseCode(code: string): string {
  return code.toUpperCase().replace(/[- ]/g, '');
}

/**
 * Generates a 100-bit break-glass recovery code formatted as `XXXXX-XXXXX-XXXXX-XXXXX`.
 */
export function newBreakGlassCode(): string {
  const raw = base32nopad.encode(crypto.getRandomValues(new Uint8Array(13))).slice(0, 20);
  return raw.match(/.{5}/g)?.join('-') ?? raw;
}

/**
 * Computes the canonical SHA-256 digest of a normalised break-glass recovery code.
 */
export function breakGlassDigest(code: string): Digest {
  return digestBytes(utf8Encode(normaliseCode(code)));
}

/**
 * Verifies a break-glass recovery code against a registry's `break_glass` list and prior uses.
 */
export function verifyBreakGlass(input: {
  code: string;
  registry: RegistryPayload;
  usedDigests: readonly string[];
}): { valid: true; code_digest: Digest } | { valid: false; error: ErrorCode } {
  if (typeof input.code !== 'string') {
    return { valid: false, error: 'PK_APPROVAL_BREAK_GLASS_FORMAT' };
  }
  const normalised = normaliseCode(input.code);
  if (!BREAK_GLASS_RE.test(normalised)) {
    return { valid: false, error: 'PK_APPROVAL_BREAK_GLASS_FORMAT' };
  }
  const codeDigest = digestBytes(utf8Encode(normalised));
  if (!input.registry.break_glass.some((entry) => entry.code_digest === codeDigest)) {
    return { valid: false, error: 'PK_APPROVAL_BREAK_GLASS_UNKNOWN' };
  }
  if (input.usedDigests.includes(codeDigest)) {
    return { valid: false, error: 'PK_APPROVAL_BREAK_GLASS_USED' };
  }
  return { valid: true, code_digest: codeDigest };
}
