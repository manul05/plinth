import { b64urlEncode, hexEncode } from './bytes.js';

const TIMESTAMP_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/;

/**
 * Generates a UUIDv7 string with a 48-bit big-endian Unix millisecond prefix and RFC 9562 variant bits.
 */
export function newUuidV7(nowMs: number = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const ms = BigInt(Math.floor(nowMs));
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n) & 0xffn);
  bytes[5] = Number(ms & 0xffn);
  bytes[6] = 0x70 | ((bytes[6] ?? 0) & 0x0f);
  bytes[8] = 0x80 | ((bytes[8] ?? 0) & 0x3f);
  const hex = hexEncode(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generates 16 random bytes encoded as an unpadded 22-character base64url string.
 */
export function newNonce(): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * Returns true if text is a valid strict UTC millisecond ISO-8601 timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`).
 */
export function isTimestamp(text: string): boolean {
  if (typeof text !== 'string' || !TIMESTAMP_RE.test(text)) {
    return false;
  }
  const ms = Date.parse(text);
  return !Number.isNaN(ms) && new Date(ms).toISOString() === text;
}

/**
 * Formats Unix epoch milliseconds as a strict UTC millisecond ISO-8601 timestamp.
 */
export function timestampFromMs(ms: number): string {
  return new Date(ms).toISOString();
}
