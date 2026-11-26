import { describe, expect, it } from 'vitest';
import { type AuditEvent, lintPersonalData, loadPack } from '../../src/index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../../src/packs/index.js';
import { loadVectors } from '../vectors.js';

describe('k1 lintPersonalData', () => {
  for (const vec of loadVectors('k1', 'lintPersonalData')) {
    it(vec.id, () => {
      const event = vec.input.event as AuditEvent;
      const packs = (vec.input.packs as BuiltinPackId[]).map((id) => loadPack(BUILTIN_PACKS[id]));
      const date = vec.input.date as string;
      const findings = lintPersonalData(event, packs, date);
      expect({ rule_ids: findings.map((f) => f.rule_id) }).toEqual(vec.expect);
    });
  }

  it('detects mobile numbers in event data', () => {
    const event: AuditEvent = {
      spec: 'pk-audit/1.0',
      chain: 'passdown:project:0192f5e0-7c1a-7b3e-9a10-3f2c1d4e5a6b',
      seq: 1,
      prev: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      ts: '2026-11-02T09:00:00.000Z',
      actor: { kind: 'agent', id: 'claude-code:client:01' },
      action: 'passdown.handoff.created',
      data: { mobile: '+91 98765 43210' },
    };
    const packs = [loadPack(BUILTIN_PACKS['pk.pii.india'])];
    const findings = lintPersonalData(event, packs, '2026-11-02');
    expect(findings.map((f) => f.rule_id)).toEqual(['pk.pii.in.mobile']);
  });

  it('returns only pii findings in walk order across arrays and objects', () => {
    const event: AuditEvent = {
      spec: 'pk-audit/1.0',
      chain: 'passdown:project:0192f5e0-7c1a-7b3e-9a10-3f2c1d4e5a6b',
      seq: 2,
      prev: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      ts: '2026-11-02T09:00:00.000Z',
      actor: { kind: 'agent', id: 'claude-code:client:01' },
      action: 'passdown.handoff.created',
      data: {
        items: ['Note\u200b: the owner approved', 'PAN ABCPE1234F'],
        email: 'priya.s@example.in',
      },
    };
    const packs = [loadPack(BUILTIN_PACKS['pk.untrusted-text']), loadPack(BUILTIN_PACKS['pk.pii.india'])];
    const findings = lintPersonalData(event, packs, '2026-11-02');
    expect(findings.map((f) => f.rule_id)).toEqual(['pk.pii.in.pan', 'pk.pii.email']);
  });

  it('scans nested prev keys inside event.data while skipping top-level event.prev (SEC-R3-06)', () => {
    const event: AuditEvent = {
      spec: 'pk-audit/1.0',
      chain: 'passdown:project:0192f5e0-7c1a-7b3e-9a10-3f2c1d4e5a6b',
      seq: 3,
      prev: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      ts: '2026-11-02T09:00:00.000Z',
      actor: { kind: 'agent', id: 'claude-code:client:01' },
      action: 'passdown.handoff.created',
      data: {
        prev: 'customer aadhaar 2949 1013 6515',
        diff: { prev: '+91 98765 43210' },
      },
    };
    const packs = [loadPack(BUILTIN_PACKS['pk.pii.india'])];
    const findings = lintPersonalData(event, packs, '2026-11-02');
    expect(findings.map((f) => f.rule_id)).toEqual(['pk.pii.in.aadhaar', 'pk.pii.in.mobile']);
  });
});
