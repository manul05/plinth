import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timestampFromMs } from '../core/index.js';

export interface SnapshotOptions {
  repoRoot: string;
  outRoot: string;
  tag: string;
  allowDirty: boolean;
}

export interface SnapshotResult {
  dir: string;
  sumsSha256: string;
  tarballSha256: string;
  files: number;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function listFilesRelative(rootDir: string, prefix = ''): string[] {
  const entries = readdirSync(join(rootDir, prefix), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...listFilesRelative(rootDir, rel));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files;
}

function runGit(repoRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function buildSnapshot(opts: SnapshotOptions): SnapshotResult {
  const pkgJsonPath = join(opts.repoRoot, 'packages', 'ts', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { version?: unknown };
  if (typeof pkg.version !== 'string' || pkg.version === '') {
    throw new Error('packages/ts/package.json is missing version');
  }
  const pkgVersion = pkg.version;

  if (!opts.tag.startsWith('v') || opts.tag.slice(1) !== pkgVersion) {
    throw new Error(`tag ${opts.tag} does not match package version ${pkgVersion}`);
  }
  const version = opts.tag.slice(1);

  const headCommit = runGit(opts.repoRoot, ['rev-parse', 'HEAD']);
  if (!opts.allowDirty) {
    const dirty = runGit(opts.repoRoot, ['status', '--porcelain']);
    let tagCommit = '';
    try {
      tagCommit = runGit(opts.repoRoot, ['rev-list', '-n', '1', opts.tag]);
    } catch {
      tagCommit = '';
    }
    if (dirty !== '' || tagCommit === '' || tagCommit !== headCommit) {
      throw new Error(`snapshot must be built from a clean checkout of ${opts.tag}`);
    }
  }

  const dir = join(opts.outRoot, `plinth-${version}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const npmCacheDir = mkdtempSync(join(tmpdir(), 'plinth-npm-cache-'));
  try {
    execFileSync('npm', ['pack', '--workspace', 'packages/ts', '--pack-destination', dir, '--cache', npmCacheDir], {
      cwd: opts.repoRoot,
      shell: true,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } finally {
    rmSync(npmCacheDir, { recursive: true, force: true });
  }

  const tarballPath = join(dir, `plinth-kit-${version}.tgz`);
  if (!existsSync(tarballPath)) {
    throw new Error(`expected tarball not found: ${tarballPath}`);
  }
  const tarballSha256 = sha256Hex(readFileSync(tarballPath));

  cpSync(join(opts.repoRoot, 'LICENSE'), join(dir, 'LICENSE'));
  cpSync(join(opts.repoRoot, 'NOTICE'), join(dir, 'NOTICE'));
  cpSync(join(opts.repoRoot, 'contracts'), join(dir, 'contracts'), { recursive: true });
  cpSync(join(opts.repoRoot, 'packs'), join(dir, 'packs'), { recursive: true });
  mkdirSync(join(dir, 'docs', 'patterns'), { recursive: true });
  cpSync(join(opts.repoRoot, 'docs', 'patterns', 'two-hands-ux.md'), join(dir, 'docs', 'patterns', 'two-hands-ux.md'));
  cpSync(join(opts.repoRoot, 'docs', 'consuming.md'), join(dir, 'docs', 'consuming.md'));

  const verifyScriptSrc = join(opts.repoRoot, 'scripts', 'verify-snapshot.sh');
  if (existsSync(verifyScriptSrc)) {
    cpSync(verifyScriptSrc, join(dir, 'verify-snapshot.sh'));
  } else if (!opts.allowDirty) {
    throw new Error('missing scripts/verify-snapshot.sh');
  }

  const versionContent = [
    `version=${version}`,
    `tag=${opts.tag}`,
    `commit=${headCommit}`,
    `built_at=${timestampFromMs(Date.now())}`,
    '',
  ].join('\n');
  writeFileSync(join(dir, 'PLINTH_VERSION'), versionContent, 'utf8');

  const relFiles = listFilesRelative(dir)
    .filter((rel) => rel !== 'SHA256SUMS')
    .sort();
  const sumLines = relFiles.map((rel) => {
    const bytes = readFileSync(join(dir, rel));
    return `${sha256Hex(bytes)}  ${rel}\n`;
  });
  const sumsBytes = Buffer.from(sumLines.join(''), 'utf8');
  writeFileSync(join(dir, 'SHA256SUMS'), sumsBytes);

  const sumsSha256 = sha256Hex(sumsBytes);
  return {
    dir,
    sumsSha256,
    tarballSha256,
    files: relFiles.length,
  };
}

function parseCliArgs(
  argv: readonly string[],
  repoRoot: string,
): { tag: string; outRoot: string; allowDirty: boolean } | null {
  let tag = '';
  let outRoot = join(repoRoot, 'snapshot');
  let allowDirty = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--tag') {
      const next = argv[i + 1];
      if (next === undefined || next === '') {
        return null;
      }
      tag = next;
      i++;
    } else if (arg === '--out') {
      const next = argv[i + 1];
      if (next === undefined || next === '') {
        return null;
      }
      outRoot = next;
      i++;
    } else if (arg === '--allow-dirty') {
      allowDirty = true;
    } else {
      return null;
    }
  }

  if (tag === '') {
    return null;
  }
  return { tag, outRoot, allowDirty };
}

function runCli(): void {
  const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
  const parsed = parseCliArgs(process.argv.slice(2), repoRoot);
  if (parsed === null) {
    process.stderr.write('usage: snapshot --tag <tag> [--out <dir>] [--allow-dirty]\n');
    process.exitCode = 2;
    return;
  }

  const result = buildSnapshot({
    repoRoot,
    outRoot: parsed.outRoot,
    tag: parsed.tag,
    allowDirty: parsed.allowDirty,
  });
  const relDir = relative(repoRoot, result.dir).replaceAll('\\', '/');
  process.stdout.write(`snapshot: ${relDir} sums_sha256=${result.sumsSha256}\n`);
  process.stdout.write(`tarball_sha256=${result.tarballSha256}\n`);
}

if (process.argv[1]?.endsWith('snapshot.js')) {
  try {
    runCli();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
