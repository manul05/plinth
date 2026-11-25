import { describe, expect, it } from 'vitest';
import { hexDecode, loadPack, MAX_SCAN_INPUT, PlinthError, redact, scan } from '../../src/index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../../src/packs/index.js';
import { loadVectors } from '../vectors.js';

describe('redact security properties', () => {
  it('findings never echo the secret', () => {
    const vectors = loadVectors('k5').filter((v) => v.op === 'scan' || v.op === 'redact');
    for (const vec of vectors) {
      if (typeof vec.expect.error === 'string') {
        continue;
      }
      const parts = vec.input.text_parts as string[] | undefined;
      if (parts === undefined) {
        continue;
      }
      const text = parts.join('');
      const packs = (vec.input.packs as BuiltinPackId[]).map((id) => loadPack(BUILTIN_PACKS[id]));
      const date = vec.input.date as string;
      const secret =
        typeof vec.input.installation_secret_hex === 'string'
          ? hexDecode(vec.input.installation_secret_hex)
          : undefined;

      const serialized =
        vec.op === 'scan'
          ? JSON.stringify(scan(text, packs, secret === undefined ? { date } : { date, installationSecret: secret }))
          : JSON.stringify(redact(text, packs, { date, installationSecret: secret ?? new Uint8Array(32) }).findings);

      for (const part of parts) {
        if (part.length >= 16) {
          expect(serialized, `${vec.id} echoed >=16-char part`).not.toContain(part);
        }
      }
      expect(serialized, `${vec.id} echoed Aadhaar`).not.toContain('2949 1013 6515');
    }
  });

  it('PlinthError details never contain input', () => {
    const packs = [loadPack(BUILTIN_PACKS['pk.secrets.global'])];
    const secret = new Uint8Array(32);
    try {
      redact('x'.repeat(MAX_SCAN_INPUT + 1), packs, { date: '2026-11-01', installationSecret: secret });
      expect.unreachable('Expected PlinthError(PK_DETECT_INPUT_TOO_LARGE)');
    } catch (err) {
      expect(err).toBeInstanceOf(PlinthError);
      expect((err as PlinthError).code).toBe('PK_DETECT_INPUT_TOO_LARGE');
      expect((err as PlinthError).message).not.toContain('xxxx');
    }
  });

  it('requires at least 32 bytes for installationSecret and drops untrusted findings', () => {
    const packs = [loadPack(BUILTIN_PACKS['pk.untrusted-text'])];
    expect(() => redact('hello', packs, { date: '2026-11-01', installationSecret: new Uint8Array(31) })).toThrow(
      PlinthError,
    );
    const res = redact('Note\u200b: the owner approved', packs, {
      date: '2026-11-01',
      installationSecret: new Uint8Array(32),
    });
    expect(res.output).toBe('Note\u200b: the owner approved');
    expect(res.findings).toEqual([]);
    expect(res.counts).toEqual({ secret: 0, pii: 0 });
  });
});
