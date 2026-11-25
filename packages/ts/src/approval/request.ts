import type { ActorKind } from '../audit/event.js';
import {
  canonicalize,
  type Digest,
  digest,
  newNonce,
  newUuidV7,
  sha256Bytes,
  timestampFromMs,
  utf8Encode,
} from '../core/index.js';
import { PlinthError } from '../errors.js';

export interface ApprovalRequest {
  spec: 'pk-approval/1.0';
  id: string;
  realm: string;
  action: string;
  subject: { kind: string; digest: Digest; attributes?: Record<string, string> };
  display: { title: string; risk: string[] };
  requester: { kind: ActorKind; id: string; human_id?: string };
  created_at: string;
  expires_at: string;
  nonce: string;
  policy: { registry_version: number; min_approvals: number; distinct_from_requester: boolean };
  window?: { opens_at: string; closes_at: string };
}

export interface DecisionPayload {
  spec: 'pk-approval/1.0';
  request_digest: Digest;
  decision: 'approve' | 'deny';
  decided_at: string;
  approver_id: string;
  reason?: string;
}

/**
 * Creates a new `pk-approval/1.0` approval request with a fresh UUIDv7, nonce, and expiry timestamp.
 */
export function createApprovalRequest(input: {
  realm: string;
  action: string;
  subject: ApprovalRequest['subject'];
  display: ApprovalRequest['display'];
  requester: ApprovalRequest['requester'];
  policy: ApprovalRequest['policy'];
  window?: ApprovalRequest['window'];
  nowMs: number;
  ttlSeconds: number;
}): ApprovalRequest {
  if (
    !Number.isFinite(input.nowMs) ||
    !Number.isInteger(input.ttlSeconds) ||
    input.ttlSeconds < 1 ||
    input.ttlSeconds > 86400
  ) {
    throw new PlinthError('PK_APPROVAL_REQUEST_MALFORMED');
  }
  const req: ApprovalRequest = {
    spec: 'pk-approval/1.0',
    id: newUuidV7(input.nowMs),
    realm: input.realm,
    action: input.action,
    subject: input.subject,
    display: input.display,
    requester: input.requester,
    created_at: timestampFromMs(input.nowMs),
    expires_at: timestampFromMs(input.nowMs + input.ttlSeconds * 1000),
    nonce: newNonce(),
    policy: input.policy,
  };
  if (input.window !== undefined) {
    req.window = input.window;
  }
  return req;
}

/**
 * Computes the 6-digit out-of-band matching code from the canonical SHA-256 digest of a request.
 */
export function matchingCode(request: ApprovalRequest): string {
  const d = sha256Bytes(utf8Encode(canonicalize(request)));
  const u = (((d[0] ?? 0) << 24) >>> 0) + ((d[1] ?? 0) << 16) + ((d[2] ?? 0) << 8) + (d[3] ?? 0);
  return String(u % 1_000_000).padStart(6, '0');
}

/**
 * Builds the `pk-approval/1.0` decision payload bound to the canonical digest of `input.request`.
 */
export function decisionPayload(input: {
  request: ApprovalRequest;
  decision: 'approve' | 'deny';
  decidedAt: string;
  approverId: string;
  reason?: string;
}): DecisionPayload {
  const payload: DecisionPayload = {
    spec: 'pk-approval/1.0',
    request_digest: digest(input.request),
    decision: input.decision,
    decided_at: input.decidedAt,
    approver_id: input.approverId,
  };
  if (input.reason !== undefined) {
    payload.reason = input.reason;
  }
  return payload;
}
