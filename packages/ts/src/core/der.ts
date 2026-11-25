import { PlinthError } from '../errors.js';

function encodeDerInt(part: Uint8Array): Uint8Array {
  let start = 0;
  while (start < part.length - 1 && part[start] === 0) {
    start++;
  }
  const trimmed = part.subarray(start);
  const first = trimmed[0] ?? 0;
  const needsPad = (first & 0x80) !== 0;
  const intLen = trimmed.length + (needsPad ? 1 : 0);
  const out = new Uint8Array(2 + intLen);
  out[0] = 0x02;
  out[1] = intLen;
  if (needsPad) {
    out[2] = 0x00;
    out.set(trimmed, 3);
  } else {
    out.set(trimmed, 2);
  }
  return out;
}

function readDerInt(der: Uint8Array, offset: number): { value: Uint8Array; nextOffset: number } {
  if (offset + 2 > der.length || der[offset] !== 0x02) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const len = der[offset + 1];
  if (len === undefined || len === 0 || len > 33) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const start = offset + 2;
  const end = start + len;
  if (end > der.length) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const first = der[start];
  if (first === undefined || (first & 0x80) !== 0) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  if (len > 1 && first === 0x00 && ((der[start + 1] ?? 0) & 0x80) === 0) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const strippedStart = first === 0x00 && len > 1 ? start + 1 : start;
  if (end - strippedStart > 32) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  return { value: der.subarray(strippedStart, end), nextOffset: end };
}

export function p1363ToDer(sig: Uint8Array): Uint8Array {
  if (!(sig instanceof Uint8Array) || sig.length !== 64) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const intR = encodeDerInt(sig.subarray(0, 32));
  const intS = encodeDerInt(sig.subarray(32, 64));
  const seqLen = intR.length + intS.length;
  const out = new Uint8Array(2 + seqLen);
  out[0] = 0x30;
  out[1] = seqLen;
  out.set(intR, 2);
  out.set(intS, 2 + intR.length);
  return out;
}

export function derToP1363(der: Uint8Array): Uint8Array {
  if (!(der instanceof Uint8Array) || der.length < 8 || der.length > 72) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  if (der[0] !== 0x30 || der[1] !== der.length - 2) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const r = readDerInt(der, 2);
  const s = readDerInt(der, r.nextOffset);
  if (s.nextOffset !== der.length) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  const out = new Uint8Array(64);
  out.set(r.value, 32 - r.value.length);
  out.set(s.value, 64 - s.value.length);
  return out;
}
