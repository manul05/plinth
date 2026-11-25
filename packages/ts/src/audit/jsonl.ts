import { canonicalize, type Digest, parseJson } from '../core/index.js';
import { PlinthError } from '../errors.js';
import type { AuditEvent, ExportLine } from './event.js';

const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

/**
 * Parses an exported JSON Lines audit log, validating each line's JSON syntax and `{event, hash}` shape.
 */
export function parseExport(text: string): ExportLine[] {
  const rawLines = text.split('\n');
  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
    rawLines.pop();
  }

  const out: ExportLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const detail = `line ${i + 1}`;
    let parsed: unknown;
    try {
      parsed = parseJson(rawLines[i] ?? '');
    } catch (err) {
      if (err instanceof PlinthError) {
        throw new PlinthError(err.code, detail);
      }
      throw new PlinthError('PK_JSON_SYNTAX', detail);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new PlinthError('PK_AUDIT_EVENT_MALFORMED', detail);
    }
    const obj = parsed as Record<string, unknown>;
    if (
      typeof obj.event !== 'object' ||
      obj.event === null ||
      Array.isArray(obj.event) ||
      typeof obj.hash !== 'string' ||
      !DIGEST_RE.test(obj.hash)
    ) {
      throw new PlinthError('PK_AUDIT_EVENT_MALFORMED', detail);
    }

    out.push({ event: obj.event as AuditEvent, hash: obj.hash as Digest });
  }
  return out;
}

/**
 * Serializes audit export lines into canonical JSON Lines terminated with `\n`.
 */
export function serializeExport(lines: readonly ExportLine[]): string {
  return lines.map((line) => `${canonicalize({ event: line.event, hash: line.hash })}\n`).join('');
}
