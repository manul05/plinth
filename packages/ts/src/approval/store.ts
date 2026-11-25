import type { RegistryPayload } from './registry.js';
import { type ApprovalResult, verifyApproval } from './verify.js';

export interface ConsumedIdStore {
  has(id: string): Promise<boolean>;
  /** Atomically adds; resolves false if the id was already present. */
  add(id: string): Promise<boolean>;
}

/**
 * Verifies an approval and atomically marks its `consume_id` as used in `store`.
 */
export async function verifyAndConsume(input: {
  request: unknown;
  decisions: readonly unknown[];
  registry: RegistryPayload;
  actualSubjectDigest: string;
  allowedActions: readonly string[];
  now: string;
  store: ConsumedIdStore;
}): Promise<ApprovalResult> {
  const req = input.request;
  const reqId =
    typeof req === 'object' && req !== null && !Array.isArray(req) && typeof (req as { id?: unknown }).id === 'string'
      ? (req as { id: string }).id
      : undefined;
  const seen = reqId !== undefined ? await input.store.has(reqId) : false;

  const r = verifyApproval({
    request: input.request,
    decisions: input.decisions,
    registry: input.registry,
    actualSubjectDigest: input.actualSubjectDigest,
    allowedActions: input.allowedActions,
    now: input.now,
    isConsumed: () => seen,
  });
  if (!r.valid) {
    return r;
  }

  const added = await input.store.add(r.consume_id);
  if (!added) {
    return { valid: false, error: 'PK_APPROVAL_REPLAYED' };
  }
  return r;
}

/**
 * In-memory single-use approval ID store for tests and single-process verifiers.
 */
export class MemoryConsumedIdStore implements ConsumedIdStore {
  private readonly seen = new Set<string>();

  has(id: string): Promise<boolean> {
    return Promise.resolve(this.seen.has(id));
  }

  add(id: string): Promise<boolean> {
    if (this.seen.has(id)) {
      return Promise.resolve(false);
    }
    this.seen.add(id);
    return Promise.resolve(true);
  }
}
