export type Digest = `sha256:${string}`;

export const GENESIS_DIGEST: Digest = `sha256:${'0'.repeat(64)}`;

export function canonicalize(_value: unknown): string {
  throw new Error('not implemented');
}

export function digest(_value: unknown): Digest {
  throw new Error('not implemented');
}

export function digestBytes(_bytes: Uint8Array): Digest {
  throw new Error('not implemented');
}
