import { describe, expect, it } from 'vitest';
import { MAX_DEPTH } from '../../src/core/json.js';
import { PlinthError, parseJson } from '../../src/index.js';

function expectJsonError(text: string, expectedCode: string): void {
  try {
    parseJson(text);
    expect.unreachable(`Expected PlinthError(${expectedCode})`);
  } catch (err) {
    expect(err).toBeInstanceOf(PlinthError);
    expect((err as PlinthError).code).toBe(expectedCode);
    expect((err as PlinthError).detail).toBeUndefined();
  }
}

describe('parseJson', () => {
  it('__proto__ becomes an own property', () => {
    const parsed = parseJson('{"__proto__":{"x":1}}') as Record<string, unknown>;
    expect(Object.hasOwn(parsed, '__proto__')).toBe(true);
    expect(Object.getOwnPropertyDescriptor(parsed, '__proto__')?.value).toEqual({ x: 1 });
    expect(({} as { x?: number }).x).toBeUndefined();
  });

  it('whitespace and nesting', () => {
    expect(parseJson(' { "a" : [ 1 , true ] } ')).toEqual({ a: [1, true] });
    expect(MAX_DEPTH).toBe(64);
  });

  it('rejects', () => {
    expectJsonError('{"a":1} x', 'PK_JSON_SYNTAX');
    expectJsonError('\uFEFF{}', 'PK_JSON_SYNTAX');
    expectJsonError('{"a":"\u0001"}', 'PK_JSON_SYNTAX');
    expectJsonError('{"a":"\\x"}', 'PK_JSON_SYNTAX');
    expectJsonError('{"a":1,"a":2}', 'PK_JCS_DUPLICATE_KEY');
    expectJsonError('{"a":null}', 'PK_JCS_NULL');
    expectJsonError('01', 'PK_JSON_SYNTAX');
    expectJsonError('1.0', 'PK_JCS_NON_INTEGER');
    expectJsonError('1e2', 'PK_JCS_NON_INTEGER');
    expect(parseJson('-0')).toBe(0);
    expect(Object.is(parseJson('-0'), 0)).toBe(true);
  });
});
