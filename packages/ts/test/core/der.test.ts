import { describe, expect, it } from 'vitest';
import { derToP1363, hexEncode, PlinthError, p1363ToDer } from '../../src/index.js';

function expectEncodingInvalid(fn: () => unknown): void {
  try {
    fn();
    expect.unreachable('Expected PlinthError(PK_ENCODING_INVALID)');
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe('PK_ENCODING_INVALID');
  }
}

describe('der', () => {
  it('round-trips 64 bytes of 0x01', () => {
    const x = new Uint8Array(64).fill(0x01);
    expect(derToP1363(p1363ToDer(x))).toEqual(x);
  });

  it('round-trips 0x80 followed by 63 zero bytes', () => {
    const x = new Uint8Array(64);
    x[0] = 0x80;
    expect(derToP1363(p1363ToDer(x))).toEqual(x);
  });

  it('round-trips 63 zero bytes followed by 0x01 (r=0 encodes as 02 01 00)', () => {
    const x = new Uint8Array(64);
    x[63] = 0x01;
    const der = p1363ToDer(x);
    expect(hexEncode(der)).toBe('3006020100020101');
    expect(derToP1363(der)).toEqual(x);
  });

  it('rejects non-64-byte input in p1363ToDer', () => {
    expectEncodingInvalid(() => p1363ToDer(new Uint8Array(63)));
    expectEncodingInvalid(() => p1363ToDer(new Uint8Array(65)));
  });
});
