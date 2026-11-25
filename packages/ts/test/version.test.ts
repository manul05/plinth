import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLINTH_VERSION } from '../src/version.js';

describe('version', () => {
  it('PLINTH_VERSION matches package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(PLINTH_VERSION).toBe('0.1.0');
    expect(PLINTH_VERSION).toBe(pkg.version);
  });
});
