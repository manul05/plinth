import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type ApprovalRequest,
  createApprovalRequest,
  decisionPayload,
  digest,
  matchingCode,
  PlinthError,
} from '../../src/index.js';
import { VECTORS_DIR } from '../vectors.js';

function loadK2Vector(name: string): { input: Record<string, unknown>; expect: Record<string, unknown> } {
  return JSON.parse(readFileSync(join(VECTORS_DIR, 'k2', `${name}.json`), 'utf8')) as {
    input: Record<string, unknown>;
    expect: Record<string, unknown>;
  };
}

describe('approval request helpers', () => {
  it('computes matchingCode matching the golden vectors', () => {
    const v1 = loadK2Vector('k2-matching-code');
    const v2 = loadK2Vector('k2-matching-code-2');
    expect(matchingCode(v1.input.request as ApprovalRequest)).toBe('823898');
    expect(matchingCode(v2.input.request as ApprovalRequest)).toBe('472141');
  });

  it('creates an ApprovalRequest with UUIDv7, nonce, timestamps and optional window', () => {
    const req = createApprovalRequest({
      realm: 'passdown:project:x',
      action: 'passdown.git.push_protected_ref',
      subject: { kind: 'git-commit', digest: digest({ a: 1 }) },
      display: { title: 'Push 3 commits to main', risk: ['main'] },
      requester: { kind: 'agent', id: 'codex:client:02' },
      policy: { registry_version: 1, min_approvals: 1, distinct_from_requester: false },
      nowMs: 1793955600000,
      ttlSeconds: 600,
    });

    expect(req.spec).toBe('pk-approval/1.0');
    expect(req.created_at).toBe('2026-11-06T09:00:00.000Z');
    expect(req.expires_at).toBe('2026-11-06T09:10:00.000Z');
    expect(req.id.startsWith('01a1b016-1680-7')).toBe(true);
    expect(req.nonce).toHaveLength(22);
    expect('window' in req).toBe(false);

    const withWindow = createApprovalRequest({
      realm: 'passdown:project:x',
      action: 'passdown.git.push_protected_ref',
      subject: { kind: 'git-commit', digest: digest({ a: 1 }) },
      display: { title: 'Push 3 commits to main', risk: ['main'] },
      requester: { kind: 'agent', id: 'codex:client:02' },
      policy: { registry_version: 1, min_approvals: 1, distinct_from_requester: false },
      window: { opens_at: '2026-11-06T09:02:00.000Z', closes_at: '2026-11-06T09:08:00.000Z' },
      nowMs: 1793955600000,
      ttlSeconds: 600,
    });
    expect(withWindow.window).toEqual({
      opens_at: '2026-11-06T09:02:00.000Z',
      closes_at: '2026-11-06T09:08:00.000Z',
    });
  });

  it('rejects out-of-range ttlSeconds with PK_APPROVAL_REQUEST_MALFORMED', () => {
    for (const badTtl of [0, -1, 86401, 1.5, Number.NaN]) {
      try {
        createApprovalRequest({
          realm: 'passdown:project:x',
          action: 'passdown.git.push_protected_ref',
          subject: { kind: 'git-commit', digest: digest({ a: 1 }) },
          display: { title: 'Push 3 commits to main', risk: ['main'] },
          requester: { kind: 'agent', id: 'codex:client:02' },
          policy: { registry_version: 1, min_approvals: 1, distinct_from_requester: false },
          nowMs: 1793955600000,
          ttlSeconds: badTtl,
        });
        expect.unreachable(`Expected PK_APPROVAL_REQUEST_MALFORMED for ttlSeconds=${badTtl}`);
      } catch (err) {
        expect(err).toBeInstanceOf(PlinthError);
        expect((err as PlinthError).code).toBe('PK_APPROVAL_REQUEST_MALFORMED');
      }
    }
  });

  it('builds decisionPayload matching k2-approval-valid-webauthn', () => {
    const reqVec = loadK2Vector('k2-matching-code');
    const approvalVec = loadK2Vector('k2-approval-valid-webauthn');
    const decisions = approvalVec.input.decisions as Array<{ payload: Record<string, unknown> }>;
    const expectedPayload = decisions[0]?.payload;

    const payload = decisionPayload({
      request: reqVec.input.request as ApprovalRequest,
      decision: 'approve',
      decidedAt: '2026-11-02T09:03:00.000Z',
      approverId: 'owner',
    });
    expect(payload).toEqual(expectedPayload);
    expect('reason' in payload).toBe(false);

    const withReason = decisionPayload({
      request: reqVec.input.request as ApprovalRequest,
      decision: 'deny',
      decidedAt: '2026-11-02T09:03:00.000Z',
      approverId: 'owner',
      reason: 'Wrong branch',
    });
    expect(withReason.reason).toBe('Wrong branch');
  });
});
