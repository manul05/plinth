# ADR-0009: TypeScript 7.0.2, Vitest 5.0.5, Biome 2.5.15; Ajv, yaml and safe-regex2 as dev-only tools

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
Weak executor, old PC: few tools, each verified to work together in a scratch install on 2026-10-31 (tsc 7.0.2 emitted `.d.ts`; vitest 5.0.5 ran a TS test importing `.js` paths; biome 2.5.15 linted).

## Options
1. **TS 7.0.2 + Vitest + Biome**: one formatter/linter binary.
2. **TS 6.0.3 + ESLint + Prettier**: more packages and config.

## Decision
TypeScript 7.0.2 (note: TS 7 refuses `tsc <file>` when a tsconfig exists; always use `tsc -p <config>`), Vitest 5.0.5 with Vite 8.3.4, Biome 2.5.15, @types/node 24.19.2; Ajv 8.20.0, yaml 2.9.1, safe-regex2 5.1.2 only in tests and `repo-tools/`.

## Consequences
If a TS 7 behaviour blocks a task, the task's "stop and ask" applies; fallback is TypeScript 6.0.3 via a new ADR.
