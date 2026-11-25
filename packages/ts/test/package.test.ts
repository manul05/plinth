import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REPO_ROOT } from './vectors.js';

interface PackDryRunEntry {
  unpackedSize: number;
  files: Array<{ path: string }>;
}

describe('plinth-kit package', () => {
  let cacheDir = '';
  let pack: PackDryRunEntry;

  beforeAll(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'plinth-npm-cache-'));
    const stdout = execFileSync(
      'npm',
      ['pack', '--dry-run', '--json', '--workspace', 'packages/ts', '--cache', cacheDir],
      {
        cwd: REPO_ROOT,
        shell: true,
        encoding: 'utf8',
      },
    );
    const parsed = JSON.parse(stdout) as PackDryRunEntry[];
    const entry = parsed[0];
    if (entry === undefined) {
      throw new Error('npm pack --dry-run returned empty JSON array');
    }
    pack = entry;
  }, 30_000);

  afterAll(() => {
    if (cacheDir !== '') {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it('package contains no repo-tools or tests', () => {
    for (const file of pack.files) {
      expect(file.path.startsWith('dist/repo-tools')).toBe(false);
      expect(file.path.startsWith('test/')).toBe(false);
      expect(file.path.startsWith('src/')).toBe(false);
    }
  });

  it('package contains the entry points', () => {
    const paths = new Set(pack.files.map((f) => f.path));
    for (const required of [
      'dist/index.js',
      'dist/core/index.js',
      'dist/packs/builtin.js',
      'dist/tools/conformance.js',
      'LICENSE',
      'NOTICE',
      'README.md',
      'package.json',
    ]) {
      expect(paths.has(required), `missing ${required}`).toBe(true);
    }
  });

  it('unpacked size within budget', () => {
    expect(pack.unpackedSize).toBeLessThanOrEqual(600_000);
  });

  it('LICENSE copies are identical', () => {
    const rootLicense = readFileSync(join(REPO_ROOT, 'LICENSE'));
    const pkgLicense = readFileSync(join(REPO_ROOT, 'packages', 'ts', 'LICENSE'));
    expect(pkgLicense.equals(rootLicense)).toBe(true);

    const rootNotice = readFileSync(join(REPO_ROOT, 'NOTICE'));
    const pkgNotice = readFileSync(join(REPO_ROOT, 'packages', 'ts', 'NOTICE'));
    expect(pkgNotice.equals(rootNotice)).toBe(true);
  });
});
