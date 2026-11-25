import { type Digest, digest, isTimestamp, type TrustedKey, verifyEnvelope } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import { DECISION_POLICY, SKEW_SECONDS } from './policies.js';
import { type RegistryPayload, trustedKeysFromRegistry } from './registry.js';
import { type ApprovalRequest, matchingCode } from './request.js';

export type ApprovalResult =
  | { valid: true; request_digest: Digest; matching_code: string; approver_ids: string[]; consume_id: string }
  | { valid: false; error: ErrorCode };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function verifyDecision(
  d: unknown,
  ctx: {
    requestDigest: Digest;
    trustedKeys: readonly TrustedKey[];
    registry: RegistryPayload;
    createdMs: number;
    expiresMs: number;
    skewMs: number;
  },
): { ok: true; approverId: string } | { ok: false; error: ErrorCode } {
  // 12a: outer envelope shape and payload object
  if (!isRecord(d) || d.type !== 'pk.approval.decision' || !isRecord(d.payload)) {
    return { ok: false, error: 'PK_APPROVAL_DECISION_MALFORMED' };
  }

  // 12b: verify signature envelope against DECISION_POLICY
  const envRes = verifyEnvelope(d, { trustedKeys: ctx.trustedKeys, policy: DECISION_POLICY });
  if (!envRes.valid) {
    return { ok: false, error: envRes.error };
  }

  // 12c: decision payload shape
  const p = d.payload;
  if (
    p.spec !== 'pk-approval/1.0' ||
    typeof p.approver_id !== 'string' ||
    p.approver_id.length === 0 ||
    (p.decision !== 'approve' && p.decision !== 'deny') ||
    typeof p.decided_at !== 'string' ||
    !isTimestamp(p.decided_at)
  ) {
    return { ok: false, error: 'PK_APPROVAL_DECISION_MALFORMED' };
  }

  // 12d: request digest binding
  if (p.request_digest !== ctx.requestDigest) {
    return { ok: false, error: 'PK_APPROVAL_REQUEST_MISMATCH' };
  }

  // 12e: signer-to-approver identity, profile/alg match, and synced-passkey policy
  for (const signer of envRes.signers) {
    const approver = ctx.registry.approvers.find((a) => a.kid === signer.kid);
    if (approver === undefined || approver.id !== p.approver_id) {
      return { ok: false, error: 'PK_APPROVAL_APPROVER_MISMATCH' };
    }
    if ((approver.profile === 'webauthn') !== (signer.alg === 'webauthn-ES256')) {
      return { ok: false, error: 'PK_APPROVAL_PROFILE_ALG_MISMATCH' };
    }
    if (signer.flags?.be === true && ctx.registry.allow_synced_passkeys !== true) {
      return { ok: false, error: 'PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED' };
    }
  }

  // 12f: decision timestamp within [created - skew, expires + skew]
  const decidedMs = Date.parse(p.decided_at);
  if (decidedMs < ctx.createdMs - ctx.skewMs || decidedMs > ctx.expiresMs + ctx.skewMs) {
    return { ok: false, error: 'PK_APPROVAL_DECISION_TIME' };
  }

  // 12g: any deny rejects the approval
  if (p.decision === 'deny') {
    return { ok: false, error: 'PK_APPROVAL_DENIED' };
  }

  // 12h: record distinct approver
  return { ok: true, approverId: p.approver_id };
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

    // Step 12: verify each decision
    const rd = digest(req);
    const trustedKeys = trustedKeysFromRegistry(input.registry);
    const approvers = new Set<string>();
    const ctx = {
      requestDigest: rd,
      trustedKeys,
      registry: input.registry,
      createdMs,
      expiresMs,
      skewMs,
    };
    for (const d of input.decisions) {
      const res = verifyDecision(d, ctx);
      if (!res.ok) {
        return { valid: false, error: res.error };
      }
      approvers.add(res.approverId);
    }

    // Step 13: distinct_from_requester
    if (req.policy.distinct_from_requester === true) {
      const humanId = req.requester.human_id;
      if (typeof humanId !== 'string' || humanId.length === 0) {
        return { valid: false, error: 'PK_APPROVAL_REQUESTER_UNKNOWN' };
      }
      if (approvers.has(humanId)) {
        return { valid: false, error: 'PK_APPROVAL_SELF_APPROVAL' };
      }
    }

    // Step 14: min_approvals threshold
    if (typeof req.policy.min_approvals !== 'number' || approvers.size < req.policy.min_approvals) {
      return { valid: false, error: 'PK_APPROVAL_INSUFFICIENT' };
    }

    // Step 15: valid
    return {
      valid: true,
      request_digest: rd,
      matching_code: matchingCode(req as unknown as ApprovalRequest),
      approver_ids: [...approvers].sort(),
      consume_id: req.id,
    };
  } catch {
    return { valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' };
  }
}
