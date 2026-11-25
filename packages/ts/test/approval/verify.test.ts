import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type RegistryPayload, verifyApproval } from '../../src/index.js';
import { loadVectors, VECTORS_DIR } from '../vectors.js';

function loadValidApprovalInput(): {
  request: Record<string, unknown>;
  decisions: unknown[];
  registry: RegistryPayload;
  actual_subject_digest: string;
  allowed_actions: string[];
  now: string;
} {
  const raw = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2', 'k2-approval-valid-webauthn.json'), 'utf8')) as {
    input: {
      request: Record<string, unknown>;
      decisions: unknown[];
      registry: RegistryPayload;
      actual_subject_digest: string;
      allowed_actions: string[];
      now: string;
    };
  };
  return raw.input;
}

describe('verifyApproval', () => {
  it('passes all 33 verifyApproval golden vectors', () => {
    const vectors = loadVectors('k2', 'verifyApproval');
    expect(vectors).toHaveLength(33);
    for (const vec of vectors) {
      const consumedIds = vec.input.consumed_ids as readonly string[];
      const actionPolicies = vec.input.action_policies as
        | Readonly<Record<string, { min_approvals: number; distinct_from_requester: boolean }>>
        | undefined;
      const requesterHumanId = vec.input.requester_human_id as string | undefined;
      const result = verifyApproval({
        request: vec.input.request,
        decisions: vec.input.decisions as readonly unknown[],
        registry: vec.input.registry as RegistryPayload,
        actualSubjectDigest: vec.input.actual_subject_digest as string,
        allowedActions: vec.input.allowed_actions as readonly string[],
        now: vec.input.now as string,
        isConsumed: (id) => consumedIds.includes(id),
        ...(actionPolicies !== undefined ? { actionPolicies } : {}),
        ...(requesterHumanId !== undefined ? { requesterHumanId } : {}),
      });
      expect(result, vec.id).toEqual(vec.expect);
    }
  });

  it('rejects action missing from actionPolicies and prevents requesterHumanId bypass', () => {
    const valid = loadValidApprovalInput();
    expect(
      verifyApproval({
        request: valid.request,
        decisions: valid.decisions,
        registry: valid.registry,
        actualSubjectDigest: valid.actual_subject_digest,
        allowedActions: valid.allowed_actions,
        now: valid.now,
        isConsumed: () => false,
        actionPolicies: {},
      }),
    ).toEqual({ valid: false, error: 'PK_APPROVAL_UNKNOWN_ACTION' });

    expect(
      verifyApproval({
        request: valid.request,
        decisions: valid.decisions,
        registry: valid.registry,
        actualSubjectDigest: valid.actual_subject_digest,
        allowedActions: valid.allowed_actions,
        now: valid.now,
        isConsumed: () => false,
        actionPolicies: {
          'passdown.git.push_protected_ref': { min_approvals: 1, distinct_from_requester: true },
        },
        requesterHumanId: '',
      }),
    ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUESTER_UNKNOWN' });
  });

  describe('verifyApproval never throws', () => {
    it('returns PK_APPROVAL_REQUEST_MALFORMED for null, "x", and {} requests', () => {
      const valid = loadValidApprovalInput();
      for (const badRequest of [null, 'x', {}]) {
        expect(
          verifyApproval({
            request: badRequest,
            decisions: valid.decisions,
            registry: valid.registry,
            actualSubjectDigest: valid.actual_subject_digest,
            allowedActions: valid.allowed_actions,
            now: valid.now,
            isConsumed: () => false,
          }),
        ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' });
      }
    });

    it('returns PK_APPROVAL_DECISION_MALFORMED for malformed decision entries', () => {
      const valid = loadValidApprovalInput();
      for (const badDecisions of [[null], [{ type: 'pk.approval.decision' }]]) {
        expect(
          verifyApproval({
            request: valid.request,
            decisions: badDecisions,
            registry: valid.registry,
            actualSubjectDigest: valid.actual_subject_digest,
            allowedActions: valid.allowed_actions,
            now: valid.now,
            isConsumed: () => false,
          }),
        ).toEqual({ valid: false, error: 'PK_APPROVAL_DECISION_MALFORMED' });
      }
    });

    it('fails closed on missing/invalid subject.digest, actualSubjectDigest, or registry.max_ttl_seconds', () => {
      const valid = loadValidApprovalInput();
      const missingSubjectDigest = structuredClone(valid.request);
      delete (missingSubjectDigest.subject as Record<string, unknown>).digest;
      expect(
        verifyApproval({
          request: missingSubjectDigest,
          decisions: valid.decisions,
          registry: valid.registry,
          actualSubjectDigest: undefined as unknown as string,
          allowedActions: valid.allowed_actions,
          now: valid.now,
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' });

      expect(
        verifyApproval({
          request: valid.request,
          decisions: valid.decisions,
          registry: valid.registry,
          actualSubjectDigest: undefined as unknown as string,
          allowedActions: valid.allowed_actions,
          now: valid.now,
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_SUBJECT_MISMATCH' });

      const badTtlRegistry = structuredClone(valid.registry);
      (badTtlRegistry as unknown as Record<string, unknown>).max_ttl_seconds = undefined;
      expect(
        verifyApproval({
          request: valid.request,
          decisions: valid.decisions,
          registry: badTtlRegistry,
          actualSubjectDigest: valid.actual_subject_digest,
          allowedActions: valid.allowed_actions,
          now: valid.now,
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_TTL_TOO_LONG' });
    });

    it('rejects empty req.id, invalid registry_version, invalid registry.version, and invalid actionPolicies entries (R2-06)', () => {
      const valid = loadValidApprovalInput();

      const emptyIdReq = structuredClone(valid.request);
      emptyIdReq.id = '';
      expect(
        verifyApproval({
          request: emptyIdReq,
          decisions: valid.decisions,
          registry: valid.registry,
          actualSubjectDigest: valid.actual_subject_digest,
          allowedActions: valid.allowed_actions,
          now: valid.now,
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' });

      for (const badVer of [0, -1, 1.5, Number.NaN]) {
        const badReqVer = structuredClone(valid.request);
        (badReqVer.policy as Record<string, unknown>).registry_version = badVer;
        expect(
          verifyApproval({
            request: badReqVer,
            decisions: valid.decisions,
            registry: valid.registry,
            actualSubjectDigest: valid.actual_subject_digest,
            allowedActions: valid.allowed_actions,
            now: valid.now,
            isConsumed: () => false,
          }),
        ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' });

        const badRegVer = structuredClone(valid.registry);
        (badRegVer as unknown as Record<string, unknown>).version = badVer;
        expect(
          verifyApproval({
            request: valid.request,
            decisions: valid.decisions,
            registry: badRegVer,
            actualSubjectDigest: valid.actual_subject_digest,
            allowedActions: valid.allowed_actions,
            now: valid.now,
            isConsumed: () => false,
          }),
        ).toEqual({ valid: false, error: 'PK_APPROVAL_REGISTRY_MALFORMED' });
      }

      for (const badEntry of [
        { min_approvals: Number.NaN, distinct_from_requester: false },
        { min_approvals: 0, distinct_from_requester: true },
        { min_approvals: 1, distinct_from_requester: 'true' as unknown as boolean },
      ]) {
        expect(
          verifyApproval({
            request: valid.request,
            decisions: valid.decisions,
            registry: valid.registry,
            actualSubjectDigest: valid.actual_subject_digest,
            allowedActions: valid.allowed_actions,
            now: valid.now,
            isConsumed: () => false,
            actionPolicies: {
              'passdown.git.push_protected_ref': badEntry,
            },
          }),
        ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' });
      }
    });

    it('rejects PK_APPROVAL_WINDOW_CLOSED, PK_APPROVAL_PROFILE_ALG_MISMATCH, and invalid input.now (R2-08)', () => {
      const valid = loadValidApprovalInput();
      const nowMs = Date.parse(valid.now);

      const closedReq = structuredClone(valid.request);
      closedReq.window = {
        opens_at: new Date(nowMs - 20_000).toISOString(),
        closes_at: new Date(nowMs - 1_000).toISOString(),
      };
      expect(
        verifyApproval({
          request: closedReq,
          decisions: valid.decisions,
          registry: valid.registry,
          actualSubjectDigest: valid.actual_subject_digest,
          allowedActions: valid.allowed_actions,
          now: valid.now,
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_WINDOW_CLOSED' });

      const hwRegistry = structuredClone(valid.registry);
      if (!hwRegistry.approvers[0]) throw new Error('missing approver');
      hwRegistry.approvers[0].profile = 'android-keystore';
      expect(
        verifyApproval({
          request: valid.request,
          decisions: valid.decisions,
          registry: hwRegistry,
          actualSubjectDigest: valid.actual_subject_digest,
          allowedActions: valid.allowed_actions,
          now: valid.now,
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_PROFILE_ALG_MISMATCH' });

      expect(
        verifyApproval({
          request: valid.request,
          decisions: valid.decisions,
          registry: valid.registry,
          actualSubjectDigest: valid.actual_subject_digest,
          allowedActions: valid.allowed_actions,
          now: 'not-a-timestamp',
          isConsumed: () => false,
        }),
      ).toEqual({ valid: false, error: 'PK_APPROVAL_REQUEST_MALFORMED' });
    });
  });
});
