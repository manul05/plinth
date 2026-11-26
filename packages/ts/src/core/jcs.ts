import { PlinthError } from '../errors.js';
import { hexEncode, sha256Bytes, utf8Encode } from './bytes.js';
import { MAX_DEPTH } from './json.js';

export type Digest = `sha256:${string}`;

export const GENESIS_DIGEST: Digest = `sha256:${'0'.repeat(64)}`;

function canonicalizeValue(v: unknown, depth: number): string {
  if (depth > MAX_DEPTH) {
    throw new PlinthError('PK_JSON_TOO_DEEP');
  }
  if (v === null) {
    throw new PlinthError('PK_JCS_NULL');
  }
  if (typeof v === 'boolean') {
    return v ? 'true' : 'false';
  }
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) {
      throw new PlinthError('PK_JCS_NON_INTEGER');
    }
    if (!Number.isSafeInteger(v)) {
      throw new PlinthError('PK_JCS_INT_RANGE');
    }
    return v === 0 ? '0' : String(v);
  }
  if (typeof v === 'string') {
    if (!v.isWellFormed()) {
      throw new PlinthError('PK_JCS_LONE_SURROGATE');
    }
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) {
    const items: string[] = [];
    for (let idx = 0; idx < v.length; idx++) {
      items.push(canonicalizeValue(v[idx], depth + 1));
    }
    return `[${items.join(',')}]`;
  }
  if (typeof v === 'object') {
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) {
      throw new PlinthError('PK_JCS_UNSUPPORTED_TYPE');
    }
    const keys = Object.keys(v).sort();
    const parts: string[] = [];
    for (const key of keys) {
      if (!key.isWellFormed()) {
        throw new PlinthError('PK_JCS_LONE_SURROGATE');
      }
      const val = Object.getOwnPropertyDescriptor(v, key)?.value;
      parts.push(`${JSON.stringify(key)}:${canonicalizeValue(val, depth + 1)}`);
    }
    return `{${parts.join(',')}}`;
  }
  throw new PlinthError('PK_JCS_UNSUPPORTED_TYPE');
}

export function canonicalize(value: unknown): string {
  return canonicalizeValue(value, 1);
}

export function digest(value: unknown): Digest {
  return `sha256:${hexEncode(sha256Bytes(utf8Encode(canonicalize(value))))}`;
}

export function digestBytes(bytes: Uint8Array): Digest {
  return `sha256:${hexEncode(sha256Bytes(bytes))}`;
}
