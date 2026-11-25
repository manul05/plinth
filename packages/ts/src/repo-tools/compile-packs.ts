import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalize, digest } from '../core/index.js';
import { PlinthError } from '../errors.js';
import type { CompiledPack, PackKind, PackManifest, Rule, RulesFile, TestsFile } from '../rulepack/index.js';
import { lintRegex } from './regex-lint.js';
import { validateAgainst } from './schema.js';
import { yamlToValue } from './yaml-subset.js';

const SUPPORTED_KINDS = new Set<string>(['secret-detection', 'pii-detection', 'untrusted-text']);

interface PackSource {
  spec: 'pk-rulepack/1.0';
  id: string;
  kind: PackKind;
  version: string;
  released_at: string;
  tz: 'Asia/Kolkata' | 'UTC';
  licence: 'MIT';
  attribution: string[];
  sources: PackManifest['sources'];
  min_engine: 'pk-rulepack/1.0';
}

interface CompiledOutput {
  id: string;
  compiled: CompiledPack;
  packJson: string;
  rulesJson: string;
  testsJson: string;
}

function compareAscii(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function bodyMatchesKind(rule: Rule, kind: PackKind): boolean {
  if (kind === 'secret-detection') {
    return 'provider' in rule.body;
  }
  if (kind === 'pii-detection') {
    return 'pii_type' in rule.body;
  }
  return 'class' in rule.body;
}

function checkRuleVersionsAndOverlaps(rules: readonly Rule[]): void {
  const seenIdRev = new Set<string>();
  const activeByRuleId = new Map<string, Rule[]>();

  for (const rule of rules) {
    const key = `${rule.id}#${rule.rev}`;
    if (seenIdRev.has(key)) {
      throw new PlinthError('PK_RULEPACK_DUPLICATE_REV', `${rule.id}@${rule.rev}`);
    }
    seenIdRev.add(key);

    if (rule.status !== 'withdrawn') {
      const existing = activeByRuleId.get(rule.id) ?? [];
      const aStart = rule.effective_from;
      const aEnd = rule.effective_until ?? '9999-12-31';
      for (const prev of existing) {
        const bStart = prev.effective_from;
        const bEnd = prev.effective_until ?? '9999-12-31';
        if (aStart < bEnd && bStart < aEnd) {
          throw new PlinthError('PK_RULEPACK_OVERLAP', rule.id);
        }
      }
      existing.push(rule);
      activeByRuleId.set(rule.id, existing);
    }
  }
}

function checkRuleBodiesAndTests(rules: readonly Rule[], tests: TestsFile['tests']): void {
  const ruleIds = new Set(rules.map((rule) => rule.id));

  for (const rule of rules) {
    const body = rule.body;
    if ('regex' in body && typeof body.regex === 'string') {
      lintRegex(body.regex, body.flags ?? '');
    }
    if ('allow' in body && Array.isArray(body.allow)) {
      for (const allowPattern of body.allow) {
        lintRegex(allowPattern, '');
      }
    }
    if ('pair_with' in body && body.pair_with !== undefined) {
      for (const pairId of body.pair_with.rules) {
        if (!ruleIds.has(pairId)) {
          throw new PlinthError('PK_RULEPACK_UNKNOWN_PAIR_RULE', `${rule.id} -> ${pairId}`);
        }
      }
    }
  }

  const hasMatch = new Set<string>();
  const hasNoMatch = new Set<string>();
  for (const testCase of tests) {
    if (testCase.expect === 'match') {
      hasMatch.add(testCase.rule_id);
    } else {
      hasNoMatch.add(testCase.rule_id);
    }
  }
  for (const ruleId of ruleIds) {
    if (!hasMatch.has(ruleId) || !hasNoMatch.has(ruleId)) {
      throw new PlinthError('PK_RULEPACK_TESTS_MISSING', ruleId);
    }
  }
}

function compileOnePack(rulesDir: string, packDirName: string): CompiledOutput {
  const dir = join(rulesDir, packDirName);
  const packRel = `${packDirName}/pack.yaml`;
  const rulesRel = `${packDirName}/rules.yaml`;
  const testsRel = `${packDirName}/tests.yaml`;

  const packRaw = yamlToValue(readFileSync(join(dir, 'pack.yaml'), 'utf8'), packRel);
  const rulesRaw = yamlToValue(readFileSync(join(dir, 'rules.yaml'), 'utf8'), rulesRel);
  const testsRaw = yamlToValue(readFileSync(join(dir, 'tests.yaml'), 'utf8'), testsRel);

  const packErr = validateAgainst('pk-rulepack.pack-source.schema.json', packRaw);
  if (packErr !== null) {
    throw new PlinthError('PK_RULEPACK_SCHEMA', `${packRel}: ${packErr}`);
  }
  const rulesErr = validateAgainst('pk-rulepack.rules.schema.json', rulesRaw);
  if (rulesErr !== null) {
    throw new PlinthError('PK_RULEPACK_SCHEMA', `${rulesRel}: ${rulesErr}`);
  }
  const testsErr = validateAgainst('pk-rulepack.tests.schema.json', testsRaw);
  if (testsErr !== null) {
    throw new PlinthError('PK_RULEPACK_SCHEMA', `${testsRel}: ${testsErr}`);
  }

  const packSrc = packRaw as PackSource;
  const rulesFile = rulesRaw as RulesFile;
  const testsFile = testsRaw as TestsFile;

  if (!SUPPORTED_KINDS.has(packSrc.kind)) {
    throw new PlinthError('PK_RULEPACK_KIND_UNSUPPORTED', packSrc.kind);
  }
  if (rulesFile.pack_id !== packSrc.id || testsFile.pack_id !== packSrc.id) {
    throw new PlinthError('PK_RULEPACK_SCHEMA', `${packDirName}: pack_id mismatch`);
  }
  for (const rule of rulesFile.rules) {
    if (!bodyMatchesKind(rule, packSrc.kind)) {
      throw new PlinthError('PK_RULEPACK_SCHEMA', `${rulesRel}: ${rule.id} body mismatches pack kind`);
    }
  }

  checkRuleVersionsAndOverlaps(rulesFile.rules);
  checkRuleBodiesAndTests(rulesFile.rules, testsFile.tests);

  const rulesJson = canonicalize(rulesFile);
  const testsJson = canonicalize(testsFile);
  const manifest: PackManifest = {
    ...packSrc,
    files: [
      { path: 'rules.json', sha256: digest(rulesFile) },
      { path: 'tests.json', sha256: digest(testsFile) },
    ],
  };
  const manifestErr = validateAgainst('pk-rulepack.manifest.schema.json', manifest);
  if (manifestErr !== null) {
    throw new PlinthError('PK_RULEPACK_SCHEMA', `${packDirName}/pack.json: ${manifestErr}`);
  }

  const compiled: CompiledPack = {
    manifest,
    rules: rulesFile,
    tests: testsFile,
  };

  return {
    id: packSrc.id,
    compiled,
    packJson: canonicalize(manifest),
    rulesJson,
    testsJson,
  };
}

function buildBuiltinTs(outputs: readonly CompiledOutput[]): string {
  const sorted = [...outputs].sort((a, b) => compareAscii(a.id, b.id));
  const lines = [
    '// GENERATED by packages/ts/src/repo-tools/compile-packs.ts from rules/. Do not edit.',
    "import type { CompiledPack } from '../rulepack/index.js';",
    '',
    'export const BUILTIN_PACKS = {',
    ...sorted.map((entry) => `  '${entry.id}': ${canonicalize(entry.compiled)} as CompiledPack,`),
    '} as const;',
    '',
  ];
  return lines.join('\n');
}

function readUtf8IfExists(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

export function compilePacks(opts: {
  rulesDir: string;
  packsDir: string;
  builtinPath: string;
  check: boolean;
  runTests: boolean;
}): { packs: number; rules: number; tests: number; differing: string[] } {
  if (opts.runTests) {
    throw new Error('not implemented');
  }

  const packDirs = readdirSync(opts.rulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(compareAscii);

  const outputs = packDirs.map((dir) => compileOnePack(opts.rulesDir, dir));
  const builtinContent = buildBuiltinTs(outputs);
  const differing: string[] = [];

  if (opts.check) {
    for (const out of outputs) {
      const files: [string, string][] = [
        ['pack.json', out.packJson],
        ['rules.json', out.rulesJson],
        ['tests.json', out.testsJson],
      ];
      for (const [name, expected] of files) {
        const current = readUtf8IfExists(join(opts.packsDir, out.id, name));
        if (current !== expected) {
          differing.push(`${out.id}/${name}`);
        }
      }
    }
    if (readUtf8IfExists(opts.builtinPath) !== builtinContent) {
      differing.push(relative(dirname(opts.packsDir), opts.builtinPath).replaceAll('\\', '/'));
    }
    differing.sort(compareAscii);
  } else {
    for (const out of outputs) {
      const packOutDir = join(opts.packsDir, out.id);
      mkdirSync(packOutDir, { recursive: true });
      writeFileSync(join(packOutDir, 'pack.json'), out.packJson, 'utf8');
      writeFileSync(join(packOutDir, 'rules.json'), out.rulesJson, 'utf8');
      writeFileSync(join(packOutDir, 'tests.json'), out.testsJson, 'utf8');
    }
    mkdirSync(dirname(opts.builtinPath), { recursive: true });
    writeFileSync(opts.builtinPath, builtinContent, 'utf8');
  }

  const rules = outputs.reduce((acc, item) => acc + item.compiled.rules.rules.length, 0);
  const tests = outputs.reduce((acc, item) => acc + item.compiled.tests.tests.length, 0);

  return {
    packs: outputs.length,
    rules,
    tests,
    differing,
  };
}

function runCli(): void {
  const check = process.argv.includes('--check');
  const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
  const result = compilePacks({
    rulesDir: join(repoRoot, 'rules'),
    packsDir: join(repoRoot, 'packs'),
    builtinPath: join(repoRoot, 'packages', 'ts', 'src', 'packs', 'builtin.ts'),
    check,
    runTests: false,
  });

  if (check) {
    if (result.differing.length > 0) {
      process.stderr.write(`packs: out of date: ${result.differing.join(', ')}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write('packs: up to date\n');
    return;
  }

  process.stdout.write(`packs: ${result.packs} compiled, ${result.rules} rules, ${result.tests} tests\n`);
}

if (process.argv[1]?.endsWith('compile-packs.js')) {
  try {
    runCli();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
