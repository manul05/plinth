import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface VendorOptions {
  snapshotDir: string;
  consumerRoot: string;
}

export interface VendorResult {
  pinText: string;
}

const SUMS_LINE_RE = /^([0-9a-f]{64}) {2}([^ ].*)$/;
const GITATTR_LINE = 'vendor/plinth/** -text';

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

function isSafeRelPath(relPath: string): boolean {
  if (relPath === '' || relPath.startsWith('/') || relPath.includes('\\')) {
    return false;
  }
  const parts = relPath.split('/');
  return !parts.some((part) => part === '' || part === '.' || part === '..');
}

function verifySnapshotDir(snapshotDir: string): { sumsSha256: string } {
  const sumsPath = join(snapshotDir, 'SHA256SUMS');
  const versionPath = join(snapshotDir, 'PLINTH_VERSION');
  if (!existsSync(sumsPath) || !existsSync(versionPath)) {
    throw new Error('snapshot is not intact');
  }

  const sumsBytes = readFileSync(sumsPath);
  const sumsText = sumsBytes.toString('utf8');
  if (!sumsText.endsWith('\n') || sumsText === '\n') {
    throw new Error('snapshot is not intact');
  }

  const lines = sumsText.slice(0, -1).split('\n');
  const listedPaths: string[] = [];

  for (const line of lines) {
    const match = SUMS_LINE_RE.exec(line);
    if (match === null) {
      throw new Error('snapshot is not intact');
    }
    const expectedHash = match[1];
    const relPath = match[2];
    if (expectedHash === undefined || relPath === undefined || !isSafeRelPath(relPath)) {
      throw new Error('snapshot is not intact');
    }
    const targetPath = join(snapshotDir, relPath);
    if (!existsSync(targetPath)) {
      throw new Error('snapshot is not intact');
    }
    const actualHash = sha256Hex(readFileSync(targetPath));
    if (actualHash !== expectedHash) {
      throw new Error('snapshot is not intact');
    }
    listedPaths.push(relPath);
  }

  const actualFiles = listFilesRelative(snapshotDir)
    .filter((rel) => rel !== 'SHA256SUMS')
    .sort();
  const sortedListed = [...listedPaths].sort();
  if (actualFiles.length !== sortedListed.length) {
    throw new Error('snapshot is not intact');
  }
  for (let i = 0; i < actualFiles.length; i++) {
    if (actualFiles[i] !== sortedListed[i]) {
      throw new Error('snapshot is not intact');
    }
  }

  return { sumsSha256: sha256Hex(sumsBytes) };
}

function readKeyValueFile(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      map.set(line.slice(0, eqIdx), line.slice(eqIdx + 1));
    }
  }
  return map;
}

function ensureGitattributes(consumerRoot: string): void {
  const gitattrPath = join(consumerRoot, '.gitattributes');
  if (!existsSync(gitattrPath)) {
    writeFileSync(gitattrPath, `${GITATTR_LINE}\n`, 'utf8');
    return;
  }
  const existing = readFileSync(gitattrPath, 'utf8');
  const lines = existing.split(/\r?\n/);
  if (lines.some((line) => line === GITATTR_LINE)) {
    return;
  }
  const prefix = existing === '' || existing.endsWith('\n') ? existing : `${existing}\n`;
  writeFileSync(gitattrPath, `${prefix}${GITATTR_LINE}\n`, 'utf8');
}

export function vendorSnapshot(opts: VendorOptions): VendorResult {
  const { sumsSha256 } = verifySnapshotDir(opts.snapshotDir);

  if (!existsSync(join(opts.consumerRoot, 'package.json'))) {
    throw new Error('not a consumer repo: package.json missing');
  }

  const versionMap = readKeyValueFile(readFileSync(join(opts.snapshotDir, 'PLINTH_VERSION'), 'utf8'));
  const version = versionMap.get('version');
  const tag = versionMap.get('tag');
  const commit = versionMap.get('commit');
  if (
    version === undefined ||
    version === '' ||
    tag === undefined ||
    tag === '' ||
    commit === undefined ||
    commit === ''
  ) {
    throw new Error('snapshot is not intact');
  }

  const tarballName = `plinth-kit-${version}.tgz`;
  const tarballPath = join(opts.snapshotDir, tarballName);
  if (!existsSync(tarballPath)) {
    throw new Error('snapshot is not intact');
  }
  const tarballSha256 = sha256Hex(readFileSync(tarballPath));

  const vendorDir = join(opts.consumerRoot, 'vendor', 'plinth');
  rmSync(vendorDir, { recursive: true, force: true });
  mkdirSync(join(opts.consumerRoot, 'vendor'), { recursive: true });
  cpSync(opts.snapshotDir, vendorDir, { recursive: true });

  const pinText = [
    '# Plinth snapshot pin. Written by the Plinth vendor tool. Do not edit by hand.',
    `version=${version}`,
    `tag=${tag}`,
    `commit=${commit}`,
    `sums_sha256=${sumsSha256}`,
    `tarball=${tarballName}`,
    `tarball_sha256=${tarballSha256}`,
    '',
  ].join('\n');
  writeFileSync(join(opts.consumerRoot, 'plinth.pin'), pinText, 'utf8');

  ensureGitattributes(opts.consumerRoot);

  return { pinText };
}

function parseCliArgs(argv: readonly string[]): { snapshotDir: string; consumerRoot: string } | null {
  let snapshotDir = '';
  let consumerRoot = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--snapshot') {
      const next = argv[i + 1];
      if (next === undefined || next === '') {
        return null;
      }
      snapshotDir = next;
      i++;
    } else if (arg === '--to') {
      const next = argv[i + 1];
      if (next === undefined || next === '') {
        return null;
      }
      consumerRoot = next;
      i++;
    } else {
      return null;
    }
  }

  if (snapshotDir === '' || consumerRoot === '') {
    return null;
  }
  return { snapshotDir, consumerRoot };
}

function runCli(): void {
  const parsed = parseCliArgs(process.argv.slice(2));
  if (parsed === null) {
    process.stderr.write('usage: vendor --snapshot <dir> --to <consumer repo>\n');
    process.exitCode = 2;
    return;
  }

  const { pinText } = vendorSnapshot({
    snapshotDir: parsed.snapshotDir,
    consumerRoot: parsed.consumerRoot,
  });
  const version = readKeyValueFile(pinText).get('version') ?? '';
  const destDisplay = join(parsed.consumerRoot, 'vendor', 'plinth').replaceAll('\\', '/');
  process.stdout.write(
    `vendored plinth ${version} into ${destDisplay}; next: npm install --save-exact ./vendor/plinth/plinth-kit-${version}.tgz\n`,
  );
}

if (process.argv[1]?.endsWith('vendor.js')) {
  try {
    runCli();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
