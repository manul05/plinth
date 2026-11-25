import { PlinthError } from '../errors.js';
import type { LoadedPack } from '../rulepack/index.js';
import { type Finding, scan } from './scan.js';

export interface RedactResult {
  output: string;
  findings: Finding[];
  counts: { secret: number; pii: number };
}

export function redact(
  text: string,
  packs: readonly LoadedPack[],
  opts: { date: string; installationSecret: Uint8Array },
): RedactResult {
  if (!(opts.installationSecret instanceof Uint8Array) || opts.installationSecret.length < 32) {
    throw new PlinthError('PK_DETECT_SECRET_REQUIRED');
  }

  const findings = scan(text, packs, opts).filter((finding) => finding.kind !== 'untrusted');
  let output = '';
  let lastEnd = 0;
  let secretCount = 0;
  let piiCount = 0;
  const kept: Finding[] = [];

  for (const finding of findings) {
    if (finding.start < lastEnd) {
      continue;
    }
    output += text.slice(lastEnd, finding.start);
    let placeholder: string;
    if (finding.kind === 'secret') {
      secretCount += 1;
      const fpPrefix = finding.fingerprint?.slice(0, 4) ?? '';
      placeholder = `[REDACTED:${finding.short}:\u2026${fpPrefix}]`;
    } else {
      piiCount += 1;
      placeholder = `[REDACTED:${finding.pii_type}]`;
    }
    output += placeholder;
    lastEnd = finding.end;
    kept.push({ ...finding, placeholder });
  }
  output += text.slice(lastEnd);

  return {
    output,
    findings: kept,
    counts: { secret: secretCount, pii: piiCount },
  };
}
