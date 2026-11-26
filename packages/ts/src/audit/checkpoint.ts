import { createEnvelope, type Digest, digest, type Envelope, signEd25519, type TypePolicy } from '../core/index.js';
import type { AuditEvent, EventDraft, ExportLine } from './event.js';

export interface CheckpointPayload {
  spec: 'pk-audit/1.0';
  chain: string;
  seq: number;
  head: Digest;
  ts: string;
  count: number;
}

export const CHECKPOINT_POLICY: TypePolicy = {
  'pk.audit.checkpoint': { algs: ['Ed25519', 'ES256'], min_signatures: 1 },
} as const;

/**
 * Creates a signed `pk.audit.checkpoint` envelope anchoring the chain at the given export line.
 */
export function createCheckpoint(line: ExportLine, ts: string, secretKey: Uint8Array): Envelope<CheckpointPayload> {
  const payload: CheckpointPayload = {
    spec: 'pk-audit/1.0',
    chain: line.event.chain,
    seq: line.event.seq,
    head: line.hash,
    ts,
    count: line.event.seq + 1,
  };
  return createEnvelope('pk.audit.checkpoint', payload, [
    signEd25519('pk.audit.checkpoint', payload, secretKey, 'service'),
  ]);
}

/**
 * Builds an audit event draft recording that events up to `checkpoint.payload.seq` were pruned.
 */
export function prunedEventDraft(input: {
  chain: string;
  ts: string;
  actor: AuditEvent['actor'];
  checkpoint: Envelope<CheckpointPayload>;
}): EventDraft {
  return {
    chain: input.chain,
    ts: input.ts,
    actor: input.actor,
    action: 'pk.audit.pruned',
    data: {
      up_to_seq: input.checkpoint.payload.seq,
      checkpoint_digest: digest(input.checkpoint.payload),
    },
  };
}
