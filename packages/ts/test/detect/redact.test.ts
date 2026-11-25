import { describe, expect, it } from 'vitest';
import { digest, hexDecode, loadPack, MAX_SCAN_INPUT, PlinthError, redact, scan } from '../../src/index.js';
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

      const findings =
        vec.op === 'scan'
          ? scan(text, packs, secret === undefined ? { date } : { date, installationSecret: secret })
          : redact(text, packs, { date, installationSecret: secret ?? new Uint8Array(32) }).findings;
      const serialized = JSON.stringify(findings);

      for (const f of findings) {
        if (f.kind === 'secret' || f.kind === 'pii') {
          const matched = text.slice(f.start, f.end);
          expect(matched.length).toBeGreaterThan(0);
          expect(serialized, `${vec.id} echoed matched substring`).not.toContain(matched);
        }
      }
      for (const part of parts) {
        if (part.length >= 16) {
          expect(serialized, `${vec.id} echoed >=16-char part`).not.toContain(part);
        }
      }
      expect(serialized, `${vec.id} echoed Aadhaar`).not.toContain('2949 1013 6515');
    }

    // Also verify every secret/pii match test across all built-in packs never echoes its matched substring (R2-07)
    for (const packId of Object.keys(BUILTIN_PACKS).sort() as BuiltinPackId[]) {
      const compiled = BUILTIN_PACKS[packId];
      const loaded = loadPack(compiled);
      for (const tc of compiled.tests.tests) {
        if (tc.expect !== 'match') continue;
        const candidates = compiled.rules.rules.filter((r) => r.id === tc.rule_id && r.status !== 'withdrawn');
        candidates.sort((a, b) => b.rev - a.rev);
        const rule = candidates[0] ?? compiled.rules.rules.find((r) => r.id === tc.rule_id);
        if (rule === undefined) continue;
        const text = tc.input_parts.join('');
        const findings = scan(text, [loaded], { date: rule.effective_from });
        expect(
          findings.some((f) => f.rule_id === tc.rule_id),
          tc.rule_id,
        ).toBe(true);
        const serialized = JSON.stringify(findings);
        for (const f of findings) {
          if (f.kind === 'secret' || f.kind === 'pii') {
            expect(serialized, `${tc.rule_id} echoed matched substring`).not.toContain(text.slice(f.start, f.end));
          }
        }
      }
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

  it('throws PK_DETECT_UNKNOWN_VALIDATOR for unsupported PII validator (R2-08)', () => {
    const customPack = structuredClone(BUILTIN_PACKS['pk.pii.india']);
    const aadhaar = customPack.rules.rules.find((r) => r.id === 'pk.pii.in.aadhaar');
    if (!aadhaar || !('validator' in aadhaar.body)) {
      throw new Error('missing pk.pii.in.aadhaar rule');
    }
    (aadhaar.body as unknown as Record<string, unknown>).validator = 'nonexistent_validator';
    const rulesEntry = customPack.manifest.files.find((f) => f.path === 'rules.json');
    if (rulesEntry !== undefined) {
      rulesEntry.sha256 = digest(customPack.rules);
    }
    const loaded = loadPack(customPack);
    try {
      scan('customer 2949 1013 6515', [loaded], { date: aadhaar.effective_from });
      expect.unreachable('Expected PlinthError(PK_DETECT_UNKNOWN_VALIDATOR)');
    } catch (err) {
      expect(err).toBeInstanceOf(PlinthError);
      expect((err as PlinthError).code).toBe('PK_DETECT_UNKNOWN_VALIDATOR');
    }
  });

  it('scan rejects an installationSecret shorter than 32 bytes when supplied (R2-10)', () => {
    const packs = [loadPack(BUILTIN_PACKS['pk.secrets.global'])];
    try {
      scan('hello', packs, { date: '2026-11-01', installationSecret: new Uint8Array(31) });
      expect.unreachable('Expected PlinthError(PK_DETECT_SECRET_REQUIRED)');
    } catch (err) {
      expect(err).toBeInstanceOf(PlinthError);
      expect((err as PlinthError).code).toBe('PK_DETECT_SECRET_REQUIRED');
    }
  });
});
