import { describe, expect, it } from 'vitest';
import { breakGlassDigest, newBreakGlassCode, type RegistryPayload, verifyBreakGlass } from '../../src/index.js';
import { loadVectors } from '../vectors.js';

describe('break-glass recovery codes', () => {
  it('passes all 4 verifyBreakGlass golden vectors', () => {
    const vectors = loadVectors('k2', 'verifyBreakGlass');
    expect(vectors).toHaveLength(4);
    for (const vec of vectors) {
      const result = verifyBreakGlass({
        code: vec.input.code as string,
        registry: vec.input.registry as RegistryPayload,
        usedDigests: vec.input.used_digests as readonly string[],
      });
      expect(result, vec.id).toEqual(vec.expect);
    }
  });

  it('generates distinct 20-char base32 codes in XXXXX-XXXXX-XXXXX-XXXXX format', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const code = newBreakGlassCode();
      expect(code).toMatch(/^[A-Z2-7]{5}(-[A-Z2-7]{5}){3}$/);
      seen.add(code);
    }
    expect(seen.size).toBe(100);
  });

  it('computes breakGlassDigest matching the specification vector', () => {
    expect(breakGlassDigest('abcde-fghij-klmno-pqrs2')).toBe(
      'sha256:444361933609d23e64cb267c3a740a4e908cbfe7e17ff6af23ec9c38999e698e',
    );
    expect(breakGlassDigest('ABCDE FGHIJ KLMNO PQRS2')).toBe(
      'sha256:444361933609d23e64cb267c3a740a4e908cbfe7e17ff6af23ec9c38999e698e',
    );
  });
});
