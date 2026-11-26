import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REPO_ROOT } from './vectors.js';

function runNpmStdout(args: string[], cwd: string): string {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath !== undefined && npmExecPath !== '') {
    return execFileSync(process.execPath, [npmExecPath, ...args], { cwd, encoding: 'utf8' });
  }
  if (process.platform === 'win32') {
    const fallbackCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (existsSync(fallbackCli)) {
      return execFileSync(process.execPath, [fallbackCli, ...args], { cwd, encoding: 'utf8' });
    }
  }
  return execFileSync('npm', args, { cwd, encoding: 'utf8' });
}

interface PackDryRunEntry {
  unpackedSize: number;
  files: Array<{ path: string }>;
}

const RELATIVE_IMPORT_RE = /(?:from|import)\s*\(?\s*['"](\.[^'"]+\.js)['"]/g;

describe('plinth-kit package', () => {
  let cacheDir = '';
  let pack: PackDryRunEntry;

  beforeAll(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'plinth-npm-cache-'));
    const stdout = runNpmStdout(
      ['pack', '--dry-run', '--json', '--workspace', 'packages/ts', '--cache', cacheDir],
      REPO_ROOT,
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
      'dist/version.js',
      'dist/version.d.ts',
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

  it('every relative import inside packed dist/*.js resolves to a packed file', () => {
    const paths = new Set(pack.files.map((f) => f.path));
    const jsFiles = pack.files.filter((f) => f.path.startsWith('dist/') && f.path.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    for (const file of jsFiles) {
      const source = readFileSync(join(REPO_ROOT, 'packages', 'ts', file.path), 'utf8');
      for (const match of source.matchAll(RELATIVE_IMPORT_RE)) {
        const spec = match[1];
        if (spec === undefined) continue;
        const resolved = posix.normalize(posix.join(posix.dirname(file.path), spec));
        expect(paths.has(resolved), `${file.path} imports missing ${resolved}`).toBe(true);
      }
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
