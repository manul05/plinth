import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['packages/ts/test/**/*.test.ts'], testTimeout: 20000, pool: 'forks' },
});
