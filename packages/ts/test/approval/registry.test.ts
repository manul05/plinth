import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type Digest, type RegistryPayload, trustedKeysFromRegistry, verifyRegistryChain } from '../../src/index.js';
import { loadVectors, VECTORS_DIR } from '../vectors.js';

function loadRegistryGenesis(): {
  envelopes: Array<{ spec: string; type: string; payload: RegistryPayload; signatures: unknown[] }>;
  genesis_digest: Digest;
  highest_seen_version: number;
} {
  const raw = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2', 'k2-registry-genesis-valid.json'), 'utf8')) as {
    input: {
      envelopes: Array<{ spec: string; type: string; payload: RegistryPayload; signatures: unknown[] }>;
      genesis_digest: Digest;
      highest_seen_version: number;
    };
  };
  return raw.input;
}

describe('registry helpers and chain verification', () => {
  it('passes all 6 verifyRegistryChain golden vectors', () => {
    const vectors = loadVectors('k2', 'verifyRegistryChain');
    expect(vectors).toHaveLength(6);
    for (const vec of vectors) {
      const result = verifyRegistryChain({
        envelopes: vec.input.envelopes as readonly unknown[],
        genesisDigest: vec.input.genesis_digest as Digest,
        highestSeenVersion: vec.input.highest_seen_version as number,
      });
      for (const [key, value] of Object.entries(vec.expect)) {
        expect((result as Record<string, unknown>)[key], vec.id).toEqual(value);
      }
    }
  });

  it('maps approvers in trustedKeysFromRegistry with optional webauthn config', () => {
    const genesis = loadRegistryGenesis();
    const reg = genesis.envelopes[0]?.payload as RegistryPayload;
    const keys = trustedKeysFromRegistry(reg);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toEqual({
      kid: reg.approvers[0]?.kid,
      jwk: reg.approvers[0]?.jwk,
      webauthn: {
        rp_id: 'approvals.example',
        origins: ['https://approvals.example'],
      },
    });
    expect(keys[1]).toEqual({
      kid: reg.approvers[1]?.kid,
      jwk: reg.approvers[1]?.jwk,
    });
    expect('webauthn' in (keys[1] ?? {})).toBe(false);
  });

  describe('verifyRegistryChain never throws', () => {
    it('returns PK_APPROVAL_REGISTRY_MALFORMED with at_version -1 for [null] and []', () => {
      const genesisDigest = `sha256:${'0'.repeat(64)}` as Digest;
      expect(verifyRegistryChain({ envelopes: [null], genesisDigest, highestSeenVersion: 1 })).toEqual({
        valid: false,
        error: 'PK_APPROVAL_REGISTRY_MALFORMED',
        at_version: -1,
      });
      expect(verifyRegistryChain({ envelopes: [], genesisDigest, highestSeenVersion: 1 })).toEqual({
        valid: false,
        error: 'PK_APPROVAL_REGISTRY_MALFORMED',
        at_version: -1,
      });
    });

    it('returns PK_KEY_KID_MISMATCH when an approver kid is altered', () => {
      const genesis = structuredClone(loadRegistryGenesis());
      const env = genesis.envelopes[0];
      if (!env?.payload.approvers[0]) throw new Error('missing genesis approver');
      env.payload.approvers[0].kid = `sha256:${'0'.repeat(64)}` as Digest;
      expect(
        verifyRegistryChain({
          envelopes: [env],
          genesisDigest: genesis.genesis_digest,
          highestSeenVersion: 1,
        }),
      ).toEqual({
        valid: false,
        error: 'PK_KEY_KID_MISMATCH',
        at_version: 1,
      });
    });
  });
});
