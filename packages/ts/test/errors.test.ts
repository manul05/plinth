import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ERROR_MESSAGES, PlinthError } from '../src/index.js';
import { REPO_ROOT } from './vectors.js';

describe('errors', () => {
  it('ERROR_MESSAGES equals contracts/errors.json', () => {
    const doc = JSON.parse(readFileSync(join(REPO_ROOT, 'contracts', 'errors.json'), 'utf8')) as {
      errors: Array<{ code: string; message: string }>;
    };
    const expected: Record<string, string> = {};
    for (const entry of doc.errors) {
      expected[entry.code] = entry.message;
    }

    expect(Object.keys(ERROR_MESSAGES)).toHaveLength(97);
    expect(Object.keys(ERROR_MESSAGES)).toEqual(Object.keys(expected));
    expect(ERROR_MESSAGES).toEqual(expected);
  });

  it('message format', () => {
    const err = new PlinthError('PK_JCS_NULL');
    expect(err.message).toBe('PK_JCS_NULL: null is not allowed; omit the member instead.');
    expect(err.name).toBe('PlinthError');
    expect(err.code).toBe('PK_JCS_NULL');
    expect(err.detail).toBeUndefined();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PlinthError);

    const detailed = new PlinthError('PK_JCS_NULL', 'a.b');
    expect(detailed.message).toBe('PK_JCS_NULL: null is not allowed; omit the member instead. (a.b)');
    expect(detailed.detail).toBe('a.b');
  });
});
