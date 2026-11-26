import { describe, expect, it } from 'vitest';
import { canonicalize, digest, digestBytes, GENESIS_DIGEST, PlinthError } from '../../src/index.js';

function expectPlinthCode(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${code})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(code);
  }
}

describe('jcs', () => {
  it('rejects unsupported types and non-integers', () => {
    expectPlinthCode(() => canonicalize(undefined), 'PK_JCS_UNSUPPORTED_TYPE');
    expectPlinthCode(() => canonicalize(new Date(0)), 'PK_JCS_UNSUPPORTED_TYPE');
    expectPlinthCode(() => canonicalize({ a: undefined }), 'PK_JCS_UNSUPPORTED_TYPE');
    expectPlinthCode(() => canonicalize(1n), 'PK_JCS_UNSUPPORTED_TYPE');
    expectPlinthCode(() => canonicalize(0.5), 'PK_JCS_NON_INTEGER');
    expectPlinthCode(() => canonicalize(Number.NaN), 'PK_JCS_NON_INTEGER');
    expectPlinthCode(() => canonicalize(Number.POSITIVE_INFINITY), 'PK_JCS_NON_INTEGER');
  });

  it('canonicalizes null-prototype object and computes digests', () => {
    expect(canonicalize(Object.create(null))).toBe('{}');
    expect(digest({})).toBe('sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');
    expect(digestBytes(new Uint8Array(0))).toBe(
      'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(GENESIS_DIGEST).toHaveLength(71);
    expect(GENESIS_DIGEST).toBe(`sha256:${'0'.repeat(64)}`);
  });
});
