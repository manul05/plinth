import { readFileSync } from 'node:fs';
import { loadPack, localDate, scan, timestampFromMs } from '../index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../packs/index.js';

const ALL_PACKS = (Object.keys(BUILTIN_PACKS).sort() as BuiltinPackId[]).map((id) => loadPack(BUILTIN_PACKS[id]));

export function detectFileReport(text: string, date: string): string[] {
  const findings = scan(text, ALL_PACKS, { date });
  if (findings.length === 0) {
    return ['no findings'];
  }
  return findings.map((f) => `${f.rule_id} rev ${f.rev} ${f.kind} ${f.start}-${f.end} ${f.masked_preview}`);
}

function runCli(): void {
  const filePath = process.argv[2];
  if (filePath === undefined || filePath === '') {
    process.stderr.write('usage: detect-file <path>\n');
    process.exitCode = 2;
    return;
  }
  const text = readFileSync(filePath, 'utf8');
  const date = localDate(timestampFromMs(Date.now()), 'Asia/Kolkata');
  for (const line of detectFileReport(text, date)) {
    process.stdout.write(`${line}\n`);
  }
}

if (process.argv[1]?.endsWith('detect-file.js')) {
  try {
    runCli();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
