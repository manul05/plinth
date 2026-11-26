import { describe, expect, it } from 'vitest';
import { b64urlDecode, isTimestamp, newNonce, newUuidV7, timestampFromMs } from '../../src/index.js';

const UUIDV7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('ids and timestamps', () => {
  it('newUuidV7 formats 48-bit timestamp and is unique', () => {
    const id = newUuidV7(1793955600000);
    expect(id).toMatch(UUIDV7_RE);
    expect(id.slice(0, 13)).toBe('01a1b016-1680');

    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(newUuidV7());
    }
    expect(seen.size).toBe(1000);
  });

  it('newNonce generates 16 random bytes encoded as 22 base64url chars', () => {
    const nonce = newNonce();
    expect(nonce).toHaveLength(22);
    expect(b64urlDecode(nonce)).toHaveLength(16);
  });

  it('isTimestamp and timestampFromMs validate UTC millisecond ISO format', () => {
    expect(isTimestamp('2026-11-02T09:00:00.000Z')).toBe(true);
    expect(isTimestamp('2026-11-02T09:00:00Z')).toBe(false);
    expect(isTimestamp('2026-13-02T09:00:00.000Z')).toBe(false);
    expect(isTimestamp('2026-02-30T09:00:00.000Z')).toBe(false);
    expect(timestampFromMs(0)).toBe('1970-01-01T00:00:00.000Z');
  });
});
