import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryConsumedIdStore, type RegistryPayload, verifyAndConsume } from '../../src/index.js';
import { VECTORS_DIR } from '../vectors.js';

function loadValidApprovalVector(): {
  request: { id: string } & Record<string, unknown>;
  decisions: unknown[];
  registry: RegistryPayload;
  actual_subject_digest: string;
  allowed_actions: string[];
  now: string;
} {
  const raw = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2', 'k2-approval-valid-webauthn.json'), 'utf8')) as {
    input: {
      request: { id: string } & Record<string, unknown>;
      decisions: unknown[];
      registry: RegistryPayload;
      actual_subject_digest: string;
      allowed_actions: string[];
      now: string;
    };
  };
  return raw.input;
}

describe('verifyAndConsume and MemoryConsumedIdStore', () => {
  it('accepts the first valid approval and rejects a replay with PK_APPROVAL_REPLAYED', async () => {
    const v = loadValidApprovalVector();
    const store = new MemoryConsumedIdStore();

    const first = await verifyAndConsume({
      request: v.request,
      decisions: v.decisions,
      registry: v.registry,
      actualSubjectDigest: v.actual_subject_digest,
      allowedActions: v.allowed_actions,
      now: v.now,
      store,
    });
    expect(first.valid).toBe(true);
    expect(await store.has(v.request.id)).toBe(true);

    const second = await verifyAndConsume({
      request: v.request,
      decisions: v.decisions,
      registry: v.registry,
      actualSubjectDigest: v.actual_subject_digest,
      allowedActions: v.allowed_actions,
      now: v.now,
      store,
    });
    expect(second).toEqual({ valid: false, error: 'PK_APPROVAL_REPLAYED' });
  });

  it('concurrent verifyAndConsume admits exactly one', async () => {
    const v = loadValidApprovalVector();
    const store = new MemoryConsumedIdStore();

    const [a, b] = await Promise.all([
      verifyAndConsume({
        request: v.request,
        decisions: v.decisions,
        registry: v.registry,
        actualSubjectDigest: v.actual_subject_digest,
        allowedActions: v.allowed_actions,
        now: v.now,
        store,
      }),
      verifyAndConsume({
        request: v.request,
        decisions: v.decisions,
        registry: v.registry,
        actualSubjectDigest: v.actual_subject_digest,
        allowedActions: v.allowed_actions,
        now: v.now,
        store,
      }),
    ]);

    const results = [a, b];
    expect(results.filter((r) => r.valid)).toHaveLength(1);
    expect(results.filter((r) => !r.valid)).toEqual([{ valid: false, error: 'PK_APPROVAL_REPLAYED' }]);
  });

  it('does not consume the id when verification fails', async () => {
    const v = loadValidApprovalVector();
    const store = new MemoryConsumedIdStore();

    const res = await verifyAndConsume({
      request: v.request,
      decisions: v.decisions,
      registry: v.registry,
      actualSubjectDigest: `sha256:${'f'.repeat(64)}`,
      allowedActions: v.allowed_actions,
      now: v.now,
      store,
    });

    expect(res).toEqual({ valid: false, error: 'PK_APPROVAL_SUBJECT_MISMATCH' });
    expect(await store.has(v.request.id)).toBe(false);
  });
});
