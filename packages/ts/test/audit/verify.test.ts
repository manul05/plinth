import { describe, expect, it } from 'vitest';
import {
  createCheckpoint,
  digest,
  type ExportLine,
  GENESIS_DIGEST,
  hexDecode,
  type TrustedKey,
  verifyChain,
} from '../../src/index.js';
import { loadKey, loadVectors } from '../vectors.js';

describe('verifyChain robustness', () => {
  it('verifyChain never throws on malformed lines or checkpoints', () => {
    const anchored = loadVectors('k1', 'verifyChain').find((v) => v.id === 'k1-chain-valid-anchored');
    expect(anchored).toBeDefined();
    const lines = anchored?.input.lines as ExportLine[];
    const trustedKeys = anchored?.input.trusted_keys as TrustedKey[];
    const chain = anchored?.input.chain as string;

    for (const badLines of [[null], [1], [{ event: null, hash: 'x' }]] as const) {
      const res = verifyChain({ chain, lines: badLines, checkpoints: [], trustedKeys });
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(typeof res.error).toBe('string');
      }
    }

    const firstLine = lines[0];
    expect(firstLine).toBeDefined();
    if (firstLine === undefined) return;
    const badCheckpointRes = verifyChain({
      chain,
      lines: [firstLine],
      checkpoints: [null],
      trustedKeys,
    });
    expect(badCheckpointRes.valid).toBe(false);
    if (!badCheckpointRes.valid) {
      expect(badCheckpointRes.error).toBe('PK_AUDIT_CHECKPOINT_MALFORMED');
    }
  });

  it('rejects chain mismatch on a signed checkpoint with PK_AUDIT_CHAIN_MISMATCH', () => {
    const anchored = loadVectors('k1', 'verifyChain').find((v) => v.id === 'k1-chain-valid-anchored');
    expect(anchored).toBeDefined();
    const lines = anchored?.input.lines as ExportLine[];
    const trustedKeys = anchored?.input.trusted_keys as TrustedKey[];
    const chain = anchored?.input.chain as string;
    const lastLine = lines[4];
    expect(lastLine).toBeDefined();
    if (lastLine === undefined) return;

    const key = loadKey('keys/ed25519-test-2.json');
    const mismatchedCheckpoint = createCheckpoint(
      { ...lastLine, event: { ...lastLine.event, chain: 'other' } },
      '2026-11-02T10:00:00.000Z',
      hexDecode(key.private_hex),
    );
    const res = verifyChain({
      chain,
      lines,
      checkpoints: [mismatchedCheckpoint],
      trustedKeys,
    });
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toBe('PK_AUDIT_CHAIN_MISMATCH');
    }
  });

  it('rejects non-array checkpoints and trustedKeys without silently dropping them (R2-04)', () => {
    const anchored = loadVectors('k1', 'verifyChain').find((v) => v.id === 'k1-chain-valid-anchored');
    const lines = anchored?.input.lines as ExportLine[];
    const trustedKeys = anchored?.input.trusted_keys as TrustedKey[];
    const chain = anchored?.input.chain as string;
    const firstLine = lines[0];
    if (!firstLine) throw new Error('missing line');

    expect(
      verifyChain({
        chain,
        lines: [firstLine],
        checkpoints: 'not-an-array' as unknown as readonly unknown[],
        trustedKeys,
      }),
    ).toEqual({ valid: false, error: 'PK_AUDIT_CHECKPOINT_MALFORMED', at_seq: -1 });

    expect(
      verifyChain({
        chain,
        lines: [firstLine],
        checkpoints: [],
        trustedKeys: null as unknown as readonly TrustedKey[],
      }),
    ).toEqual({ valid: false, error: 'PK_AUDIT_EVENT_MALFORMED' });
  });

  it('accepts pruned chain when multiple valid checkpoints exist at firstSeq - 1 (R2-04)', () => {
    const key = loadKey('keys/ed25519-test-2.json');
    const trustedKeys: TrustedKey[] = [{ kid: key.kid as TrustedKey['kid'], jwk: key.public_jwk as TrustedKey['jwk'] }];
    const priv = hexDecode(key.private_hex);
    const ev0 = {
      spec: 'pk-audit/1.0' as const,
      chain: 'c',
      seq: 0,
      prev: GENESIS_DIGEST,
      ts: '2026-11-01T00:00:00.000Z',
      actor: { kind: 'human' as const, id: 'a' },
      action: 'test.a',
      data: {},
    };
    const e0: ExportLine = { event: ev0, hash: digest(ev0) };
    const ev1 = {
      spec: 'pk-audit/1.0' as const,
      chain: 'c',
      seq: 1,
      prev: e0.hash,
      ts: '2026-11-01T00:01:00.000Z',
      actor: { kind: 'human' as const, id: 'a' },
      action: 'test.b',
      data: {},
    };
    const e1: ExportLine = { event: ev1, hash: digest(ev1) };
    const cp1a = createCheckpoint(e1, '2026-11-01T00:02:00.000Z', priv);
    const cp1b = createCheckpoint(e1, '2026-11-01T00:03:00.000Z', priv);
    const prunedEvent = {
      spec: 'pk-audit/1.0' as const,
      chain: 'c',
      seq: 2,
      prev: e1.hash,
      ts: '2026-11-01T00:04:00.000Z',
      actor: { kind: 'service' as const, id: 's' },
      action: 'pk.audit.pruned',
      data: { up_to_seq: 1, checkpoint_digest: digest(cp1a.payload) },
    };
    const e2: ExportLine = { event: prunedEvent, hash: digest(prunedEvent) };
    const cp2 = createCheckpoint(e2, '2026-11-01T00:05:00.000Z', priv);

    expect(
      verifyChain({
        chain: 'c',
        lines: [e2],
        checkpoints: [cp1a, cp1b, cp2],
        trustedKeys,
      }),
    ).toEqual({ valid: true, status: 'verified', anchored_seq: 2, last_seq: 2 });
  });
});
