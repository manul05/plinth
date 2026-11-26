import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  type ApprovalResult,
  activeRules,
  appendEvent,
  canonicalize,
  createCheckpoint,
  type Digest,
  digest,
  type ExportLine,
  hexDecode,
  type JsonObject,
  type LoadedPack,
  loadPack,
  type PublicJwk,
  type RegistryPayload,
  scan,
  type TrustedKey,
  type TypePolicy,
  verifyApproval,
  verifyChain,
  verifyEnvelope,
} from '../../src/index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../../src/packs/index.js';
import { loadKey, VECTORS_DIR } from '../vectors.js';

function readVector(relPath: string): { input: Record<string, unknown> } {
  return JSON.parse(readFileSync(join(VECTORS_DIR, relPath), 'utf8')) as { input: Record<string, unknown> };
}

function measureMedian(runs: number, fn: () => void): number {
  fn();
  const times: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)] ?? 0;
}

describe('performance and ReDoS budgets', () => {
  let obj10kb: JsonObject;
  let allPacks: LoadedPack[];
  let scan100kbText: string;

  beforeAll(() => {
    const built: Record<string, string> = {};
    for (let i = 0; i < 200; i += 1) {
      built[`k${String(i).padStart(3, '0')}`] = 'v'.repeat(40);
    }
    obj10kb = built;
    allPacks = (Object.keys(BUILTIN_PACKS).sort() as BuiltinPackId[]).map((id) => loadPack(BUILTIN_PACKS[id]));
    const mixedVec = readVector('k5/k5-redact-mixed.json');
    const unit = (mixedVec.input.text_parts as string[]).join('');
    scan100kbText = unit.repeat(Math.ceil(100_000 / unit.length));
  });

  it('canonicalize + digest of 10 KB object <= 5 ms (median of 50)', () => {
    const median = measureMedian(50, () => {
      const c = canonicalize(obj10kb);
      const d = digest(obj10kb);
      expect(c.length).toBeGreaterThan(9_000);
      expect(d.startsWith('sha256:')).toBe(true);
    });
    console.log(`[perf] canonicalize+digest 10KB median: ${median.toFixed(3)} ms (budget <= 5 ms)`);
    expect(median).toBeLessThanOrEqual(5);
  });

  it('verifyEnvelope of k0-env-valid-ed25519 <= 25 ms (median of 50)', () => {
    const vec = readVector('k0/k0-env-valid-ed25519.json');
    const trustedKeys = vec.input.trusted_keys as readonly TrustedKey[];
    const policy = vec.input.policy as TypePolicy;
    const median = measureMedian(50, () => {
      const res = verifyEnvelope(vec.input.envelope, { trustedKeys, policy });
      expect(res.valid).toBe(true);
    });
    console.log(`[perf] verifyEnvelope Ed25519 median: ${median.toFixed(3)} ms (budget <= 25 ms)`);
    expect(median).toBeLessThanOrEqual(25);
  });

  it('verifyApproval of k2-approval-valid-webauthn <= 50 ms (median of 50)', () => {
    const vec = readVector('k2/k2-approval-valid-webauthn.json');
    const consumedIds = vec.input.consumed_ids as readonly string[];
    const median = measureMedian(50, () => {
      const res: ApprovalResult = verifyApproval({
        request: vec.input.request,
        decisions: vec.input.decisions as readonly unknown[],
        registry: vec.input.registry as RegistryPayload,
        actualSubjectDigest: vec.input.actual_subject_digest as string,
        allowedActions: vec.input.allowed_actions as readonly string[],
        now: vec.input.now as string,
        isConsumed: (id) => consumedIds.includes(id),
      });
      expect(res.valid).toBe(true);
    });
    console.log(`[perf] verifyApproval WebAuthn median: ${median.toFixed(3)} ms (budget <= 50 ms)`);
    expect(median).toBeLessThanOrEqual(50);
  });

  it('verifyChain of 10,000 events + 1 checkpoint <= 3,000 ms', () => {
    const key = loadKey('keys/ed25519-test-1.json');
    const secret = hexDecode(key.private_hex);
    const trustedKeys: TrustedKey[] = [{ kid: key.kid as Digest, jwk: key.public_jwk as unknown as PublicJwk }];
    const chain = 'perf:chain:0192f5e0-7c1a-7b3e-9a10-3f2c1d4e5a6b';
    const lines: ExportLine[] = [];
    let prev: ExportLine | null = null;
    for (let i = 0; i < 10_000; i += 1) {
      prev = appendEvent(prev, {
        chain,
        ts: '2026-11-25T10:00:00.000Z',
        actor: { kind: 'service', id: 'perf-bench' },
        action: 'perf.event.recorded',
        data: { n: i },
      });
      lines.push(prev);
    }
    if (prev === null) {
      throw new Error('empty chain');
    }
    const checkpoint = createCheckpoint(prev, '2026-11-25T10:01:00.000Z', secret);

    const start = performance.now();
    const res = verifyChain({ chain, lines, checkpoints: [checkpoint], trustedKeys });
    const elapsed = performance.now() - start;

    expect(res).toEqual({ valid: true, status: 'verified', anchored_seq: 9_999, last_seq: 9_999 });
    console.log(`[perf] verifyChain 10,000 events: ${elapsed.toFixed(2)} ms (budget <= 3000 ms)`);
    expect(elapsed).toBeLessThanOrEqual(3_000);
  });

  it('scan of 100 KB text with all 4 packs <= 200 ms (median of 50)', () => {
    const median = measureMedian(50, () => {
      const findings = scan(scan100kbText, allPacks, { date: '2026-11-25' });
      expect(findings.length).toBeGreaterThan(0);
    });
    console.log(
      `[perf] scan ${scan100kbText.length} chars (4 packs) median: ${median.toFixed(3)} ms (budget <= 200 ms)`,
    );
    expect(median).toBeLessThanOrEqual(200);
  });

  it('no rule exceeds 100 ms on adversarial input', () => {
    const adversarial = ['a'.repeat(50_000), '0'.repeat(50_000), '-----BEGIN '.repeat(4_545)];
    let maxElapsed = 0;
    let maxRule = '';
    let checkedRules = 0;

    for (const pack of allPacks) {
      for (const rule of activeRules(pack, '2026-11-25')) {
        checkedRules += 1;
        const singlePack: LoadedPack = { manifest: pack.manifest, rules: [rule] };
        for (const text of adversarial) {
          const start = performance.now();
          scan(text, [singlePack], { date: '2026-11-25' });
          const elapsed = performance.now() - start;
          if (elapsed > maxElapsed) {
            maxElapsed = elapsed;
            maxRule = rule.id;
          }
          expect(elapsed, `${rule.id} took ${elapsed.toFixed(2)} ms`).toBeLessThanOrEqual(100);
        }
      }
    }
    console.log(
      `[perf] ReDoS adversarial check (${checkedRules} active rules x 3 inputs): max ${maxElapsed.toFixed(3)} ms (${maxRule}, budget <= 100 ms)`,
    );
  });
});
