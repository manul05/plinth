import type { Digest, Envelope, TypePolicy } from '../core/index.js';
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

export function createCheckpoint(_line: ExportLine, _ts: string, _secretKey: Uint8Array): Envelope<CheckpointPayload> {
  throw new Error('not implemented');
}

export function prunedEventDraft(_input: {
  chain: string;
  ts: string;
  actor: AuditEvent['actor'];
  checkpoint: Envelope<CheckpointPayload>;
}): EventDraft {
  throw new Error('not implemented');
}
