import { describe, expect, it } from 'vitest';
import { loadPack, scan } from '../../src/index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../../src/packs/index.js';

describe('every pack test passes', () => {
  const packIds = Object.keys(BUILTIN_PACKS).sort() as BuiltinPackId[];
  for (const packId of packIds) {
    const compiled = BUILTIN_PACKS[packId];
    const loaded = loadPack(compiled);
    for (const [index, testCase] of compiled.tests.tests.entries()) {
      it(`${testCase.rule_id} #${index} ${testCase.expect}`, () => {
        const candidates = compiled.rules.rules.filter((r) => r.id === testCase.rule_id && r.status !== 'withdrawn');
        candidates.sort((a, b) => b.rev - a.rev);
        const rule = candidates[0] ?? compiled.rules.rules.find((r) => r.id === testCase.rule_id);
        if (rule === undefined) {
          throw new Error(`Rule not found: ${testCase.rule_id}`);
        }
        const text = testCase.input_parts.join('');
        const findings = scan(text, [loaded], { date: rule.effective_from });
        const matched = findings.some((f) => f.rule_id === testCase.rule_id);
        expect(matched).toBe(testCase.expect === 'match');
      });
    }
  }
});
