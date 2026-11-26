import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT: string = fileURLToPath(new URL('../../../', import.meta.url));
export const VECTORS_DIR: string = join(REPO_ROOT, 'contracts', 'test-vectors');

export interface Vector {
  suite: string;
  id: string;
  op: string;
  description: string;
  input: Record<string, unknown>;
  expect: Record<string, unknown>;
}

export function loadVectors(component: 'k0' | 'k1' | 'k2' | 'k4' | 'k5', op?: string): Vector[] {
  const dir = join(VECTORS_DIR, component);
  const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
  const vectors = files.map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')) as Vector);
  vectors.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return op === undefined ? vectors : vectors.filter((v) => v.op === op);
}

export function loadKey(relPath: string): {
  name: string;
  alg: 'Ed25519' | 'ES256';
  private_hex: string;
  public_jwk: Record<string, string>;
  kid: string;
} {
  return JSON.parse(readFileSync(join(VECTORS_DIR, relPath), 'utf8')) as {
    name: string;
    alg: 'Ed25519' | 'ES256';
    private_hex: string;
    public_jwk: Record<string, string>;
    kid: string;
  };
}
