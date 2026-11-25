import { PlinthError } from '../errors.js';

export type Json = string | number | boolean | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export const MAX_DEPTH = 64;

const NUMBER_RE = /-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/y;
const HEX4_RE = /^[0-9a-fA-F]{4}$/;

export function parseJson(text: string): Json {
  if (typeof text !== 'string' || text.charCodeAt(0) === 0xfeff) {
    throw new PlinthError('PK_JSON_SYNTAX');
  }

  const len = text.length;
  let i = 0;

  function skipWs(): void {
    while (i < len) {
      const c = text.charCodeAt(i);
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) {
        i++;
      } else {
        break;
      }
    }
  }

  function readString(): string {
    i++; // consume opening '"'
    let out = '';
    let start = i;
    while (i < len) {
      const c = text.charCodeAt(i);
      if (c < 0x20) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      if (c === 0x22) {
        out += text.slice(start, i);
        i++;
        if (!out.isWellFormed()) {
          throw new PlinthError('PK_JCS_LONE_SURROGATE');
        }
        return out;
      }
      if (c === 0x5c) {
        out += text.slice(start, i);
        i++;
        if (i >= len) {
          throw new PlinthError('PK_JSON_SYNTAX');
        }
        const esc = text.charCodeAt(i++);
        switch (esc) {
          case 0x22:
            out += '"';
            break;
          case 0x5c:
            out += '\\';
            break;
          case 0x2f:
            out += '/';
            break;
          case 0x62:
            out += '\b';
            break;
          case 0x66:
            out += '\f';
            break;
          case 0x6e:
            out += '\n';
            break;
          case 0x72:
            out += '\r';
            break;
          case 0x74:
            out += '\t';
            break;
          case 0x75: {
            if (i + 4 > len) {
              throw new PlinthError('PK_JSON_SYNTAX');
            }
            const hex = text.slice(i, i + 4);
            if (!HEX4_RE.test(hex)) {
              throw new PlinthError('PK_JSON_SYNTAX');
            }
            out += String.fromCharCode(Number.parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            throw new PlinthError('PK_JSON_SYNTAX');
        }
        start = i;
        continue;
      }
      i++;
    }
    throw new PlinthError('PK_JSON_SYNTAX');
  }

  function readNumber(): number {
    NUMBER_RE.lastIndex = i;
    const match = NUMBER_RE.exec(text);
    if (!match) {
      throw new PlinthError('PK_JSON_SYNTAX');
    }
    i += match[0].length;
    if (match[2] !== undefined || match[3] !== undefined) {
      throw new PlinthError('PK_JCS_NON_INTEGER');
    }
    const v = Number(match[0]);
    if (!Number.isSafeInteger(v)) {
      throw new PlinthError('PK_JCS_INT_RANGE');
    }
    return v === 0 ? 0 : v;
  }

  function readArray(depth: number): Json[] {
    i++; // consume '['
    skipWs();
    const arr: Json[] = [];
    if (i < len && text.charCodeAt(i) === 0x5d) {
      i++;
      return arr;
    }
    while (true) {
      arr.push(readValue(depth + 1));
      skipWs();
      if (i >= len) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      const sep = text.charCodeAt(i++);
      if (sep === 0x5d) {
        return arr;
      }
      if (sep !== 0x2c) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      skipWs();
    }
  }

  function readObject(depth: number): JsonObject {
    i++; // consume '{'
    skipWs();
    const obj: JsonObject = {};
    if (i < len && text.charCodeAt(i) === 0x7d) {
      i++;
      return obj;
    }
    const seen = new Set<string>();
    while (true) {
      if (i >= len || text.charCodeAt(i) !== 0x22) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      const key = readString();
      if (seen.has(key)) {
        throw new PlinthError('PK_JCS_DUPLICATE_KEY');
      }
      seen.add(key);
      skipWs();
      if (i >= len || text.charCodeAt(i) !== 0x3a) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      i++;
      const val = readValue(depth + 1);
      Object.defineProperty(obj, key, {
        value: val,
        enumerable: true,
        writable: true,
        configurable: true,
      });
      skipWs();
      if (i >= len) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      const sep = text.charCodeAt(i++);
      if (sep === 0x7d) {
        return obj;
      }
      if (sep !== 0x2c) {
        throw new PlinthError('PK_JSON_SYNTAX');
      }
      skipWs();
    }
  }

  function readValue(depth: number): Json {
    if (depth > MAX_DEPTH) {
      throw new PlinthError('PK_JSON_TOO_DEEP');
    }
    skipWs();
    if (i >= len) {
      throw new PlinthError('PK_JSON_SYNTAX');
    }
    const ch = text.charCodeAt(i);
    if (ch === 0x7b) {
      return readObject(depth);
    }
    if (ch === 0x5b) {
      return readArray(depth);
    }
    if (ch === 0x22) {
      return readString();
    }
    if (ch === 0x74) {
      if (text.startsWith('true', i)) {
        i += 4;
        return true;
      }
      throw new PlinthError('PK_JSON_SYNTAX');
    }
    if (ch === 0x66) {
      if (text.startsWith('false', i)) {
        i += 5;
        return false;
      }
      throw new PlinthError('PK_JSON_SYNTAX');
    }
    if (ch === 0x6e) {
      if (text.startsWith('null', i)) {
        throw new PlinthError('PK_JCS_NULL');
      }
      throw new PlinthError('PK_JSON_SYNTAX');
    }
    if (ch === 0x2d || (ch >= 0x30 && ch <= 0x39)) {
      return readNumber();
    }
    throw new PlinthError('PK_JSON_SYNTAX');
  }

  const result = readValue(1);
  skipWs();
  if (i < len) {
    throw new PlinthError('PK_JSON_SYNTAX');
  }
  return result;
}
