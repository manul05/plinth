import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateAgainst } from '../../src/repo-tools/schema.js';
import { yamlToValue } from '../../src/repo-tools/yaml-subset.js';
import { REPO_ROOT } from '../vectors.js';

describe('repo-tools schema validation', () => {
  it('validates each rules/*/pack.yaml against pk-rulepack.pack-source.schema.json', () => {
    const rulesRoot = join(REPO_ROOT, 'rules');
    const packDirs = readdirSync(rulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(packDirs.length).toBeGreaterThan(0);

    for (const packDir of packDirs) {
      const file = join(rulesRoot, packDir, 'pack.yaml');
      const value = yamlToValue(readFileSync(file, 'utf8'), file);
      expect(validateAgainst('pk-rulepack.pack-source.schema.json', value)).toBeNull();
    }
  });

  it('returns an error message string for an invalid pack object', () => {
    const err = validateAgainst('pk-rulepack.pack-source.schema.json', { spec: 'x' });
    expect(typeof err).toBe('string');
    expect((err as string).length).toBeGreaterThan(0);
  });
});
