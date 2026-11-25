import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './vectors.js';

const SRC_ROOT = join(REPO_ROOT, 'packages', 'ts', 'src');

function walkTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

function libraryFiles(): Array<{ rel: string; content: string }> {
  return walkTsFiles(SRC_ROOT)
    .map((full) => ({
      rel: relative(SRC_ROOT, full).replace(/\\/g, '/'),
      content: readFileSync(full, 'utf8'),
    }))
    .filter(({ rel }) => !rel.startsWith('tools/') && !rel.startsWith('repo-tools/') && rel !== 'packs/builtin.ts');
}

describe('portability guard', () => {
  it('the walk found files', () => {
    expect(libraryFiles().length).toBeGreaterThanOrEqual(1);
  });

  it('library code imports no node built-ins', () => {
    for (const { rel, content } of libraryFiles()) {
      expect(content, rel).not.toMatch(/from\s+['"]node:/);
      expect(content, rel).not.toMatch(/import\(\s*['"]node:/);
    }
  });

  it('library code has no eval, Function, require, fetch or console', () => {
    for (const { rel, content } of libraryFiles()) {
      expect(content, rel).not.toMatch(/\beval\s*\(/);
      expect(content, rel).not.toMatch(/new\s+Function\b/);
      expect(content, rel).not.toMatch(/\brequire\s*\(/);
      expect(content, rel).not.toMatch(/\bfetch\s*\(/);
      expect(content, rel).not.toMatch(/\bconsole\./);
    }
  });

  it('library code does not import tool-only packages', () => {
    for (const { rel, content } of libraryFiles()) {
      expect(content, rel).not.toMatch(/from\s+['"](ajv|yaml|safe-regex2)/);
    }
  });

  it('tools never import repo-tools', () => {
    const toolFiles = walkTsFiles(join(SRC_ROOT, 'tools'));
    for (const full of toolFiles) {
      const rel = relative(SRC_ROOT, full).replace(/\\/g, '/');
      const content = readFileSync(full, 'utf8');
      expect(content, rel).not.toMatch(/repo-tools\//);
    }
  });
});
