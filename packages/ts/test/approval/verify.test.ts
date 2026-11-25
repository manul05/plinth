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
  });
});
