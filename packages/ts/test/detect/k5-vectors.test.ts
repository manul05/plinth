import { describe, expect, it } from 'vitest';
import {
  gstinValid,
  hexDecode,
  type LoadedPack,
  loadPack,
  maskSecret,
  PlinthError,
  redact,
  scan,
  upiHandleValid,
  verhoeffValid,
} from '../../src/index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../../src/packs/index.js';
import { loadVectors } from '../vectors.js';

function expectPlinthError(fn: () => unknown, expectedCode: string): void {
  try {
    fn();
    expect.unreachable(`Expected PlinthError(${expectedCode})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(expectedCode);
  }
}

function resolveText(input: Record<string, unknown>): string {
  if (Array.isArray(input.text_parts)) {
    return (input.text_parts as string[]).join('');
  }
  const repeat = input.text_repeat as { unit: string; times: number } | undefined;
  if (repeat !== undefined) {
    return repeat.unit.repeat(repeat.times);
  }
  throw new Error('Vector missing text_parts or text_repeat');
}

function resolvePacks(input: Record<string, unknown>): LoadedPack[] {
  const ids = input.packs as BuiltinPackId[];
  return ids.map((id) => loadPack(BUILTIN_PACKS[id]));
}

describe('k5 scan', () => {
  for (const vec of loadVectors('k5', 'scan')) {
    it(vec.id, () => {
      const text = resolveText(vec.input);
      const packs = resolvePacks(vec.input);
      const date = vec.input.date as string;
      const secret =
        typeof vec.input.installation_secret_hex === 'string'
          ? hexDecode(vec.input.installation_secret_hex)
          : undefined;
      const opts = secret === undefined ? { date } : { date, installationSecret: secret };
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => scan(text, packs, opts), vec.expect.error);
      } else {
        expect({ findings: scan(text, packs, opts) }).toEqual(vec.expect);
      }
    });
  }
});

describe('k5 redact', () => {
  for (const vec of loadVectors('k5', 'redact')) {
    it(vec.id, () => {
      const text = resolveText(vec.input);
      const packs = resolvePacks(vec.input);
      const date = vec.input.date as string;
      const secret =
        typeof vec.input.installation_secret_hex === 'string'
          ? hexDecode(vec.input.installation_secret_hex)
          : new Uint8Array(0);
      if (typeof vec.expect.error === 'string') {
        expectPlinthError(() => redact(text, packs, { date, installationSecret: secret }), vec.expect.error);
      } else {
        expect(redact(text, packs, { date, installationSecret: secret })).toEqual(vec.expect);
      }
    });
  }
});

describe('k5 validator', () => {
  for (const vec of loadVectors('k5', 'validator')) {
    it(vec.id, () => {
      const name = vec.input.name as string;
      const value = vec.input.value as string;
      let valid: boolean;
      if (name === 'verhoeff') {
        valid = verhoeffValid(value);
      } else if (name === 'gstin') {
        valid = gstinValid(value);
      } else if (name === 'upi_handle') {
        valid = upiHandleValid(value, vec.input.handles as readonly string[]);
      } else {
        throw new Error(`Unknown validator: ${name}`);
      }
      expect({ valid }).toEqual(vec.expect);
    });
  }
});

describe('k5 maskSecret', () => {
  for (const vec of loadVectors('k5', 'maskSecret')) {
    it(vec.id, () => {
      const values = vec.input.values as string[];
      expect({ masked: values.map(maskSecret) }).toEqual(vec.expect);
    });
  }
});
