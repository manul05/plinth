import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSnapshot } from '../../src/repo-tools/snapshot.js';
import { vendorSnapshot } from '../../src/repo-tools/vendor.js';
import { REPO_ROOT } from '../vectors.js';

describe('vendorSnapshot', () => {
  const tempDirs: string[] = [];

  function makeTempDir(prefix: string): string {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
  }

  function buildTestSnapshot(): { snapshotDir: string; sumsSha256: string; tarballSha256: string } {
    const snapOut = makeTempDir('plinth-vendor-snap-');
    const snap = buildSnapshot({
      repoRoot: REPO_ROOT,
      outRoot: snapOut,
      tag: 'v0.1.0',
      allowDirty: true,
    });
    return {
      snapshotDir: snap.dir,
      sumsSha256: snap.sumsSha256,
      tarballSha256: snap.tarballSha256,
    };
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir !== undefined) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('vendors a valid snapshot, writes 7-line plinth.pin, and adds .gitattributes once', () => {
    const { snapshotDir, sumsSha256, tarballSha256 } = buildTestSnapshot();
    const consumerRoot = makeTempDir('plinth-vendor-consumer-');
    writeFileSync(join(consumerRoot, 'package.json'), '{"name":"consumer","private":true}\n', 'utf8');

    const { pinText } = vendorSnapshot({ snapshotDir, consumerRoot });

    const pinPath = join(consumerRoot, 'plinth.pin');
    expect(existsSync(pinPath)).toBe(true);
    const writtenPin = readFileSync(pinPath, 'utf8');
    expect(writtenPin).toBe(pinText);
    expect(writtenPin.endsWith('\n')).toBe(true);

    const pinLines = writtenPin.slice(0, -1).split('\n');
    expect(pinLines).toHaveLength(7);
    expect(pinLines[0]).toBe('# Plinth snapshot pin. Written by the Plinth vendor tool. Do not edit by hand.');
    expect(pinLines[1]).toBe('version=0.1.0');
    expect(pinLines[2]).toBe('tag=v0.1.0');
    expect(pinLines[3]).toMatch(/^commit=[0-9a-f]{40}$/);
    expect(pinLines[4]).toBe(`sums_sha256=${sumsSha256}`);
    expect(pinLines[5]).toBe('tarball=plinth-kit-0.1.0.tgz');
    expect(pinLines[6]).toBe(`tarball_sha256=${tarballSha256}`);

    const copiedSumsBytes = readFileSync(join(consumerRoot, 'vendor', 'plinth', 'SHA256SUMS'));
    const copiedSumsSha = createHash('sha256').update(copiedSumsBytes).digest('hex');
    expect(copiedSumsSha).toBe(sumsSha256);

    const gitattributesPath = join(consumerRoot, '.gitattributes');
    expect(readFileSync(gitattributesPath, 'utf8')).toBe('vendor/plinth/** -text\n');

    vendorSnapshot({ snapshotDir, consumerRoot });
    const lines = readFileSync(gitattributesPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line !== '');
    expect(lines.filter((line) => line === 'vendor/plinth/** -text')).toHaveLength(1);
  });

  it('appends .gitattributes entry once while preserving existing lines', () => {
    const { snapshotDir } = buildTestSnapshot();
    const consumerRoot = makeTempDir('plinth-vendor-consumer-');
    writeFileSync(join(consumerRoot, 'package.json'), '{"name":"consumer","private":true}\n', 'utf8');
    writeFileSync(join(consumerRoot, '.gitattributes'), '* text=auto\n', 'utf8');

    vendorSnapshot({ snapshotDir, consumerRoot });
    expect(readFileSync(join(consumerRoot, '.gitattributes'), 'utf8')).toBe('* text=auto\nvendor/plinth/** -text\n');
  });

  it('refuses a tampered snapshot with snapshot is not intact', () => {
    const { snapshotDir } = buildTestSnapshot();
    const consumerRoot = makeTempDir('plinth-vendor-consumer-');
    writeFileSync(join(consumerRoot, 'package.json'), '{"name":"consumer","private":true}\n', 'utf8');

    const target = join(snapshotDir, 'contracts', 'errors.json');
    const bytes = Buffer.from(readFileSync(target));
    bytes[0] = (bytes[0] ?? 0) ^ 0x01;
    writeFileSync(target, bytes);

    expect(() => vendorSnapshot({ snapshotDir, consumerRoot })).toThrow(/snapshot is not intact/);
    expect(existsSync(join(consumerRoot, 'vendor', 'plinth'))).toBe(false);
  });

  it('refuses a consumer directory without package.json', () => {
    const { snapshotDir } = buildTestSnapshot();
    const consumerRoot = makeTempDir('plinth-vendor-empty-');

    expect(() => vendorSnapshot({ snapshotDir, consumerRoot })).toThrow(/not a consumer repo: package\.json missing/);
  });
});
