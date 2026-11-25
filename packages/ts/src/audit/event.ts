import { type Digest, digest, GENESIS_DIGEST, isTimestamp, type JsonObject } from '../core/index.js';
import { PlinthError } from '../errors.js';

export type ActorKind = 'human' | 'agent' | 'service' | 'device';

export interface AuditEvent {
  spec: 'pk-audit/1.0';
  chain: string;
  seq: number;
  prev: Digest;
  ts: string;
  actor: { kind: ActorKind; id: string; display?: string };
  action: string;
  target?: { kind: string; id: string };
  data?: JsonObject;
  reason?: string;
  refs?: { kind: string; digest: Digest }[];
}

export type EventDraft = Omit<AuditEvent, 'spec' | 'seq' | 'prev'>;

export interface ExportLine {
  event: AuditEvent;
  hash: Digest;
}

const ACTION_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\.[a-z0-9]+(?:[_-][a-z0-9]+)*)+$/;
const CHAIN_RE = /^[a-z0-9][a-z0-9:._-]*$/;
const ACTOR_KINDS: ReadonlySet<string> = new Set<ActorKind>(['human', 'agent', 'service', 'device']);

function assertEventShape(event: AuditEvent): void {
  if (!isTimestamp(event.ts)) {
    throw new PlinthError('PK_AUDIT_EVENT_MALFORMED');
  }
  if (typeof event.action !== 'string' || event.action.length > 128 || !ACTION_RE.test(event.action)) {
    throw new PlinthError('PK_AUDIT_EVENT_MALFORMED');
  }
  if (
    typeof event.actor !== 'object' ||
    event.actor === null ||
    Array.isArray(event.actor) ||
    !ACTOR_KINDS.has(event.actor.kind) ||
    typeof event.actor.id !== 'string' ||
    event.actor.id.length < 1 ||
    event.actor.id.length > 200
  ) {
    throw new PlinthError('PK_AUDIT_EVENT_MALFORMED');
  }
  if (
    typeof event.chain !== 'string' ||
    event.chain.length < 1 ||
    event.chain.length > 200 ||
    !CHAIN_RE.test(event.chain)
  ) {
    throw new PlinthError('PK_AUDIT_EVENT_MALFORMED');
  }
}

/**
 * Computes the canonical SHA-256 digest of an audit event.
 */
export function eventHash(event: AuditEvent): Digest {
  return digest(event);
}

/**
 * Validates and appends a new event draft to an existing audit chain, or starts seq 0 from genesis when previous is null.
 */
export function appendEvent(
  previous: ExportLine | null,
  draft: EventDraft,
  opts: { allowReserved?: boolean } = {},
): ExportLine {
  let seq: number;
  let prev: Digest;

  if (previous === null) {
    seq = 0;
    prev = GENESIS_DIGEST;
  } else {
    if (draft.chain !== previous.event.chain) {
      throw new PlinthError('PK_AUDIT_CHAIN_MISMATCH');
    }
    seq = previous.event.seq + 1;
    prev = previous.hash;
  }

  const event: AuditEvent = { spec: 'pk-audit/1.0', ...draft, seq, prev };
  assertEventShape(event);

  if (event.action.startsWith('pk.') && !opts.allowReserved) {
    throw new PlinthError('PK_AUDIT_RESERVED_ACTION');
  }

  return { event, hash: eventHash(event) };
}
