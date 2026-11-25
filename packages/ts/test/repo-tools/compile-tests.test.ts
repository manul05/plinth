import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PlinthError } from '../../src/index.js';
import { compilePacks } from '../../src/repo-tools/compile-packs.js';
import { REPO_ROOT } from '../vectors.js';

describe('compilePacks with runTests', () => {
  it('throws PK_RULEPACK_TEST_FAILED when a pack test fails', () => {
    const badRulesDir = join(REPO_ROOT, 'packages', 'ts', 'test', 'fixtures', 'bad-pack');
    try {
      compilePacks({
        rulesDir: badRulesDir,
        packsDir: join(REPO_ROOT, 'packs'),
        builtinPath: join(REPO_ROOT, 'packages', 'ts', 'src', 'packs', 'builtin.ts'),
        check: true,
        runTests: true,
      });
      expect.unreachable('Expected PlinthError(PK_RULEPACK_TEST_FAILED)');
    } catch (err) {
      expect(err).toBeInstanceOf(PlinthError);
      expect((err as PlinthError).code).toBe('PK_RULEPACK_TEST_FAILED');
      expect((err as PlinthError).detail).toContain('pk.pii.in.aadhaar');
    }
  });

  it('passes all 70 rule tests when compiling rules/ in check mode', () => {
    const result = compilePacks({
      rulesDir: join(REPO_ROOT, 'rules'),
      packsDir: join(REPO_ROOT, 'packs'),
      builtinPath: join(REPO_ROOT, 'packages', 'ts', 'src', 'packs', 'builtin.ts'),
      check: true,
      runTests: true,
    });
    expect(result).toEqual({ packs: 4, rules: 35, tests: 70, differing: [] });
  });
});
