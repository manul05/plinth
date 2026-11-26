import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const SCHEMAS_DIR = join(REPO_ROOT, 'contracts', 'schemas');

let cachedAjv: Ajv2020 | null = null;
const idByFile = new Map<string, string>();

function ensureAjv(): Ajv2020 {
  if (cachedAjv !== null) {
    return cachedAjv;
  }
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  const files = readdirSync(SCHEMAS_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort();
  for (const file of files) {
    const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf8')) as Record<string, unknown>;
    ajv.addSchema(schema);
    const id = typeof schema.$id === 'string' ? schema.$id : `https://plinth.invalid/schemas/${file}`;
    idByFile.set(file, id);
  }
  cachedAjv = ajv;
  return ajv;
}

export function validateAgainst(schemaFile: string, value: unknown): string | null {
  const ajv = ensureAjv();
  const id = idByFile.get(schemaFile);
  if (id === undefined) {
    throw new Error(`Unknown schema file: ${schemaFile}`);
  }
  const validate = ajv.getSchema(id);
  if (validate === undefined) {
    throw new Error(`Failed to resolve schema: ${schemaFile}`);
  }
  if (validate(value)) {
    return null;
  }
  const first = validate.errors?.[0];
  if (first === undefined) {
    return 'schema validation failed';
  }
  return `${first.instancePath} ${first.message ?? 'invalid'}`.trim();
}
