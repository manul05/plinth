import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './vectors.js';

describe('workflows', () => {
  it('workflows contain no template placeholders', () => {
    const workflowsDir = join(REPO_ROOT, '.github', 'workflows');
    const files = readdirSync(workflowsDir)
      .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
      .map((name) => join(workflowsDir, name));
    files.push(join(REPO_ROOT, '.github', 'dependabot.yml'));

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toMatch(/(?<!\$)\{\{/);
    }
  });

  it('ci uses the pinned node file', () => {
    const ci = readFileSync(join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
    const matches = ci.match(/node-version-file:\s*\.nvmrc/g) ?? [];
    expect(matches).toHaveLength(2);
  });
});
