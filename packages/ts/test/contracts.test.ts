import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import { loadKey, loadVectors, REPO_ROOT, VECTORS_DIR } from './vectors.js';

const COMPONENTS = ['k0', 'k1', 'k2', 'k4', 'k5'] as const;
const SCHEMAS_DIR = join(REPO_ROOT, 'contracts', 'schemas');

function buildAjv(): { ajv: Ajv2020; schemaFiles: string[] } {
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  const schemaFiles = readdirSync(SCHEMAS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  for (const file of schemaFiles) {
    const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf8')) as Record<string, unknown>;
    ajv.addSchema(schema);
  }
  return { ajv, schemaFiles };
}

function collectErrorCodes(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    if (/^PK_[A-Z0-9_]+$/.test(value)) {
      out.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectErrorCodes(item, out);
    }
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value)) {
      collectErrorCodes(v, out);
    }
  }
}

function listJsonRelPaths(dir: string, prefix = ''): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      results.push(...listJsonRelPaths(join(dir, entry.name), rel));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(rel);
    }
  }
  return results;
}

describe('contracts', () => {
  it('every schema compiles', () => {
    const { ajv, schemaFiles } = buildAjv();
    expect(schemaFiles).toHaveLength(17);
    for (const file of schemaFiles) {
      const validate = ajv.getSchema(`https://plinth.invalid/schemas/${file}`);
      expect(typeof validate, `missing schema ${file}`).toBe('function');
    }
  });

  it('every vector matches test-vector.schema.json', () => {
    const { ajv } = buildAjv();
    const validate = ajv.getSchema('https://plinth.invalid/schemas/test-vector.schema.json');
    expect(validate).toBeTypeOf('function');
    if (!validate) return;

    const allVectors = COMPONENTS.flatMap((c) => loadVectors(c));
    expect(allVectors).toHaveLength(181);
    for (const vec of allVectors) {
      const ok = validate(vec);
      expect(ok, `${vec.id}: ${ajv.errorsText(validate.errors)}`).toBe(true);
    }
  });

  it('every key file matches test-key.schema.json', () => {
    const { ajv } = buildAjv();
    const validate = ajv.getSchema('https://plinth.invalid/schemas/test-key.schema.json');
    expect(validate).toBeTypeOf('function');
    if (!validate) return;

    const keyFiles = readdirSync(join(VECTORS_DIR, 'keys'))
      .filter((name) => /-test-.*\.json$/.test(name))
      .sort();
    expect(keyFiles).toHaveLength(5);

    const keyKids: string[] = [];
    for (const file of keyFiles) {
      const key = loadKey(`keys/${file}`);
      const ok = validate(key);
      expect(ok, `${file}: ${ajv.errorsText(validate.errors)}`).toBe(true);
      keyKids.push(key.kid);
    }

    const testKids = JSON.parse(readFileSync(join(VECTORS_DIR, 'keys', 'test-kids.json'), 'utf8')) as {
      kids: string[];
    };
    expect(testKids.kids).toHaveLength(5);
    expect([...testKids.kids].sort()).toEqual([...keyKids].sort());

    const validateJwk = ajv.getSchema('https://plinth.invalid/schemas/jwk.schema.json');
    expect(validateJwk).toBeTypeOf('function');
    if (validateJwk) {
      expect(
        validateJwk({
          kty: 'OKP',
          crv: 'Ed25519',
          x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
          d: 'forbidden-private-member',
        }),
      ).toBe(false);
    }
  });

  it('vector files match index.json', () => {
    const index = JSON.parse(readFileSync(join(VECTORS_DIR, 'index.json'), 'utf8')) as {
      files: Array<{ path: string; sha256: string }>;
    };
    expect(index.files).toHaveLength(187);

    const indexedPaths = new Set<string>();
    for (const entry of index.files) {
      const bytes = readFileSync(join(VECTORS_DIR, entry.path));
      const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
      expect(digest, entry.path).toBe(entry.sha256);
      indexedPaths.add(entry.path);
    }

    const diskPaths = listJsonRelPaths(VECTORS_DIR).filter((rel) => rel !== 'index.json');
    expect([...diskPaths].sort()).toEqual([...indexedPaths].sort());
  });

  it('every error code used by vectors exists', () => {
    const errorsDoc = JSON.parse(readFileSync(join(REPO_ROOT, 'contracts', 'errors.json'), 'utf8')) as {
      errors: Array<{ code: string; component: string; message: string }>;
    };
    expect(errorsDoc.errors).toHaveLength(97);

    const knownCodes = new Set<string>();
    for (const entry of errorsDoc.errors) {
      expect(knownCodes.has(entry.code), `duplicate error code ${entry.code}`).toBe(false);
      knownCodes.add(entry.code);
      expect(entry.message.length, `${entry.code} empty message`).toBeGreaterThan(0);
      expect(entry.message.endsWith('.'), `${entry.code} missing trailing period`).toBe(true);
    }

    const usedCodes = new Set<string>();
    for (const component of COMPONENTS) {
      for (const vec of loadVectors(component)) {
        collectErrorCodes(vec.expect, usedCodes);
      }
    }
    expect(usedCodes.size).toBe(74);
    for (const code of usedCodes) {
      expect(knownCodes.has(code), `unknown error code ${code}`).toBe(true);
    }
  });

  it('vector files are ASCII', () => {
    for (const component of COMPONENTS) {
      const dir = join(VECTORS_DIR, component);
      const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const bytes = readFileSync(join(dir, file));
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i] ?? 0;
          const allowed = (b >= 0x20 && b <= 0x7e) || b === 0x0a;
          expect(allowed, `${component}/${file} byte ${i} = 0x${b.toString(16)}`).toBe(true);
        }
      }
    }
  });
});
