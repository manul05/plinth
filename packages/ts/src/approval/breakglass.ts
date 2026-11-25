import type { Digest } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import type { RegistryPayload } from './registry.js';

export function newBreakGlassCode(): string {
  throw new Error('not implemented');
}

export function breakGlassDigest(_code: string): Digest {
  throw new Error('not implemented');
}

export function verifyBreakGlass(_input: {
  code: string;
  registry: RegistryPayload;
  usedDigests: readonly string[];
}): { valid: true; code_digest: Digest } | { valid: false; error: ErrorCode } {
  throw new Error('not implemented');
}
