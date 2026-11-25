import { isTimestamp } from '../core/index.js';
import { PlinthError } from '../errors.js';
import type { LoadedPack, Rule } from './load.js';

export interface RuleWindow {
  id: string;
  rev: number;
  status: Rule['status'];
  effective_from: string;
  effective_until?: string;
}

const IST_OFFSET_MS = 19_800_000;

/**
 * Selects the single non-withdrawn revision of `ruleId` effective on `date` (`YYYY-MM-DD`).
 */
export function selectAsOf<R extends RuleWindow>(rules: readonly R[], ruleId: string, date: string): R | null {
  const candidates = rules.filter(
    (r) =>
      r.id === ruleId &&
      r.status !== 'withdrawn' &&
      r.effective_from <= date &&
      (r.effective_until === undefined || date < r.effective_until),
  );
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.length > 1) {
    throw new PlinthError('PK_RULEPACK_OVERLAP', ruleId);
  }
  return candidates[0] ?? null;
}

/**
 * Returns the calendar date `YYYY-MM-DD` of `ts` in `'Asia/Kolkata'` or `'UTC'`.
 */
export function localDate(ts: string, tz: string): string {
  if (tz !== 'Asia/Kolkata' && tz !== 'UTC') {
    throw new PlinthError('PK_RULEPACK_TZ_UNSUPPORTED', tz);
  }
  if (!isTimestamp(ts)) {
    throw new PlinthError('PK_ENCODING_INVALID', 'ts');
  }
  const ms = Date.parse(ts);
  const shifted = tz === 'Asia/Kolkata' ? ms + IST_OFFSET_MS : ms;
  return new Date(shifted).toISOString().slice(0, 10);
}

export function activeRules(pack: LoadedPack, date: string): Rule[] {
  return pack.rules.filter(
    (rule) =>
      (rule.status === 'experimental' || rule.status === 'stable') && selectAsOf(pack.rules, rule.id, date) === rule,
  );
}
