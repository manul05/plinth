import type { ActorKind } from '../audit/event.js';
import type { Digest } from '../core/index.js';

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

export function createApprovalRequest(_input: {
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
  throw new Error('not implemented');
}

export function matchingCode(_request: ApprovalRequest): string {
  throw new Error('not implemented');
}

export function decisionPayload(_input: {
  request: ApprovalRequest;
  decision: 'approve' | 'deny';
  decidedAt: string;
  approverId: string;
  reason?: string;
}): DecisionPayload {
  throw new Error('not implemented');
}
