import type { RegistryPayload } from './registry.js';
import type { ApprovalResult } from './verify.js';

export interface ConsumedIdStore {
  has(id: string): Promise<boolean>;
  /** Atomically adds; resolves false if the id was already present. */
  add(id: string): Promise<boolean>;
}

export function verifyAndConsume(_input: {
  request: unknown;
  decisions: readonly unknown[];
  registry: RegistryPayload;
  actualSubjectDigest: string;
  allowedActions: readonly string[];
  now: string;
  store: ConsumedIdStore;
}): Promise<ApprovalResult> {
  throw new Error('not implemented');
}

export class MemoryConsumedIdStore implements ConsumedIdStore {
  has(_id: string): Promise<boolean> {
    throw new Error('not implemented');
  }

  add(_id: string): Promise<boolean> {
    throw new Error('not implemented');
  }
}
