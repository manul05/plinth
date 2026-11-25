import type { Digest, JsonObject } from '../core/index.js';

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

export function eventHash(_event: AuditEvent): Digest {
  throw new Error('not implemented');
}

export function appendEvent(
  _previous: ExportLine | null,
  _draft: EventDraft,
  _opts?: { allowReserved?: boolean },
): ExportLine {
  throw new Error('not implemented');
}
