import type { Digest } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import type { RegistryPayload } from './registry.js';

export type ApprovalResult =
  | { valid: true; request_digest: Digest; matching_code: string; approver_ids: string[]; consume_id: string }
  | { valid: false; error: ErrorCode };

export function verifyApproval(_input: {
  request: unknown;
  decisions: readonly unknown[];
  registry: RegistryPayload;
  actualSubjectDigest: string;
  allowedActions: readonly string[];
  now: string;
  isConsumed: (id: string) => boolean;
}): ApprovalResult {
  throw new Error('not implemented');
}
