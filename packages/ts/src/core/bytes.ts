import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { base64urlnopad } from '@scure/base';
import { PlinthError } from '../errors.js';

const B64URL_RE = /^[A-Za-z0-9_-]*$/;
const HEX_RE = /^([0-9a-fA-F]{2})*$/;

export function b64urlEncode(bytes: Uint8Array): string {
  return base64urlnopad.encode(bytes);
}

export function b64urlDecode(text: string): Uint8Array {
  if (typeof text !== 'string' || !B64URL_RE.test(text)) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  try {
    return base64urlnopad.decode(text);
  } catch {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
}

export function hexEncode(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}

export function hexDecode(text: string): Uint8Array {
  if (typeof text !== 'string' || !HEX_RE.test(text)) {
    throw new PlinthError('PK_ENCODING_INVALID');
  }
  return hexToBytes(text.toLowerCase());
}

export function utf8Encode(text: string): Uint8Array {
  return utf8ToBytes(text);
}

export function sha256Bytes(bytes: Uint8Array): Uint8Array {
  return sha256(bytes);
}
