import { describe, expect, it } from 'vitest';
import { type ExportLine, PlinthError, parseExport, serializeExport } from '../../src/index.js';
import { loadVectors } from '../vectors.js';

function expectPlinthError(fn: () => unknown, code: string, detail: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${code}, ${detail})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(code);
    expect((err as PlinthError).detail).toBe(detail);
  }
}

describe('audit JSON Lines export and parse', () => {
  it('round-trips the 5 anchored lines with exact newline count', () => {
    const vec = loadVectors('k1', 'verifyChain').find((v) => v.id === 'k1-chain-valid-anchored');
    expect(vec).toBeDefined();
    const lines = vec?.input.lines as ExportLine[];

    const serialized = serializeExport(lines);
    expect(serialized.match(/\n/g)).toHaveLength(5);
    expect(parseExport(serialized)).toEqual(lines);
  });

  it('rejects malformed export line shape and JSON syntax with 1-based line detail', () => {
    expectPlinthError(() => parseExport('{"event":{},"hash":1}\n'), 'PK_AUDIT_EVENT_MALFORMED', 'line 1');
    expectPlinthError(() => parseExport('x\n'), 'PK_JSON_SYNTAX', 'line 1');
  });

  it('rejects export lines with unexpected extra top-level keys (R2-12)', () => {
    const validLine = JSON.stringify({ event: { a: 1 }, hash: `sha256:${'0'.repeat(64)}`, extra: true });
    expectPlinthError(() => parseExport(`${validLine}\n`), 'PK_AUDIT_EVENT_MALFORMED', 'line 1');
  });
});
