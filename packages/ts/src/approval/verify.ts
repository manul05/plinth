import { type Digest, isTimestamp } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import { SKEW_SECONDS } from './policies.js';
import type { RegistryPayload } from './registry.js';

export type ApprovalResult =
  | { valid: true; request_digest: Digest; matching_code: string; approver_ids: string[]; consume_id: string }
  | { valid: false; error: ErrorCode };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifies an approval request and its signed decisions against a registry and enforcement context. Never throws.
 */
export function verifyApproval(input: {
  request: unknown;
  decisions: readonly unknown[];
  registry: RegistryPayload;
  actualSubjectDigest: string;
  allowedActions: readonly string[];
  now: string;
  isConsumed: (id: string) => boolean;
}): ApprovalResult {
  try {
    const req = input.request;
    // Step 1: request shape
    if (
      !isRecord(req) ||
      typeof req.id !== 'string' ||
      !isRecord(req.subject) ||
      !isRecord(req.policy) ||
      !isRecord(req.requester) ||
      typeof req.created_at !== 'string' ||
      !isTimestamp(req.created_at) ||
      typeof req.expires_at !== 'string' ||
      !isTimestamp(req.expires_at) ||
      typeof input.now !== 'string' ||
      !isTimestamp(input.now)
    ) {
      return { valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' };
    }
    if (
      req.window !== undefined &&
      (!isRecord(req.window) ||
        typeof req.window.opens_at !== 'string' ||
        !isTimestamp(req.window.opens_at) ||
        typeof req.window.closes_at !== 'string' ||
        !isTimestamp(req.window.closes_at))
    ) {
      return { valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' };
    }

    // Step 2: spec
    if (req.spec !== 'pk-approval/1.0') {
      return { valid: false, error: 'PK_SPEC_UNSUPPORTED' };
    }

    // Step 3: realm
    if (req.realm !== input.registry.realm) {
      return { valid: false, error: 'PK_APPROVAL_REALM_MISMATCH' };
    }

    // Step 4: action allowlist
    if (typeof req.action !== 'string' || !input.allowedActions.includes(req.action)) {
      return { valid: false, error: 'PK_APPROVAL_UNKNOWN_ACTION' };
    }

    // Step 5: registry staleness
    if (typeof req.policy.registry_version !== 'number' || req.policy.registry_version > input.registry.version) {
      return { valid: false, error: 'PK_APPROVAL_REGISTRY_STALE' };
    }

    // Step 6: subject binding (exact string comparison, no default)
    if (req.subject.digest !== input.actualSubjectDigest) {
      return { valid: false, error: 'PK_APPROVAL_SUBJECT_MISMATCH' };
    }

    // Step 7: TTL bounds
    const createdMs = Date.parse(req.created_at);
    const expiresMs = Date.parse(req.expires_at);
    const nowMs = Date.parse(input.now);
    const skewMs = SKEW_SECONDS * 1000;
    if (expiresMs <= createdMs || expiresMs - createdMs > input.registry.max_ttl_seconds * 1000) {
      return { valid: false, error: 'PK_APPROVAL_TTL_TOO_LONG' };
    }

    // Step 8: created/expires window with skew
    if (nowMs < createdMs - skewMs) {
      return { valid: false, error: 'PK_APPROVAL_NOT_YET_VALID' };
    }
    if (nowMs > expiresMs + skewMs) {
      return { valid: false, error: 'PK_APPROVAL_EXPIRED' };
    }

    // Step 9: optional execution window (no skew)
    if (req.window !== undefined) {
      const opensMs = Date.parse(req.window.opens_at as string);
      const closesMs = Date.parse(req.window.closes_at as string);
      if (nowMs < opensMs) {
        return { valid: false, error: 'PK_APPROVAL_WINDOW_NOT_OPEN' };
      }
      if (nowMs > closesMs) {
        return { valid: false, error: 'PK_APPROVAL_WINDOW_CLOSED' };
      }
    }

    // Step 10: replay check
    if (input.isConsumed(req.id)) {
      return { valid: false, error: 'PK_APPROVAL_REPLAYED' };
    }

    // Step 11: decisions non-empty
    if (!Array.isArray(input.decisions)) {
      return { valid: false, error: 'PK_APPROVAL_DECISION_MALFORMED' };
    }
    if (input.decisions.length === 0) {
      return { valid: false, error: 'PK_APPROVAL_NO_DECISION' };
    }

    // Steps 12-15 implemented in T-M3-05
    try {
      throw new Error('decisions not implemented');
    } catch {
      return { valid: false, error: 'PK_APPROVAL_DECISION_MALFORMED' };
    }
  } catch {
    return { valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' };
  }
}
