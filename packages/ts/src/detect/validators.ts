const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
] as const;

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 7, 8, 6, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
] as const;

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const GSTIN_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function verhoeffValid(value: string): boolean {
  const digits = value.replace(/[ -]/g, '');
  if (!/^[0-9]+$/.test(digits)) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    const dRow = VERHOEFF_D[c];
    const pRow = VERHOEFF_P[i % 8];
    const pVal = pRow?.[digit];
    const next = pVal === undefined ? undefined : dRow?.[pVal];
    if (next === undefined) {
      return false;
    }
    c = next;
  }
  return c === 0;
}

export function gstinValid(value: string): boolean {
  if (!GSTIN_RE.test(value)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const ch = value[i];
    if (ch === undefined) {
      return false;
    }
    const v = GSTIN_ALPHABET.indexOf(ch);
    const factor = i % 2 === 0 ? 1 : 2;
    const prod = v * factor;
    sum += Math.floor(prod / 36) + (prod % 36);
  }
  const check = GSTIN_ALPHABET[(36 - (sum % 36)) % 36];
  return value[14] === check;
}

export function upiHandleValid(value: string, handles: readonly string[]): boolean {
  const at = value.lastIndexOf('@');
  if (at === -1) {
    return false;
  }
  const handle = value.slice(at + 1).toLowerCase();
  return handles.includes(handle);
}
