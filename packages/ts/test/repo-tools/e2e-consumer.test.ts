import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSnapshot } from '../../src/repo-tools/snapshot.js';
import { vendorSnapshot } from '../../src/repo-tools/vendor.js';
import { REPO_ROOT } from '../vectors.js';

function runNpmStdout(args: string[], cwd: string): string {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath !== undefined && npmExecPath !== '') {
    return execFileSync(process.execPath, [npmExecPath, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  if (process.platform === 'win32') {
    const fallbackCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (existsSync(fallbackCli)) {
      return execFileSync(process.execPath, [fallbackCli, ...args], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    }
  }
  return execFileSync('npm', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

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

describe('E2E-5 scratch consumer vendoring', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir !== undefined) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('installs vendored tarball, verifies pin and integrity, imports core, and passes conformance', async () => {
    const root = mkdtempSync(join(tmpdir(), 'plinth-e2e-consumer-'));
    tempDirs.push(root);
    const snapOut = join(root, 'snap-out');
    const consumerDir = join(root, 'consumer');
    const npmCacheDir = join(root, 'npm-cache');
    mkdirSync(consumerDir, { recursive: true });
    mkdirSync(npmCacheDir, { recursive: true });

    writeFileSync(
      join(consumerDir, 'package.json'),
      `${JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2)}\n`,
      'utf8',
    );

    const snap = buildSnapshot({
      repoRoot: REPO_ROOT,
      outRoot: snapOut,
      tag: 'v0.1.0',
      allowDirty: true,
    });
    vendorSnapshot({ snapshotDir: snap.dir, consumerRoot: consumerDir });

    runNpmStdout(
      ['install', '--save-exact', './vendor/plinth/plinth-kit-0.1.0.tgz', '--cache', npmCacheDir],
      consumerDir,
    );

    const consumerPkg = JSON.parse(readFileSync(join(consumerDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(consumerPkg.dependencies?.['plinth-kit']).toBe('file:vendor/plinth/plinth-kit-0.1.0.tgz');

    const lockfile = JSON.parse(readFileSync(join(consumerDir, 'package-lock.json'), 'utf8')) as {
      packages?: Record<string, { integrity?: string }>;
    };
    const integrity = lockfile.packages?.['node_modules/plinth-kit']?.integrity;
    expect(integrity).toMatch(/^sha512-/);

    const digestOut = execFileSync('node', ['-e', "import('plinth-kit/core').then(m => console.log(m.digest({})))"], {
      cwd: consumerDir,
      encoding: 'utf8',
    }).trim();
    expect(digestOut).toBe('sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');

    const verifyOut = execFileSync(resolveSh(), ['vendor/plinth/verify-snapshot.sh'], {
      cwd: consumerDir,
      encoding: 'utf8',
    }).trim();
    expect(verifyOut).toMatch(/^OK plinth 0\.1\.0/);

    const conformanceOut = runNpmStdout(
      ['exec', '--no', '--', 'plinth-conformance', 'vendor/plinth/contracts/test-vectors'],
      consumerDir,
    ).trim();
    expect(conformanceOut).toBe('PASS 156/156');
  }, 180_000);
});
