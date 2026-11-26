import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSnapshot } from '../../src/repo-tools/snapshot.js';
import { REPO_ROOT } from '../vectors.js';

function collectRelativeFiles(rootDir: string, prefix = ''): string[] {
  const entries = readdirSync(join(rootDir, prefix), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectRelativeFiles(rootDir, rel));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files;
}

describe('buildSnapshot', () => {
  const tempDirs: string[] = [];

  function makeTempOutRoot(): string {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-snapshot-'));
    tempDirs.push(dir);
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

  it('builds a snapshot with sorted SHA256SUMS, PLINTH_VERSION, and packed tarball', () => {
    const outRoot = makeTempOutRoot();
    const res = buildSnapshot({
      repoRoot: REPO_ROOT,
      outRoot,
      tag: 'v0.1.0',
      allowDirty: true,
    });

    expect(res.dir).toBe(join(outRoot, 'plinth-0.1.0'));
    expect(res.sumsSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(res.tarballSha256).toMatch(/^[0-9a-f]{64}$/);

    const sumsText = readFileSync(join(res.dir, 'SHA256SUMS'), 'utf8');
    expect(sumsText.endsWith('\n')).toBe(true);
    const sumLines = sumsText.slice(0, -1).split('\n');
    expect(sumLines.length).toBe(res.files);

    const listedPaths: string[] = [];
    for (const line of sumLines) {
      expect(line).toMatch(/^[0-9a-f]{64} {2}[^ ].*$/);
      const expectedHash = line.slice(0, 64);
      const relPath = line.slice(66);
      listedPaths.push(relPath);
      const actualHash = createHash('sha256')
        .update(readFileSync(join(res.dir, relPath)))
        .digest('hex');
      expect(actualHash).toBe(expectedHash);
    }

    const actualSumsSha256 = createHash('sha256')
      .update(readFileSync(join(res.dir, 'SHA256SUMS')))
      .digest('hex');
    expect(res.sumsSha256).toBe(actualSumsSha256);

    const sortedPaths = [...listedPaths].sort();
    expect(listedPaths).toEqual(sortedPaths);

    const actualFiles = collectRelativeFiles(res.dir)
      .filter((rel) => rel !== 'SHA256SUMS')
      .sort();
    expect(listedPaths).toEqual(actualFiles);
    expect(listedPaths).not.toContain('SHA256SUMS');
    for (const required of [
      'LICENSE',
      'NOTICE',
      'PLINTH_VERSION',
      'contracts/errors.json',
      'docs/consuming.md',
      'docs/patterns/two-hands-ux.md',
      'packs/pk.pii.india/rules.json',
      'plinth-kit-0.1.0.tgz',
    ]) {
      expect(listedPaths).toContain(required);
    }

    const versionText = readFileSync(join(res.dir, 'PLINTH_VERSION'), 'utf8');
    expect(versionText).not.toContain('\r\n');
    expect(versionText.endsWith('\n')).toBe(true);
    const versionLines = versionText.slice(0, -1).split('\n');
    expect(versionLines).toHaveLength(4);
    expect(versionLines[0]).toBe('version=0.1.0');
    expect(versionLines[1]).toBe('tag=v0.1.0');
    expect(versionLines[2]).toMatch(/^commit=[0-9a-f]{40}$/);
    expect(versionLines[3]).toMatch(/^built_at=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const tarballPath = join(res.dir, 'plinth-kit-0.1.0.tgz');
    expect(existsSync(tarballPath)).toBe(true);
    const tarListing = execFileSync('tar', ['-tzf', tarballPath], { encoding: 'utf8' });
    expect(tarListing.split(/\r?\n/)).toContain('package/dist/index.js');
  });

  it('rejects a tag that does not match package version', () => {
    const outRoot = makeTempOutRoot();
    expect(() =>
      buildSnapshot({
        repoRoot: REPO_ROOT,
        outRoot,
        tag: 'v9.9.9',
        allowDirty: true,
      }),
    ).toThrow(/does not match package version/);
  });

  it('refuses clean-checkout build when tag does not match HEAD', () => {
    const outRoot = makeTempOutRoot();
    expect(() =>
      buildSnapshot({
        repoRoot: REPO_ROOT,
        outRoot,
        tag: 'v0.1.0',
        allowDirty: false,
      }),
    ).toThrow(/snapshot must be built from a clean checkout of v0\.1\.0/);
  });

  it('builds cleanly when outRoot contains spaces without shell injection (SEC-R3-03)', () => {
    const base = makeTempOutRoot();
    const outWithSpace = join(base, 'dir with spaces');
    mkdirSync(outWithSpace, { recursive: true });
    const res = buildSnapshot({
      repoRoot: REPO_ROOT,
      outRoot: outWithSpace,
      tag: 'v0.1.0',
      allowDirty: true,
    });
    expect(existsSync(join(res.dir, 'plinth-kit-0.1.0.tgz'))).toBe(true);
  });

  it('produces identical built_at and sumsSha256 across separate builds of the same commit (SEC-R3-07)', async () => {
    const outA = makeTempOutRoot();
    const outB = makeTempOutRoot();
    const resA = buildSnapshot({ repoRoot: REPO_ROOT, outRoot: outA, tag: 'v0.1.0', allowDirty: true });
    await new Promise((resolve) => setTimeout(resolve, 25));
    const resB = buildSnapshot({ repoRoot: REPO_ROOT, outRoot: outB, tag: 'v0.1.0', allowDirty: true });
    expect(readFileSync(join(resA.dir, 'PLINTH_VERSION'), 'utf8')).toBe(
      readFileSync(join(resB.dir, 'PLINTH_VERSION'), 'utf8'),
    );
    expect(resA.sumsSha256).toBe(resB.sumsSha256);
    expect(resA.tarballSha256).toBe(resB.tarballSha256);
  }, 60_000);
});
