import { digest, GENESIS_DIGEST, isTimestamp, type TrustedKey, verifyEnvelope } from '../core/index.js';
import type { ErrorCode } from '../errors.js';
import { CHECKPOINT_POLICY } from './checkpoint.js';

export type ChainResult =
  | { valid: true; status: 'verified'; anchored_seq: number; last_seq: number }
  | {
      valid: true;
      status: 'intact_unanchored_tail';
      anchored_seq: number;
      last_seq: number;
      warning: 'PK_AUDIT_UNANCHORED_TAIL';
    }
  | { valid: false; error: ErrorCode; at_seq?: number; cause?: ErrorCode };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function seqOfCheckpoint(checkpoint: unknown): number {
  if (
    isRecord(checkpoint) &&
    isRecord(checkpoint.payload) &&
    typeof checkpoint.payload.seq === 'number' &&
    Number.isSafeInteger(checkpoint.payload.seq)
  ) {
    return checkpoint.payload.seq;
  }
  return 0;
}

/**
 * Verifies an audit event chain export and its checkpoints in normative A-E order; never throws.
 */
export function verifyChain(input: {
  chain: string;
  lines: readonly unknown[];
  checkpoints: readonly unknown[];
  trustedKeys: readonly TrustedKey[];
}): ChainResult {
  try {
    // Step A: non-empty lines
    if (!isRecord(input) || !Array.isArray(input.lines) || input.lines.length === 0) {
      return { valid: false, error: 'PK_AUDIT_EMPTY' };
    }

    // Step B: validate lines in the given order
    const hashBySeq = new Map<number, string>();
    const events: Record<string, unknown>[] = [];
    let firstSeq = 0;
    let firstPrev = '';
    let previousSeq = 0;
    let previousHash = '';

    for (let i = 0; i < input.lines.length; i++) {
      const line = input.lines[i];
      if (!isRecord(line) || !isRecord(line.event) || typeof line.hash !== 'string') {
        const atSeq =
          isRecord(line) &&
          isRecord(line.event) &&
          typeof line.event.seq === 'number' &&
          Number.isSafeInteger(line.event.seq)
            ? line.event.seq
            : i;
        return { valid: false, error: 'PK_AUDIT_EVENT_MALFORMED', at_seq: atSeq };
      }

      const e = line.event;
      const atSeq = typeof e.seq === 'number' && Number.isSafeInteger(e.seq) ? e.seq : i;

      // B.1: required core event fields
      if (
        typeof e.spec !== 'string' ||
        typeof e.chain !== 'string' ||
        typeof e.seq !== 'number' ||
        !Number.isSafeInteger(e.seq) ||
        e.seq < 0 ||
        typeof e.prev !== 'string' ||
        typeof e.ts !== 'string' ||
        !isTimestamp(e.ts) ||
        !isRecord(e.actor) ||
        typeof e.action !== 'string'
      ) {
        return { valid: false, error: 'PK_AUDIT_EVENT_MALFORMED', at_seq: atSeq };
      }

      const seq = e.seq;

      // B.2: spec
      if (e.spec !== 'pk-audit/1.0') {
        return { valid: false, error: 'PK_SPEC_UNSUPPORTED', at_seq: seq };
      }

      // B.3: chain match
      if (e.chain !== input.chain) {
        return { valid: false, error: 'PK_AUDIT_CHAIN_MISMATCH', at_seq: seq };
      }

      // B.4: canonical digest match
      let computedHash: string;
      try {
        computedHash = digest(e);
      } catch {
        return { valid: false, error: 'PK_AUDIT_EVENT_MALFORMED', at_seq: seq };
      }
      if (computedHash !== line.hash) {
        return { valid: false, error: 'PK_AUDIT_HASH_MISMATCH', at_seq: seq };
      }

      // B.5: sequence continuity
      if (i > 0 && seq !== previousSeq + 1) {
        return { valid: false, error: 'PK_AUDIT_SEQ_GAP', at_seq: previousSeq + 1 };
      }

      // B.6: prev link
      if (i === 0) {
        if (seq === 0 && e.prev !== GENESIS_DIGEST) {
          return { valid: false, error: 'PK_AUDIT_PREV_MISMATCH', at_seq: seq };
        }
        firstSeq = seq;
        firstPrev = e.prev;
      } else if (e.prev !== previousHash) {
        return { valid: false, error: 'PK_AUDIT_PREV_MISMATCH', at_seq: seq };
      }

      hashBySeq.set(seq, line.hash);
      events.push(e);
      previousSeq = seq;
      previousHash = line.hash;
    }

    const lastSeq = previousSeq;

    // Step C: checkpoints sorted by payload.seq ascending
    if (!Array.isArray(input.checkpoints)) {
      return { valid: false, error: 'PK_AUDIT_CHECKPOINT_MALFORMED', at_seq: -1 };
    }
    if (!Array.isArray(input.trustedKeys)) {
      return { valid: false, error: 'PK_AUDIT_EVENT_MALFORMED' };
    }
    const checkpoints = [...input.checkpoints].sort((a, b) => seqOfCheckpoint(a) - seqOfCheckpoint(b));
    const trustedKeys = input.trustedKeys;

    let anchoredSeq = -1;
    const startAnchorPayloads: Record<string, unknown>[] = [];

    for (const c of checkpoints) {
      const fallbackSeq =
        isRecord(c) && isRecord(c.payload) && typeof c.payload.seq === 'number' && Number.isSafeInteger(c.payload.seq)
          ? c.payload.seq
          : -1;

      // C.1: checkpoint shape
      if (
        !isRecord(c) ||
        c.type !== 'pk.audit.checkpoint' ||
        !isRecord(c.payload) ||
        c.payload.spec !== 'pk-audit/1.0' ||
        typeof c.payload.chain !== 'string' ||
        typeof c.payload.seq !== 'number' ||
        !Number.isSafeInteger(c.payload.seq) ||
        c.payload.seq < 0 ||
        typeof c.payload.head !== 'string' ||
        typeof c.payload.ts !== 'string' ||
        !isTimestamp(c.payload.ts) ||
        c.payload.count !== c.payload.seq + 1
      ) {
        return { valid: false, error: 'PK_AUDIT_CHECKPOINT_MALFORMED', at_seq: fallbackSeq };
      }

      const p = c.payload;
      const pSeq = p.seq as number;

      // C.2: envelope signature verification
      const envRes = verifyEnvelope(c, { trustedKeys, policy: CHECKPOINT_POLICY });
      if (!envRes.valid) {
        return { valid: false, error: 'PK_AUDIT_CHECKPOINT_SIG_INVALID', at_seq: pSeq, cause: envRes.error };
      }

      // C.3: chain match
      if (p.chain !== input.chain) {
        return { valid: false, error: 'PK_AUDIT_CHAIN_MISMATCH', at_seq: pSeq };
      }

      // C.4: anchor positioning and head digest match
      if (pSeq < firstSeq - 1) {
        continue;
      }
      if (pSeq === firstSeq - 1) {
        if (p.head !== firstPrev) {
          return { valid: false, error: 'PK_AUDIT_CHECKPOINT_MISMATCH', at_seq: pSeq };
        }
        startAnchorPayloads.push(p);
        if (pSeq > anchoredSeq) {
          anchoredSeq = pSeq;
        }
        continue;
      }
      if (pSeq > lastSeq) {
        return { valid: false, error: 'PK_AUDIT_TRUNCATED', at_seq: lastSeq + 1 };
      }

      if (p.head !== hashBySeq.get(pSeq)) {
        return { valid: false, error: 'PK_AUDIT_CHECKPOINT_MISMATCH', at_seq: pSeq };
      }
      if (pSeq > anchoredSeq) {
        anchoredSeq = pSeq;
      }
    }

    // Step D: pruned export checks
    if (firstSeq > 0) {
      if (startAnchorPayloads.length === 0) {
        return { valid: false, error: 'PK_AUDIT_PRUNED_WITHOUT_ANCHOR', at_seq: firstSeq };
      }
      const anchorDigests = new Set<string>();
      for (const anchor of startAnchorPayloads) {
        try {
          anchorDigests.add(digest(anchor));
        } catch {
          return { valid: false, error: 'PK_AUDIT_CHECKPOINT_MALFORMED', at_seq: firstSeq - 1 };
        }
      }
      const recorded = events.some(
        (e) =>
          e.action === 'pk.audit.pruned' &&
          isRecord(e.data) &&
          e.data.up_to_seq === firstSeq - 1 &&
          typeof e.data.checkpoint_digest === 'string' &&
          anchorDigests.has(e.data.checkpoint_digest),
      );
      if (!recorded) {
        return { valid: false, error: 'PK_AUDIT_PRUNE_UNRECORDED', at_seq: firstSeq };
      }
    }

    // Step E: verification status
    if (anchoredSeq === lastSeq) {
      return { valid: true, status: 'verified', anchored_seq: anchoredSeq, last_seq: lastSeq };
    }
    return {
      valid: true,
      status: 'intact_unanchored_tail',
      anchored_seq: anchoredSeq,
      last_seq: lastSeq,
      warning: 'PK_AUDIT_UNANCHORED_TAIL',
    };
  } catch {
    return { valid: false, error: 'PK_AUDIT_EVENT_MALFORMED' };
  }
}
