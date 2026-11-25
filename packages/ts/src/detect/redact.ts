import type { LoadedPack } from '../rulepack/index.js';
import type { Finding } from './scan.js';

export interface RedactResult {
  output: string;
  findings: Finding[];
  counts: { secret: number; pii: number };
}

export function redact(
  _text: string,
  _packs: readonly LoadedPack[],
  _opts: { date: string; installationSecret: Uint8Array },
): RedactResult {
  throw new Error('not implemented');
}
