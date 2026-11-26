import { describe, expect, it } from 'vitest';
import { loadKey, loadVectors } from './vectors.js';

describe('vectors helper', () => {
  it('vector counts', () => {
    expect(loadVectors('k0')).toHaveLength(56);
    expect(loadVectors('k1')).toHaveLength(21);
    expect(loadVectors('k2')).toHaveLength(51);
    expect(loadVectors('k4')).toHaveLength(35);
    expect(loadVectors('k5')).toHaveLength(20);
  });

  it('ops filter', () => {
    expect(loadVectors('k0', 'verifyEnvelope')).toHaveLength(19);
    expect(loadVectors('k2', 'verifyApproval')).toHaveLength(33);
  });

  it('loadKey', () => {
    expect(loadKey('keys/ed25519-test-1.json').kid).toBe(
      'sha256:90facafea9b1556698540f70c0117a22ea37bd5cf3ed3c47093c1707282b4b89',
    );
  });
});
