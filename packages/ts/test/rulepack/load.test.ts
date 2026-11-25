import { describe, expect, it } from 'vitest';
import { activeRules, type CompiledPack, loadPack, PlinthError } from '../../src/index.js';
import { BUILTIN_PACKS } from '../../src/packs/index.js';

function expectPlinthError(fn: () => unknown, expectedCode: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${expectedCode})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(expectedCode);
  }
}

describe('loadPack and activeRules', () => {
  it('loads all four built-in packs with verified digests and expected rule counts', () => {
    expect(loadPack(BUILTIN_PACKS['pk.pii.india']).rules).toHaveLength(7);
    expect(loadPack(BUILTIN_PACKS['pk.secrets.global']).rules).toHaveLength(12);
    expect(loadPack(BUILTIN_PACKS['pk.secrets.india']).rules).toHaveLength(8);
    expect(loadPack(BUILTIN_PACKS['pk.untrusted-text']).rules).toHaveLength(8);
  });

  it('refuses a tampered rules file with PK_RULEPACK_FILE_HASH_MISMATCH', () => {
    const tampered = structuredClone(BUILTIN_PACKS['pk.pii.india']) as CompiledPack;
    const first = tampered.rules.rules[0];
    if (!first) throw new Error('missing first rule');
    first.title = 'tampered';
    expectPlinthError(() => loadPack(tampered), 'PK_RULEPACK_FILE_HASH_MISMATCH');
  });

  it('refuses a tampered tests file with PK_RULEPACK_FILE_HASH_MISMATCH', () => {
    const tampered = structuredClone(BUILTIN_PACKS['pk.pii.india']) as CompiledPack;
    const first = tampered.tests.tests[0];
    if (!first) throw new Error('missing first test');
    first.note = 'tampered';
    expectPlinthError(() => loadPack(tampered), 'PK_RULEPACK_FILE_HASH_MISMATCH');
  });

  it('refuses an unsupported spec version with PK_SPEC_UNSUPPORTED', () => {
    const unsupported = structuredClone(BUILTIN_PACKS['pk.pii.india']) as unknown as {
      manifest: { spec: string };
      rules: unknown;
      tests: unknown;
    };
    unsupported.manifest.spec = 'pk-rulepack/2.0';
    expectPlinthError(() => loadPack(unsupported as unknown as CompiledPack), 'PK_SPEC_UNSUPPORTED');
  });

  it('refuses an unsupported kind with PK_RULEPACK_KIND_UNSUPPORTED', () => {
    const unsupported = structuredClone(BUILTIN_PACKS['pk.pii.india']) as unknown as {
      manifest: { kind: string };
      rules: unknown;
      tests: unknown;
    };
    unsupported.manifest.kind = 'risk-rule';
    expectPlinthError(() => loadPack(unsupported as unknown as CompiledPack), 'PK_RULEPACK_KIND_UNSUPPORTED');
  });

  it('filters activeRules by effective date and excludes deprecated/withdrawn rules', () => {
    const global = loadPack(BUILTIN_PACKS['pk.secrets.global']);
    expect(activeRules(global, '2026-10-30')).toHaveLength(0);
    expect(activeRules(global, '2026-11-01')).toHaveLength(12);

    const synthetic = loadPack(BUILTIN_PACKS['pk.pii.india']);
    const first = structuredClone(synthetic.rules[0]);
    const second = structuredClone(synthetic.rules[1]);
    if (!first || !second) throw new Error('missing rules');
    first.status = 'deprecated';
    second.status = 'withdrawn';
    const filtered = activeRules(
      { manifest: synthetic.manifest, rules: [first, second, ...synthetic.rules.slice(2)] },
      '2026-11-01',
    );
    expect(filtered).toHaveLength(5);
  });
});
