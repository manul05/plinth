import { PlinthError } from '../errors.js';
import {
  activeRules,
  type LoadedPack,
  type PiiBody,
  type Rule,
  type SecretBody,
  type Severity,
  type UntrustedBody,
} from '../rulepack/index.js';
import { shannonEntropy } from './entropy.js';
import { maskSecret } from './mask.js';
import { gstinValid, upiHandleValid, verhoeffValid } from './validators.js';

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

type PairWith = NonNullable<SecretBody['pair_with']>;

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function scanSecretRule(
  text: string,
  textLower: string,
  rule: Rule,
  body: SecretBody,
  pairWithMap: Map<Finding, PairWith>,
): Finding[] {
  if (body.keywords.length > 0 && !body.keywords.some((kw) => textLower.includes(kw))) {
    return [];
  }
  const re = new RegExp(body.regex, `dgu${body.flags ?? ''}`);
  const allowRes = body.allow.map((pattern) => new RegExp(pattern, 'u'));
  const entropyMin = body.entropy_min !== undefined ? Number(body.entropy_min) : undefined;
  const out: Finding[] = [];

  for (const match of text.matchAll(re)) {
    const value = match[body.secret_group];
    const span = match.indices?.[body.secret_group];
    if (value === undefined || value.length === 0 || span === undefined) {
      continue;
    }
    if (entropyMin !== undefined && shannonEntropy(value) < entropyMin) {
      continue;
    }
    if (allowRes.some((allowRe) => allowRe.test(value))) {
      continue;
    }
    const finding: Finding = {
      rule_id: rule.id,
      rev: rule.rev,
      kind: 'secret',
      start: span[0],
      end: span[1],
      severity: body.severity,
      provider: body.provider,
      secret_kind: body.secret_kind,
      environment: body.environment,
      short: body.short,
      masked_preview: maskSecret(value),
    };
    if (body.pair_with !== undefined) {
      pairWithMap.set(finding, body.pair_with);
    }
    out.push(finding);
  }
  return out;
}

function validatePii(value: string, body: PiiBody): boolean {
  if (body.validator === 'none') {
    return true;
  }
  if (body.validator === 'verhoeff') {
    return verhoeffValid(value);
  }
  if (body.validator === 'gstin') {
    return gstinValid(value);
  }
  if (body.validator === 'upi_handle') {
    return upiHandleValid(value, body.handles ?? []);
  }
  throw new PlinthError('PK_DETECT_UNKNOWN_VALIDATOR', String(body.validator));
}

function scanPiiRule(text: string, rule: Rule, body: PiiBody): Finding[] {
  const re = new RegExp(body.regex, `dgu${body.flags ?? ''}`);
  const out: Finding[] = [];

  for (const match of text.matchAll(re)) {
    const value = match[0];
    const span = match.indices?.[0];
    if (value === undefined || value.length === 0 || span === undefined) {
      continue;
    }
    if (!validatePii(value, body)) {
      continue;
    }
    const masked_preview =
      body.mask.display === 'last4' ? `\u2026${value.replace(/[^A-Za-z0-9]/g, '').slice(-4)}` : '\u2026';
    out.push({
      rule_id: rule.id,
      rev: rule.rev,
      kind: 'pii',
      start: span[0],
      end: span[1],
      severity: body.severity,
      pii_type: body.pii_type,
      masked_preview,
    });
  }
  return out;
}

function scanPhraseRule(text: string, rule: Rule, body: Extract<UntrustedBody, { class: 'phrase' }>): Finding[] {
  const re = new RegExp(body.regex, `dgu${body.flags ?? ''}`);
  const out: Finding[] = [];

  for (const match of text.matchAll(re)) {
    const value = match[0];
    const span = match.indices?.[0];
    if (value === undefined || value.length === 0 || span === undefined) {
      continue;
    }
    const masked_preview = value.length > 64 ? `${value.slice(0, 64)}\u2026` : value;
    out.push({
      rule_id: rule.id,
      rev: rule.rev,
      kind: 'untrusted',
      start: span[0],
      end: span[1],
      severity: body.severity,
      masked_preview,
    });
  }
  return out;
}

function applyPairing(findings: readonly Finding[], pairWithMap: ReadonlyMap<Finding, PairWith>): Finding[] {
  return findings.filter((finding) => {
    const pairWith = pairWithMap.get(finding);
    if (pairWith === undefined) {
      return true;
    }
    return findings.some((other) => {
      if (other === finding || !pairWith.rules.includes(other.rule_id)) {
        return false;
      }
      const distance = Math.max(0, other.start - finding.end, finding.start - other.end);
      return distance <= pairWith.within_chars;
    });
  });
}

export function scan(
  text: string,
  packs: readonly LoadedPack[],
  opts: { date: string; installationSecret?: Uint8Array },
): Finding[] {
  if (text.length > MAX_SCAN_INPUT) {
    throw new PlinthError('PK_DETECT_INPUT_TOO_LARGE');
  }

  const taggedRules = packs.flatMap((pack) =>
    activeRules(pack, opts.date).map((rule) => ({ kind: pack.manifest.kind, rule })),
  );

  let textLower: string | undefined;
  const pairWithMap = new Map<Finding, PairWith>();
  const rawFindings: Finding[] = [];

  for (const { kind, rule } of taggedRules) {
    if (kind === 'secret-detection') {
      textLower ??= text.toLowerCase();
      rawFindings.push(...scanSecretRule(text, textLower, rule, rule.body as SecretBody, pairWithMap));
    } else if (kind === 'pii-detection') {
      rawFindings.push(...scanPiiRule(text, rule, rule.body as PiiBody));
    } else {
      const body = rule.body as UntrustedBody;
      if (body.class === 'phrase') {
        rawFindings.push(...scanPhraseRule(text, rule, body));
      }
    }
  }

  const paired = applyPairing(rawFindings, pairWithMap);
  paired.sort(
    (a, b) =>
      a.start - b.start ||
      b.end - b.start - (a.end - a.start) ||
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      (a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0),
  );
  return paired;
}
