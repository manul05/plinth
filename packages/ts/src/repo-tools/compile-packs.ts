export function compilePacks(_opts: {
  rulesDir: string;
  packsDir: string;
  builtinPath: string;
  check: boolean;
  runTests: boolean;
}): { packs: number; rules: number; tests: number; differing: string[] } {
  throw new Error('not implemented');
}
