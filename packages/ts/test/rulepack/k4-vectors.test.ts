import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
});
