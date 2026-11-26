import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/ts/test/perf/**/*.perf.ts'],
    passWithNoTests: true,
    testTimeout: 120000,
    pool: 'forks',
    fileParallelism: false,
  },
});
