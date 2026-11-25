import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { p256 } from '@noble/curves/nist.js';
import { describe, expect, it } from 'vitest';
import {
  b64urlEncode,
  createEnvelope,
  type Digest,
  digest,
  hexDecode,
  type RegistryPayload,
  signingInput,
  trustedKeysFromRegistry,
  verifyRegistryChain,
} from '../../src/index.js';
import { loadKey, loadVectors, VECTORS_DIR } from '../vectors.js';

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
  it('passes all 8 verifyRegistryChain golden vectors', () => {
    const vectors = loadVectors('k2', 'verifyRegistryChain');
    expect(vectors).toHaveLength(8);
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

  it('requires distinct approver IDs (not merely distinct kids) for update_threshold', () => {
    const validVec = JSON.parse(
      readFileSync(join(VECTORS_DIR, 'k2', 'k2-registry-update-threshold-valid.json'), 'utf8'),
    ) as {
      input: {
        envelopes: Array<{ spec: string; type: string; payload: RegistryPayload; signatures: unknown[] }>;
        genesis_digest: Digest;
        highest_seen_version: number;
      };
    };
    const key1 = loadKey('keys/p256-test-1.json');
    const key2 = loadKey('keys/p256-test-2.json');
    const v1Payload = structuredClone(validVec.input.envelopes[0]?.payload as RegistryPayload);
    if (!v1Payload.approvers[1]) throw new Error('missing second approver');
    v1Payload.approvers[1].id = 'owner'; // Both keys belong to 'owner'
    const v2Payload = structuredClone(validVec.input.envelopes[1]?.payload as RegistryPayload);

    const signEs = (p: RegistryPayload, k: typeof key1) => ({
      alg: 'ES256' as const,
      kid: k.kid as Digest,
      role: 'approver',
      sig: b64urlEncode(
        p256.sign(signingInput('pk.approval.registry', p), hexDecode(k.private_hex), { prehash: true }),
      ),
    });

    const v1Env = createEnvelope('pk.approval.registry', v1Payload, [signEs(v1Payload, key1)]);
    const v2Env = createEnvelope('pk.approval.registry', v2Payload, [signEs(v2Payload, key1), signEs(v2Payload, key2)]);

    expect(
      verifyRegistryChain({
        envelopes: [v1Env, v2Env],
        genesisDigest: digest(v1Payload),
        highestSeenVersion: 1,
      }),
    ).toEqual({
      valid: false,
      error: 'PK_APPROVAL_REGISTRY_UNAUTHORISED',
      at_version: 2,
    });
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

    it('rejects registries missing required schema fields or out-of-range max_ttl_seconds', () => {
      const genesis = structuredClone(loadRegistryGenesis());
      const env = genesis.envelopes[0];
      if (!env) throw new Error('missing genesis');
      (env.payload as unknown as Record<string, unknown>).max_ttl_seconds = 59;
      expect(
        verifyRegistryChain({
          envelopes: [env],
          genesisDigest: genesis.genesis_digest,
          highestSeenVersion: 1,
        }),
      ).toEqual({
        valid: false,
        error: 'PK_APPROVAL_REGISTRY_MALFORMED',
        at_version: 1,
      });

      const envNoBreakGlass = structuredClone(loadRegistryGenesis()).envelopes[0];
      if (!envNoBreakGlass) throw new Error('missing genesis');
      delete (envNoBreakGlass.payload as unknown as Record<string, unknown>).break_glass;
      expect(
        verifyRegistryChain({
          envelopes: [envNoBreakGlass],
          genesisDigest: genesis.genesis_digest,
          highestSeenVersion: 1,
        }),
      ).toEqual({
        valid: false,
        error: 'PK_APPROVAL_REGISTRY_MALFORMED',
        at_version: 1,
      });
    });
  });
});
