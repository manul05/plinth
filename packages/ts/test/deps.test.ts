import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './vectors.js';

function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(join(REPO_ROOT, relPath), 'utf8')) as T;
}

describe('dependency pins', () => {
  it('runtime dependencies are exactly the pinned three', () => {
    const pkg = readJson<{ dependencies: Record<string, string> }>('packages/ts/package.json');
    expect(pkg.dependencies).toEqual({
      '@noble/curves': '2.4.0',
      '@noble/hashes': '2.4.0',
      '@scure/base': '2.4.0',
    });
  });

  it('dev dependencies are pinned exactly', () => {
    const rootPkg = readJson<{ devDependencies: Record<string, string> }>('package.json');
    for (const [name, version] of Object.entries(rootPkg.devDependencies)) {
      expect(version, `${name}: ${version}`).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
    }
  });

  it('lockfile agrees', () => {
    const lock = readJson<{ packages: Record<string, { version?: string }> }>('package-lock.json');
    expect(lock.packages['node_modules/@noble/curves']?.version).toBe('2.4.0');
    expect(lock.packages['node_modules/@noble/hashes']?.version).toBe('2.4.0');
    expect(lock.packages['node_modules/@scure/base']?.version).toBe('2.4.0');
    expect(lock.packages['node_modules/typescript']?.version).toBe('7.0.2');
    expect(lock.packages['node_modules/vitest']?.version).toBe('5.0.5');
  });
});
