import { describe, expect, it } from 'vitest';
import {
  type AuditEvent,
  type CheckpointPayload,
  createCheckpoint,
  type Envelope,
  type ExportLine,
  hexDecode,
  prunedEventDraft,
} from '../../src/index.js';
import { loadKey, loadVectors } from '../vectors.js';

describe('audit checkpoint and prune marker', () => {
  it('createCheckpoint matches the signed checkpoint in k1-chain-valid-anchored', () => {
    const vec = loadVectors('k1', 'verifyChain').find((v) => v.id === 'k1-chain-valid-anchored');
    expect(vec).toBeDefined();
    const lines = vec?.input.lines as ExportLine[];
    const checkpoints = vec?.input.checkpoints as Envelope<CheckpointPayload>[];
    const lineSeq4 = lines[4];
    expect(lineSeq4).toBeDefined();
    if (lineSeq4 === undefined) return;

    const key = loadKey('keys/ed25519-test-2.json');
    const created = createCheckpoint(lineSeq4, '2026-11-02T10:00:00.000Z', hexDecode(key.private_hex));
    expect(created).toEqual(checkpoints[0]);
  });

  it('prunedEventDraft builds pk.audit.pruned matching k1-chain-pruned-valid', () => {
    const vec = loadVectors('k1', 'verifyChain').find((v) => v.id === 'k1-chain-pruned-valid');
    expect(vec).toBeDefined();
    const lines = vec?.input.lines as ExportLine[];
    const checkpoints = vec?.input.checkpoints as Envelope<CheckpointPayload>[];
    const prunedLine = lines.find((l) => l.event.action === 'pk.audit.pruned');
    const checkpointSeq2 = checkpoints.find((c) => c.payload.seq === 2);
    expect(prunedLine).toBeDefined();
    expect(checkpointSeq2).toBeDefined();
    if (prunedLine === undefined || checkpointSeq2 === undefined) return;

    const draft = prunedEventDraft({
      chain: vec?.input.chain as string,
      ts: prunedLine.event.ts,
      actor: prunedLine.event.actor as AuditEvent['actor'],
      checkpoint: checkpointSeq2,
    });
    expect(draft.action).toBe('pk.audit.pruned');
    expect(draft.data).toEqual(prunedLine.event.data);
  });
});
