import type { LoadedPack, Rule } from './load.js';

export interface RuleWindow {
  id: string;
  rev: number;
  status: Rule['status'];
  effective_from: string;
  effective_until?: string;
}

export function selectAsOf<R extends RuleWindow>(_rules: readonly R[], _ruleId: string, _date: string): R | null {
  throw new Error('not implemented');
}

export function localDate(_ts: string, _tz: string): string {
  throw new Error('not implemented');
}

export function activeRules(_pack: LoadedPack, _date: string): Rule[] {
  throw new Error('not implemented');
}
