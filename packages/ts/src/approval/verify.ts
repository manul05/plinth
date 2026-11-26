import { type Digest, digest, isTimestamp, type TrustedKey, verifyEnvelope } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import { DECISION_POLICY, SKEW_SECONDS } from './policies.js';
import { type RegistryPayload, trustedKeysFromRegistry } from './registry.js';
import { type ApprovalRequest, matchingCode } from './request.js';
import { checkApproverSignerPolicy } from './signer-policy.js';

export interface ActionPolicy {
  min_approvals: number;
  distinct_from_requester: boolean;
}

export type ApprovalResult =
  | { valid: true; request_digest: Digest; matching_code: string; approver_ids: string[]; consume_id: string }
  | { valid: false; error: ErrorCode };

const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

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
    const policyErr = checkApproverSignerPolicy(approver, signer, ctx.registry.allow_synced_passkeys);
    if (policyErr !== undefined) {
      return { ok: false, error: policyErr };
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
 * Products MUST pass `actionPolicies` and `requesterHumanId` from enforcement auth so requests cannot downgrade policy.
 */
export function verifyApproval(input: {
  request: unknown;
  decisions: readonly unknown[];
  registry: RegistryPayload;
  actualSubjectDigest: string;
  allowedActions: readonly string[];
  now: string;
  isConsumed: (id: string) => boolean;
  actionPolicies?: Readonly<Record<string, ActionPolicy>>;
  requesterHumanId?: string;
}): ApprovalResult {
  try {
    const req = input.request;
    // Step 1: request shape
    if (
      !isRecord(req) ||
      typeof req.id !== 'string' ||
      req.id.length < 1 ||
      !isRecord(req.subject) ||
      typeof req.subject.digest !== 'string' ||
      !DIGEST_RE.test(req.subject.digest) ||
      !isRecord(req.policy) ||
      typeof req.policy.min_approvals !== 'number' ||
      !Number.isSafeInteger(req.policy.min_approvals) ||
      req.policy.min_approvals < 1 ||
      typeof req.policy.distinct_from_requester !== 'boolean' ||
      typeof req.policy.registry_version !== 'number' ||
      !Number.isSafeInteger(req.policy.registry_version) ||
      req.policy.registry_version < 1 ||
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
    if (
      !isRecord(input.registry) ||
      typeof input.registry.realm !== 'string' ||
      input.registry.realm.length === 0 ||
      typeof input.registry.version !== 'number' ||
      !Number.isSafeInteger(input.registry.version) ||
      input.registry.version < 1 ||
      !Array.isArray(input.registry.approvers)
    ) {
      return { valid: false, error: 'PK_APPROVAL_REGISTRY_MALFORMED' };
    }

    // Step 2: spec
    if (req.spec !== 'pk-approval/1.0') {
      return { valid: false, error: 'PK_SPEC_UNSUPPORTED' };
    }

    // Step 3: realm
    if (typeof req.realm !== 'string' || req.realm.length === 0 || req.realm !== input.registry.realm) {
      return { valid: false, error: 'PK_APPROVAL_REALM_MISMATCH' };
    }

    // Step 4: action allowlist and optional enforcement-side policy map
    if (typeof req.action !== 'string' || !input.allowedActions.includes(req.action)) {
      return { valid: false, error: 'PK_APPROVAL_UNKNOWN_ACTION' };
    }
    let epPolicy: ActionPolicy | undefined;
    if (input.actionPolicies !== undefined) {
      if (!isRecord(input.actionPolicies) || !Object.hasOwn(input.actionPolicies, req.action)) {
        return { valid: false, error: 'PK_APPROVAL_UNKNOWN_ACTION' };
      }
      const candidate = input.actionPolicies[req.action];
      if (
        !isRecord(candidate) ||
        typeof candidate.min_approvals !== 'number' ||
        !Number.isSafeInteger(candidate.min_approvals) ||
        candidate.min_approvals < 1 ||
        typeof candidate.distinct_from_requester !== 'boolean'
      ) {
        return { valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' };
      }
      epPolicy = candidate;
    }

    // Step 5: registry staleness
    if (typeof req.policy.registry_version !== 'number' || req.policy.registry_version > input.registry.version) {
      return { valid: false, error: 'PK_APPROVAL_REGISTRY_STALE' };
    }

    // Step 6: subject binding (exact digest format + exact string comparison, no default)
    if (
      typeof input.actualSubjectDigest !== 'string' ||
      !DIGEST_RE.test(input.actualSubjectDigest) ||
      req.subject.digest !== input.actualSubjectDigest
    ) {
      return { valid: false, error: 'PK_APPROVAL_SUBJECT_MISMATCH' };
    }

    // Step 7: TTL bounds (fail closed on missing/non-integer/out-of-range max_ttl_seconds)
    const createdMs = Date.parse(req.created_at);
    const expiresMs = Date.parse(req.expires_at);
    const nowMs = Date.parse(input.now);
    const skewMs = SKEW_SECONDS * 1000;
    const maxTtl = input.registry.max_ttl_seconds;
    if (
      typeof maxTtl !== 'number' ||
      !Number.isSafeInteger(maxTtl) ||
      maxTtl < 60 ||
      maxTtl > 86400 ||
      expiresMs <= createdMs ||
      expiresMs - createdMs > maxTtl * 1000
    ) {
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

    // Step 13: distinct_from_requester (stricter of request and enforcement policy; authenticated requesterHumanId wins)
    const effectiveDistinct = req.policy.distinct_from_requester || epPolicy?.distinct_from_requester === true;
    if (effectiveDistinct) {
      const humanId = input.requesterHumanId !== undefined ? input.requesterHumanId : req.requester.human_id;
      if (typeof humanId !== 'string' || humanId.length === 0) {
        return { valid: false, error: 'PK_APPROVAL_REQUESTER_UNKNOWN' };
      }
      if (approvers.has(humanId)) {
        return { valid: false, error: 'PK_APPROVAL_SELF_APPROVAL' };
      }
    }

    // Step 14: min_approvals threshold (stricter of request and enforcement policy)
    const effectiveMin = Math.max(req.policy.min_approvals, epPolicy?.min_approvals ?? 1);
    if (approvers.size < effectiveMin) {
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
