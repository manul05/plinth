import type { TrustedKey } from '../core/index.js';
import type { ErrorCode } from '../errors.js';

export type ChainResult =
  | { valid: true; status: 'verified'; anchored_seq: number; last_seq: number }
  | {
      valid: true;
      status: 'intact_unanchored_tail';
      anchored_seq: number;
      last_seq: number;
      warning: 'PK_AUDIT_UNANCHORED_TAIL';
    }
  | { valid: false; error: ErrorCode; at_seq?: number; cause?: ErrorCode };

export function verifyChain(_input: {
  chain: string;
  lines: readonly unknown[];
  checkpoints: readonly unknown[];
  trustedKeys: readonly TrustedKey[];
}): ChainResult {
  throw new Error('not implemented');
}
