import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { digest, localDate, PlinthError, type RuleWindow, selectAsOf } from '../../src/index.js';
import { compilePacks } from '../../src/repo-tools/compile-packs.js';
import { lintRegex } from '../../src/repo-tools/regex-lint.js';
import { yamlToValue } from '../../src/repo-tools/yaml-subset.js';
import { loadVectors, REPO_ROOT } from '../vectors.js';

function expectPlinthError(fn: () => unknown, expectedCode: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${expectedCode})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(expectedCode);
  }
}

describe('k4 selectAsOf', () => {
  for (const vec of loadVectors('k4', 'selectAsOf')) {
    it(vec.id, () => {
      const r = selectAsOf(
        vec.input.rules as readonly RuleWindow[],
        vec.input.rule_id as string,
        vec.input.date as string,
      );
      expect({ found: r !== null, rev: r ? r.rev : 0 }).toEqual(vec.expect);
    });
  }

  it('throws PK_RULEPACK_OVERLAP on overlapping effective date windows (R2-08)', () => {
    const overlapping: RuleWindow[] = [
      { id: 'r.test', rev: 1, status: 'stable', effective_from: '2026-01-01', effective_until: '2026-06-01' },
      { id: 'r.test', rev: 2, status: 'stable', effective_from: '2026-05-01' },
    ];
    expectPlinthError(() => selectAsOf(overlapping, 'r.test', '2026-05-15'), 'PK_RULEPACK_OVERLAP');
  });
});

describe('k4 localDate', () => {
  for (const vec of loadVectors('k4', 'localDate')) {
    it(vec.id, () => {
      const ts = vec.input.ts as string;
      const tz = vec.input.tz as string;
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => localDate(ts, tz), vec.expect.error);
      } else {
        expect(localDate(ts, tz)).toBe(vec.expect.date);
      }
    });
  }

  it('rejects non-timestamp input with PK_ENCODING_INVALID', () => {
    expectPlinthError(() => localDate('nope', 'UTC'), 'PK_ENCODING_INVALID');
  });
});

describe('k4 yamlSubset', () => {
  for (const vec of loadVectors('k4', 'yamlSubset')) {
    it(vec.id, () => {
      const yamlText = vec.input.yaml_text as string;
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => yamlToValue(yamlText, 'x.yaml'), vec.expect.error);
      } else {
        expect(yamlToValue(yamlText, 'x.yaml')).toEqual(vec.expect.value);
      }
    });
  }

  it('parses single-quoted string and negative integer', () => {
    expect(yamlToValue("a: 'x'\n", 'f.yaml')).toEqual({ a: 'x' });
    expect(yamlToValue('a: -5\n', 'f')).toEqual({ a: -5 });
  });
});

describe('k4 lintRegex', () => {
  for (const vec of loadVectors('k4', 'lintRegex')) {
    it(vec.id, () => {
      const regex = vec.input.regex as string;
      const flags = vec.input.flags as string;
      if (vec.expect.ok === true) {
        expect(() => lintRegex(regex, flags)).not.toThrow();
      } else {
        expectPlinthError(() => lintRegex(regex, flags), vec.expect.error as string);
      }
    });
  }

  it('passes every regex in rules/*/rules.yaml', () => {
    const rulesRoot = join(REPO_ROOT, 'rules');
    const packDirs = readdirSync(rulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(packDirs.length).toBeGreaterThan(0);
    let checked = 0;
    for (const packDir of packDirs) {
      const file = join(rulesRoot, packDir, 'rules.yaml');
      const parsed = yamlToValue(readFileSync(file, 'utf8'), file) as {
        rules: Array<{ body: { regex?: string; flags?: string } }>;
      };
      for (const rule of parsed.rules) {
        if (typeof rule.body.regex === 'string') {
          checked += 1;
          const pattern = rule.body.regex;
          const flags = rule.body.flags ?? '';
          expect(() => lintRegex(pattern, flags)).not.toThrow();
        }
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe('k4 compilePackDigests', () => {
  let tempDir = '';
  let compiled = false;

  function ensureCompiled(): string {
    if (!compiled) {
      tempDir = mkdtempSync(join(tmpdir(), 'plinth-k4-'));
      compilePacks({
        rulesDir: join(REPO_ROOT, 'rules'),
        packsDir: tempDir,
        builtinPath: join(tempDir, 'builtin.ts'),
        check: false,
        runTests: false,
      });
      compiled = true;
    }
    return tempDir;
  }

  afterAll(() => {
    if (tempDir !== '') {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  for (const vec of loadVectors('k4', 'compilePackDigests')) {
    it(vec.id, () => {
      const dir = ensureCompiled();
      const packId = vec.input.pack_id as string;
      const manifest = JSON.parse(readFileSync(join(dir, packId, 'pack.json'), 'utf8')) as {
        files: unknown[];
      };
      const rulesFile = JSON.parse(readFileSync(join(dir, packId, 'rules.json'), 'utf8')) as {
        rules: unknown[];
      };
      const testsFile = JSON.parse(readFileSync(join(dir, packId, 'tests.json'), 'utf8')) as {
        tests: unknown[];
      };
      expect(manifest.files).toEqual(vec.expect.manifest_files);
      expect(digest(manifest)).toBe(vec.expect.manifest_digest);
      expect(rulesFile.rules).toHaveLength(vec.expect.rule_count as number);
      expect(testsFile.tests).toHaveLength(vec.expect.test_count as number);
    });
  }

  it('builtin.ts starts with GENERATED line', () => {
    const builtinPath = join(REPO_ROOT, 'packages', 'ts', 'src', 'packs', 'builtin.ts');
    const firstLine = readFileSync(builtinPath, 'utf8').split(/\r?\n/)[0];
    expect(firstLine).toBe('// GENERATED by packages/ts/src/repo-tools/compile-packs.ts from rules/. Do not edit.');
  });
});
