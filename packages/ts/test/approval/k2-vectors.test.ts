import { describe, expect, it } from 'vitest';
import {
  type ApprovalRequest,
  type Digest,
  digest,
  hexDecode,
  jwkFromP256Spki,
  matchingCode,
  PlinthError,
  type RegistryPayload,
  verifyApproval,
  verifyBreakGlass,
  verifyRegistryChain,
} from '../../src/index.js';
import { loadVectors } from '../vectors.js';

function expectPlinthError(fn: () => unknown, expectedCode: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${expectedCode})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(expectedCode);
  }
}

describe('k2 matchingCode', () => {
  for (const vec of loadVectors('k2', 'matchingCode')) {
    it(vec.id, () => {
      const request = vec.input.request as ApprovalRequest;
      expect(digest(request)).toBe(vec.expect.request_digest);
      expect(matchingCode(request)).toBe(vec.expect.matching_code);
    });
  }
});

describe('k2 verifyRegistryChain', () => {
  for (const vec of loadVectors('k2', 'verifyRegistryChain')) {
    it(vec.id, () => {
      const result = verifyRegistryChain({
        envelopes: vec.input.envelopes as readonly unknown[],
        genesisDigest: vec.input.genesis_digest as Digest,
        highestSeenVersion: vec.input.highest_seen_version as number,
      });
      for (const [key, value] of Object.entries(vec.expect)) {
        expect((result as Record<string, unknown>)[key]).toEqual(value);
      }
    });
  }
});

describe('k2 verifyApproval', () => {
  for (const vec of loadVectors('k2', 'verifyApproval')) {
    it(vec.id, () => {
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
      expect(result).toEqual(vec.expect);
    });
  }
});

describe('k2 verifyBreakGlass', () => {
  for (const vec of loadVectors('k2', 'verifyBreakGlass')) {
    it(vec.id, () => {
      const result = verifyBreakGlass({
        code: vec.input.code as string,
        registry: vec.input.registry as RegistryPayload,
        usedDigests: vec.input.used_digests as readonly string[],
      });
      expect(result).toEqual(vec.expect);
    });
  }
});

describe('k2 jwkFromP256Spki', () => {
  for (const vec of loadVectors('k2', 'jwkFromP256Spki')) {
    it(vec.id, () => {
      const spki = hexDecode(vec.input.spki_hex as string);
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => jwkFromP256Spki(spki), vec.expect.error);
      } else {
        expect(jwkFromP256Spki(spki)).toEqual(vec.expect.jwk);
      }
    });
  }
});
