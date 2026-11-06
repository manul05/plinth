# ADR-0004: Runtime-neutral library code; Node 24.16.0 for tools

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
Passdown runs on Cloudflare Workers (no `eval`/`new Function`, limited Node APIs); the 0.2 verify page runs in browsers.

## Options
1. **Runtime-neutral ES2022 library** with Node-only code isolated in `tools/` and `repo-tools/`.
2. **Node-first library**: simpler, but unusable in Workers and browsers.

## Decision
Library code under `packages/ts/src` (except `tools/`, `repo-tools/`) imports no `node:*` module and uses no eval, `new Function`, `require`, `fetch` or `console`; randomness via `crypto.getRandomValues`. Enforced by `test/portability.test.ts`. Tools run on Node 24.16.0.

## Consequences
Ajv cannot be used at runtime (it generates code with `new Function`); runtime shape checks are hand-written in spec order.
