import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { compilePacks } from '../../src/repo-tools/compile-packs.js';
import { REPO_ROOT } from '../vectors.js';

describe('compilePacks --check drift detection', () => {
  const tempDirs: string[] = [];

  function makeTempPacksCopy(): string {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-packs-check-'));
    tempDirs.push(dir);
    cpSync(join(REPO_ROOT, 'packs'), dir, { recursive: true });
    return dir;
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir !== undefined) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('reports no differing files when packs match rules', () => {
    const tempDir = makeTempPacksCopy();
    const res = compilePacks({
      rulesDir: join(REPO_ROOT, 'rules'),
      packsDir: tempDir,
      builtinPath: join(REPO_ROOT, 'packages', 'ts', 'src', 'packs', 'builtin.ts'),
      check: true,
      runTests: false,
    });
    expect(res.differing).toEqual([]);
  });

  it('reports differing file relative POSIX path when a pack file is modified', () => {
    const tempDir = makeTempPacksCopy();
    const target = join(tempDir, 'pk.pii.india', 'rules.json');
    const content = readFileSync(target, 'utf8');
    const flipped = `${content.slice(0, -1)}${content.endsWith('}') ? ' ' : '}'}`;
    writeFileSync(target, flipped, 'utf8');

    const res = compilePacks({
      rulesDir: join(REPO_ROOT, 'rules'),
      packsDir: tempDir,
      builtinPath: join(REPO_ROOT, 'packages', 'ts', 'src', 'packs', 'builtin.ts'),
      check: true,
      runTests: false,
    });
    expect(res.differing).toEqual(['pk.pii.india/rules.json']);
  });
});
