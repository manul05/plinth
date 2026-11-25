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
  it('passes all 31 verifyApproval golden vectors', () => {
    const vectors = loadVectors('k2', 'verifyApproval');
    expect(vectors).toHaveLength(31);
    for (const vec of vectors) {
      const consumedIds = vec.input.consumed_ids as readonly string[];
      const result = verifyApproval({
        request: vec.input.request,
        decisions: vec.input.decisions as readonly unknown[],
        registry: vec.input.registry as RegistryPayload,
        actualSubjectDigest: vec.input.actual_subject_digest as string,
        allowedActions: vec.input.allowed_actions as readonly string[],
        now: vec.input.now as string,
        isConsumed: (id) => consumedIds.includes(id),
      });
      expect(result, vec.id).toEqual(vec.expect);
    }
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
  });
});
