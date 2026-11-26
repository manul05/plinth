import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type ActionPolicy,
  type ApprovalRequest,
  MemoryConsumedIdStore,
  type RegistryPayload,
  verifyAndConsume,
} from 'plinth-kit/approval';
import {
  type AuditEvent,
  appendEvent,
  createCheckpoint,
  type EventDraft,
  type ExportLine,
  parseExport,
  prunedEventDraft,
  serializeExport,
  verifyChain,
} from 'plinth-kit/audit';
import {
  createEnvelope,
  type Digest,
  hexDecode,
  type JsonObject,
  type PublicJwk,
  signEd25519,
  type TrustedKey,
  type TypePolicy,
  verifyEnvelope,
} from 'plinth-kit/core';
import { redact } from 'plinth-kit/detect';
import { BUILTIN_PACKS, type BuiltinPackId } from 'plinth-kit/packs';
import { loadPack } from 'plinth-kit/rulepack';
import { describe, expect, it } from 'vitest';
import { loadKey, VECTORS_DIR } from '../vectors.js';

describe('library E2E scenarios through public subpaths', () => {
  it('E2E-1: sign, verify, and detect payload tampering', () => {
    const key = loadKey('keys/ed25519-test-1.json');
    const trustedKeys: TrustedKey[] = [{ kid: key.kid as Digest, jwk: key.public_jwk as unknown as PublicJwk }];
    const policy: TypePolicy = {
      'pk.example.handoff': { algs: ['Ed25519'], min_signatures: 1 },
    };
    const payload = { note: 'handoff ready', count: 1 };
    const sig = signEd25519('pk.example.handoff', payload, hexDecode(key.private_hex), 'producer');
    const envelope = createEnvelope('pk.example.handoff', payload, [sig]);

    const ok = verifyEnvelope(envelope, { trustedKeys, policy });
    expect(ok).toEqual({
      valid: true,
      signers: [{ kid: key.kid, alg: 'Ed25519', role: 'producer' }],
    });

    const tampered = structuredClone(envelope);
    tampered.payload.note = 'tampered';
    expect(verifyEnvelope(tampered, { trustedKeys, policy })).toEqual({
      valid: false,
      error: 'PK_SIG_INVALID',
    });
  });

  it('E2E-2: passkey approval verifyAndConsume rejects replay', async () => {
    const vec = JSON.parse(readFileSync(join(VECTORS_DIR, 'k2', 'k2-approval-valid-webauthn.json'), 'utf8')) as {
      input: {
        request: ApprovalRequest;
        decisions: unknown[];
        registry: RegistryPayload;
        actual_subject_digest: string;
        allowed_actions: string[];
        now: string;
        action_policies?: Readonly<Record<string, ActionPolicy>>;
        requester_human_id?: string;
      };
      expect: Record<string, unknown>;
    };
    const store = new MemoryConsumedIdStore();
    const first = await verifyAndConsume({
      request: vec.input.request,
      decisions: vec.input.decisions,
      registry: vec.input.registry,
      actualSubjectDigest: vec.input.actual_subject_digest,
      allowedActions: vec.input.allowed_actions,
      now: vec.input.now,
      store,
      ...(vec.input.action_policies !== undefined ? { actionPolicies: vec.input.action_policies } : {}),
      ...(vec.input.requester_human_id !== undefined ? { requesterHumanId: vec.input.requester_human_id } : {}),
    });
    expect(first).toEqual(vec.expect);

    const replay = await verifyAndConsume({
      request: vec.input.request,
      decisions: vec.input.decisions,
      registry: vec.input.registry,
      actualSubjectDigest: vec.input.actual_subject_digest,
      allowedActions: vec.input.allowed_actions,
      now: vec.input.now,
      store,
      ...(vec.input.action_policies !== undefined ? { actionPolicies: vec.input.action_policies } : {}),
      ...(vec.input.requester_human_id !== undefined ? { requesterHumanId: vec.input.requester_human_id } : {}),
    });
    expect(replay).toEqual({ valid: false, error: 'PK_APPROVAL_REPLAYED' });
  });

  it('E2E-3: audit append, checkpoint, export round-trip, and verifyChain', () => {
    const vec = JSON.parse(readFileSync(join(VECTORS_DIR, 'k1', 'k1-chain-valid-anchored.json'), 'utf8')) as {
      input: {
        chain: string;
        lines: ExportLine[];
        checkpoints: unknown[];
        trusted_keys: TrustedKey[];
      };
      expect: Record<string, unknown>;
    };
    const key = loadKey('keys/ed25519-test-2.json');

    const produced: ExportLine[] = [];
    let prev: ExportLine | null = null;
    for (const { event } of vec.input.lines) {
      const draft: EventDraft = {
        chain: event.chain,
        ts: event.ts,
        actor: event.actor,
        action: event.action,
        ...(event.target !== undefined ? { target: event.target } : {}),
        ...(event.data !== undefined ? { data: event.data as JsonObject } : {}),
        ...(event.reason !== undefined ? { reason: event.reason } : {}),
        ...(event.refs !== undefined ? { refs: event.refs } : {}),
      };
      prev = appendEvent(prev, draft);
      produced.push(prev);
    }
    expect(produced).toEqual(vec.input.lines);

    const lastLine = produced.at(-1);
    if (lastLine === undefined) {
      throw new Error('missing last line');
    }
    const checkpoint = createCheckpoint(lastLine, '2026-11-02T10:00:00.000Z', hexDecode(key.private_hex));
    expect(checkpoint).toEqual(vec.input.checkpoints[0]);

    const jsonl = serializeExport(produced);
    const parsed: ExportLine[] = parseExport(jsonl);
    expect(parsed).toEqual(produced);

    const verified = verifyChain({
      chain: vec.input.chain,
      lines: parsed,
      checkpoints: [checkpoint],
      trustedKeys: vec.input.trusted_keys,
    });
    expect(verified).toEqual(vec.expect);
    const firstEvent: AuditEvent | undefined = parsed[0]?.event;
    expect(firstEvent?.seq).toBe(0);

    const pruneDraft = prunedEventDraft({
      chain: vec.input.chain,
      ts: '2026-11-02T10:05:00.000Z',
      actor: { kind: 'service', id: 'retention-job' },
      checkpoint,
    });
    const prunedEventLine = appendEvent(lastLine, pruneDraft, { allowReserved: true });
    const postPruneLines = parseExport(serializeExport([prunedEventLine]));
    const postPruneCheckpoint = createCheckpoint(
      prunedEventLine,
      '2026-11-02T10:10:00.000Z',
      hexDecode(key.private_hex),
    );
    expect(
      verifyChain({
        chain: vec.input.chain,
        lines: postPruneLines,
        checkpoints: [checkpoint, postPruneCheckpoint],
        trustedKeys: vec.input.trusted_keys,
      }),
    ).toEqual({ valid: true, status: 'verified', anchored_seq: 5, last_seq: 5 });
  });

  it('E2E-4: redact mixed handoff text through loaded builtin packs', () => {
    const vec = JSON.parse(readFileSync(join(VECTORS_DIR, 'k5', 'k5-redact-mixed.json'), 'utf8')) as {
      input: { text_parts: string[]; packs: BuiltinPackId[]; date: string; installation_secret_hex: string };
      expect: Record<string, unknown>;
    };
    const packs = vec.input.packs.map((id) => loadPack(BUILTIN_PACKS[id]));
    const result = redact(vec.input.text_parts.join(''), packs, {
      date: vec.input.date,
      installationSecret: hexDecode(vec.input.installation_secret_hex),
    });
    expect(result).toEqual(vec.expect);
  });
});
