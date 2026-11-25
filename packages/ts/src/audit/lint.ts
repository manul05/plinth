import { type Finding, scan } from '../detect/index.js';
import type { LoadedPack } from '../rulepack/index.js';
import type { AuditEvent } from './event.js';

const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function walkValue(value: unknown, packs: readonly LoadedPack[], date: string, out: Finding[]): void {
  if (typeof value === 'string') {
    if (DIGEST_RE.test(value) || UUID_RE.test(value)) {
      return;
    }
    for (const finding of scan(value, packs, { date })) {
      if (finding.kind === 'pii') {
        out.push(finding);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      walkValue(item, packs, date, out);
    }
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, member] of Object.entries(value)) {
      if (key === 'prev') {
        continue;
      }
      walkValue(member, packs, date, out);
    }
  }
}

export function lintPersonalData(event: AuditEvent, packs: readonly LoadedPack[], date: string): Finding[] {
  const out: Finding[] = [];
  walkValue(event, packs, date, out);
  return out;
}
