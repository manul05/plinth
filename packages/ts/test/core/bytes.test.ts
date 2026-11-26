import { describe, expect, it } from 'vitest';
import {
  b64urlDecode,
  b64urlEncode,
  hexDecode,
  hexEncode,
  PlinthError,
  sha256Bytes,
  utf8Encode,
} from '../../src/index.js';

function expectEncodingInvalid(fn: () => unknown): void {
  try {
    fn();
    expect.unreachable('Expected PlinthError(PK_ENCODING_INVALID)');
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe('PK_ENCODING_INVALID');
  }
}

describe('bytes', () => {
  it('base64url encode and strict decode', () => {
    expect(b64urlEncode(Uint8Array.of(0xfb, 0xff))).toBe('-_8');
    expect(Array.from(b64urlDecode('-_8'))).toEqual([251, 255]);
    expect(b64urlDecode('')).toHaveLength(0);

    expectEncodingInvalid(() => b64urlDecode('-_8='));
    expectEncodingInvalid(() => b64urlDecode('+/8'));
    expectEncodingInvalid(() => b64urlDecode('a b'));
    expectEncodingInvalid(() => b64urlDecode('A'));
  });

  it('hex encode and strict decode', () => {
    expect(hexEncode(Uint8Array.of(0, 255))).toBe('00ff');
    expect(Array.from(hexDecode('00FF'))).toEqual([0, 255]);
    expect(hexDecode('')).toHaveLength(0);

    expectEncodingInvalid(() => hexDecode('0'));
    expectEncodingInvalid(() => hexDecode('zz'));
  });

  it('utf8Encode and sha256Bytes', () => {
    expect(hexEncode(sha256Bytes(utf8Encode('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
