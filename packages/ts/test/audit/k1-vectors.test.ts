import { describe, expect, it } from 'vitest';
import {
  type AuditEvent,
  canonicalize,
  eventHash,
  GENESIS_DIGEST,
  type TrustedKey,
  verifyChain,
} from '../../src/index.js';
import { loadVectors } from '../vectors.js';

describe('k1 eventHash', () => {
  for (const vec of loadVectors('k1', 'eventHash')) {
    it(vec.id, () => {
      const event = vec.input.event as AuditEvent;
      expect(eventHash(event)).toBe(vec.expect.hash);
      expect(canonicalize(event)).toBe(vec.expect.canonical);
    });
  }
});

describe('k1 genesisPrev', () => {
  for (const vec of loadVectors('k1', 'genesisPrev')) {
    it(vec.id, () => {
      expect(GENESIS_DIGEST).toBe(vec.expect.prev);
    });
  }
});

describe('k1 verifyChain', () => {
  const vectors = loadVectors('k1').filter((vec) => vec.op === 'verifyChain');
  for (const vec of vectors) {
    it(vec.id, () => {
      const result = verifyChain({
        chain: vec.input.chain as string,
        lines: vec.input.lines as readonly unknown[],
        checkpoints: vec.input.checkpoints as readonly unknown[],
        trustedKeys: vec.input.trusted_keys as readonly TrustedKey[],
      });
      expect(result).toEqual(vec.expect);
    });
  }
});
