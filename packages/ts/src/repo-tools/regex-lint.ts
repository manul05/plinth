import safeRegex from 'safe-regex2';
import { PlinthError } from '../errors.js';

const ALLOWED_FLAGS = new Set(['i', 'm', 's']);
const ALLOWED_ESCAPES = new Set([
  'b',
  'n',
  'r',
  't',
  '\\',
  '.',
  '-',
  '/',
  '[',
  ']',
  '(',
  ')',
  '{',
  '}',
  '*',
  '+',
  '?',
  '|',
  '^',
  '$',
]);
const HEX2_RE = /^[0-9A-Fa-f]{2}$/;

function checkFlags(flags: string): void {
  const seen = new Set<string>();
  for (const ch of flags) {
    if (!ALLOWED_FLAGS.has(ch) || seen.has(ch)) {
      throw new PlinthError('PK_RULEPACK_REGEX_DIALECT', flags);
    }
    seen.add(ch);
  }
}

function scanPattern(pattern: string): void {
  let inCharClass = false;
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '\\') {
      const next = pattern[i + 1];
      if (next === undefined) {
        break;
      }
      if (next === 'x') {
        const hex = pattern.slice(i + 2, i + 4);
        if (!HEX2_RE.test(hex)) {
          throw new PlinthError('PK_RULEPACK_REGEX_DIALECT', pattern);
        }
        i += 4;
        continue;
      }
      if (!ALLOWED_ESCAPES.has(next)) {
        throw new PlinthError('PK_RULEPACK_REGEX_DIALECT', pattern);
      }
      i += 2;
      continue;
    }

    if (inCharClass) {
      if (ch === ']') {
        inCharClass = false;
      }
    } else if (ch === '[') {
      inCharClass = true;
    } else if (ch === '(' && pattern[i + 1] === '?' && pattern[i + 2] !== ':') {
      throw new PlinthError('PK_RULEPACK_REGEX_DIALECT', pattern);
    }
    i += 1;
  }
}

export function lintRegex(pattern: string, flags: string): void {
  checkFlags(flags);
  scanPattern(pattern);

  try {
    new RegExp(pattern, `dgu${flags}`);
  } catch {
    throw new PlinthError('PK_RULEPACK_REGEX_INVALID', pattern);
  }

  if (!safeRegex(pattern)) {
    throw new PlinthError('PK_RULEPACK_REGEX_UNSAFE', pattern);
  }
}
