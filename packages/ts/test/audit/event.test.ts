import { describe, expect, it } from 'vitest';
import { appendEvent, digest, type EventDraft, GENESIS_DIGEST, PlinthError } from '../../src/index.js';

const DRAFT: EventDraft = {
  chain: 'passdown:project:0192f5e0-7c1a-7b3e-9a10-3f2c1d4e5a6b',
  ts: '2026-11-02T09:00:00.000Z',
  actor: { kind: 'agent', id: 'claude-code:client:01', display: 'Claude Code' },
  action: 'passdown.handoff.created',
  target: { kind: 'handoff', id: '0192f5e1-0000-7000-8000-000000000001' },
  data: { redactions: 1, body_digest: digest({ b: 1 }) },
};

function expectPlinthError(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${code})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(code);
  }
}

describe('audit event and appendEvent', () => {
  it('starts a chain at seq 0 with GENESIS_DIGEST and expected k1-event-hash', () => {
    const first = appendEvent(null, DRAFT);
    expect(first.event.seq).toBe(0);
    expect(first.event.prev).toBe(GENESIS_DIGEST);
    expect(first.hash).toBe('sha256:08c9735f5e478f6e59fd1fdd09a9b919f121fa8e7396123cdde66704855e5248');

    const second = appendEvent(first, {
      ...DRAFT,
      ts: '2026-11-02T09:01:00.000Z',
      action: 'passdown.handoff.verified',
    });
    expect(second.event.seq).toBe(1);
    expect(second.event.prev).toBe(first.hash);
  });

  it('rejects chain mismatch on subsequent append', () => {
    const first = appendEvent(null, DRAFT);
    expectPlinthError(() => appendEvent(first, { ...DRAFT, chain: 'other' }), 'PK_AUDIT_CHAIN_MISMATCH');
  });

  it('enforces reserved pk.* actions unless allowReserved is true', () => {
    const reservedDraft: EventDraft = { ...DRAFT, action: 'pk.audit.pruned' };
    expectPlinthError(() => appendEvent(null, reservedDraft), 'PK_AUDIT_RESERVED_ACTION');

    const ok = appendEvent(null, reservedDraft, { allowReserved: true });
    expect(ok.event.action).toBe('pk.audit.pruned');
  });

  it('rejects malformed timestamps, actions, and non-integer data', () => {
    expectPlinthError(() => appendEvent(null, { ...DRAFT, ts: '2026-11-02T09:00:00Z' }), 'PK_AUDIT_EVENT_MALFORMED');
    expectPlinthError(() => appendEvent(null, { ...DRAFT, action: 'Passdown.X' }), 'PK_AUDIT_EVENT_MALFORMED');
    expectPlinthError(() => appendEvent(null, { ...DRAFT, data: { x: 1.5 } }), 'PK_JCS_NON_INTEGER');
  });

  it('prevents draft from overriding spec with an arbitrary string (R2-12)', () => {
    const spoofed = { ...DRAFT, spec: 'pk-audit/9.9' } as unknown as EventDraft;
    const first = appendEvent(null, spoofed);
    expect(first.event.spec).toBe('pk-audit/1.0');
  });
});
