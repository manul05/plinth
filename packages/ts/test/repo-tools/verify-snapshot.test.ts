import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSnapshot } from '../../src/repo-tools/snapshot.js';
import { REPO_ROOT } from '../vectors.js';

function resolveSh(): string {
  if (process.platform !== 'win32') {
    return 'sh';
  }
  const probe = spawnSync('sh', ['-c', 'exit 0'], { stdio: 'ignore' });
  if (probe.error === undefined) {
    return 'sh';
  }
  const programFiles = process.env.ProgramFiles ?? 'C:\\Program Files';
  const candidates = [join(programFiles, 'Git', 'bin', 'sh.exe'), join(programFiles, 'Git', 'usr', 'bin', 'sh.exe')];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return 'sh';
}

describe('verify-snapshot.sh', () => {
  const tempDirs: string[] = [];

  function makeConsumer(): { consumerDir: string; sumsSha256: string } {
    const root = mkdtempSync(join(tmpdir(), 'plinth-verify-snap-'));
    tempDirs.push(root);
    const snapOut = join(root, 'snap-out');
    const consumerDir = join(root, 'consumer');
    const vendorPlinth = join(consumerDir, 'vendor', 'plinth');

    const snap = buildSnapshot({
      repoRoot: REPO_ROOT,
      outRoot: snapOut,
      tag: 'v0.1.0',
      allowDirty: true,
    });
    cpSync(snap.dir, vendorPlinth, { recursive: true });
    writeFileSync(
      join(consumerDir, 'plinth.pin'),
      `# Plinth snapshot pin\nversion=0.1.0\nsums_sha256=${snap.sumsSha256}\n`,
      'utf8',
    );
    return { consumerDir, sumsSha256: snap.sumsSha256 };
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir !== undefined) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('valid snapshot passes', () => {
    const { consumerDir } = makeConsumer();
    const stdout = execFileSync(resolveSh(), ['vendor/plinth/verify-snapshot.sh'], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    expect(stdout).toMatch(/^OK plinth 0\.1\.0 snapshot verified/);
  });

  it('tampered byte fails', () => {
    const { consumerDir } = makeConsumer();
    const errorsPath = join(consumerDir, 'vendor', 'plinth', 'contracts', 'errors.json');
    const bytes = readFileSync(errorsPath);
    const tampered = Buffer.from(bytes);
    tampered[0] = (tampered[0] ?? 0) ^ 0x01;
    writeFileSync(errorsPath, tampered);

    const res = spawnSync(resolveSh(), ['vendor/plinth/verify-snapshot.sh'], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    expect(res.status).toBe(1);
    expect(`${res.stdout}${res.stderr}`).toContain('FAILED');
  });

  it('pin mismatch fails', () => {
    const { consumerDir, sumsSha256 } = makeConsumer();
    const flippedDigit = sumsSha256[0] === '0' ? '1' : '0';
    const wrongHash = `${flippedDigit}${sumsSha256.slice(1)}`;
    writeFileSync(
      join(consumerDir, 'plinth.pin'),
      `# Plinth snapshot pin\nversion=0.1.0\nsums_sha256=${wrongHash}\n`,
      'utf8',
    );

    const res = spawnSync(resolveSh(), ['vendor/plinth/verify-snapshot.sh'], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    expect(res.status).toBe(1);
    expect(`${res.stdout}${res.stderr}`).toContain('PIN MISMATCH');
  });

  it('unlisted file fails', () => {
    const { consumerDir } = makeConsumer();
    writeFileSync(join(consumerDir, 'vendor', 'plinth', 'extra.txt'), 'unlisted\n', 'utf8');

    const res = spawnSync(resolveSh(), ['vendor/plinth/verify-snapshot.sh'], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    expect(res.status).toBe(1);
    expect(`${res.stdout}${res.stderr}`).toContain('UNLISTED extra.txt');
  });
});
