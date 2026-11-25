import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { maskSecret } from '../../src/index.js';
import { detectFileReport } from '../../src/repo-tools/detect-file.js';
import { VECTORS_DIR } from '../vectors.js';

describe('detectFileReport', () => {
  it('output never contains the secret', () => {
    const vec = JSON.parse(readFileSync(join(VECTORS_DIR, 'k5', 'k5-redact-razorpay-pair.json'), 'utf8')) as {
      input: { text_parts: string[]; date: string };
    };
    const parts = vec.input.text_parts;
    const text = parts.join('');
    const secretPart = parts[4];
    if (secretPart === undefined) {
      throw new Error('missing secret part in vector');
    }
    const lines = detectFileReport(text, vec.input.date);
    expect(lines).toEqual([
      'pk.secret.razorpay.key_id_live rev 1 secret 16-39 rzp_\u2026iW',
      `pk.secret.razorpay.key_secret rev 1 secret 60-84 ${maskSecret(secretPart)}`,
    ]);
    for (const line of lines) {
      for (const part of parts) {
        if (part.length >= 14) {
          expect(line).not.toContain(part);
        }
      }
    }
  });

  it('returns ["no findings"] on clean input', () => {
    expect(detectFileReport('hello', '2026-11-01')).toEqual(['no findings']);
  });
});
