import type { LoadedPack, SecretBody, Severity } from '../rulepack/index.js';

export interface Finding {
  rule_id: string;
  rev: number;
  kind: 'secret' | 'pii' | 'untrusted';
  start: number;
  end: number;
  severity: Severity;
  masked_preview: string;
  provider?: string;
  secret_kind?: SecretBody['secret_kind'];
  environment?: SecretBody['environment'];
  short?: string;
  fingerprint?: string;
  pii_type?: string;
  placeholder?: string;
}

export const MAX_SCAN_INPUT = 1000000 as const;

export function scan(
  _text: string,
  _packs: readonly LoadedPack[],
  _opts: { date: string; installationSecret?: Uint8Array },
): Finding[] {
  throw new Error('not implemented');
}
