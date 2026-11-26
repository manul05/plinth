import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runConformance } from '../../src/tools/conformance.js';
import { REPO_ROOT, VECTORS_DIR } from '../vectors.js';

describe('plinth-conformance', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir !== undefined) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('passes all 156 runtime vectors and skips 27 tool vectors', () => {
    const result = runConformance(VECTORS_DIR);
    expect(result).toEqual({
      passed: 156,
      total: 156,
      failures: [],
      skipped: 27,
    });
  });

  it('reports failure when a copy of a vector has a tampered expected digest', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-conf-'));
    tempDirs.push(dir);
    cpSync(VECTORS_DIR, dir, { recursive: true });

    const vecPath = join(dir, 'k0', 'k0-jcs-sort-basic.json');
    const vec = JSON.parse(readFileSync(vecPath, 'utf8')) as { expect: { digest: string } };
    vec.expect.digest = `sha256:${'0'.repeat(64)}`;
    writeFileSync(vecPath, JSON.stringify(vec, null, 2), 'utf8');

    const result = runConformance(dir);
    expect(result.passed).toBe(155);
    expect(result.total).toBe(156);
    expect(result.skipped).toBe(27);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.id).toBe('k0-jcs-sort-basic');
  });

  it('fails closed when vectors directory contains no runtime vectors and exits 1 from CLI on tamper (SEC-R3-11)', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'plinth-conf-empty-'));
    tempDirs.push(emptyDir);
    expect(() => runConformance(emptyDir)).toThrow(/no runtime vectors found/);

    const dir = mkdtempSync(join(tmpdir(), 'plinth-conf-cli-'));
    tempDirs.push(dir);
    cpSync(VECTORS_DIR, dir, { recursive: true });
    const vecPath = join(dir, 'k0', 'k0-jcs-sort-basic.json');
    const vec = JSON.parse(readFileSync(vecPath, 'utf8')) as { expect: { digest: string } };
    vec.expect.digest = `sha256:${'0'.repeat(64)}`;
    writeFileSync(vecPath, JSON.stringify(vec, null, 2), 'utf8');

    const cliPath = join(REPO_ROOT, 'packages', 'ts', 'dist', 'tools', 'conformance.js');
    const res = spawnSync(process.execPath, [cliPath, dir], { encoding: 'utf8' });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('FAIL k0-jcs-sort-basic:');
  });
});
