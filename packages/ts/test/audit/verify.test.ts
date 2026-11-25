import { describe, expect, it } from 'vitest';
import { createCheckpoint, type ExportLine, hexDecode, type TrustedKey, verifyChain } from '../../src/index.js';
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
});
