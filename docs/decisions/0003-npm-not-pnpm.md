# ADR-0003: Use npm (bundled with Node) with workspaces

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decided by:** Agent within delegated scope (Claude, Stage 3 planner); the owner may override
- **Owner approval:** Not needed for a delegated planning choice; listed for review at gate R1

## Context
pnpm is not installed on the old PC; npm 11.13.0 comes with Node 24.16.0. The CI templates already use `npm ci`.

## Options
1. **npm workspaces**: zero install, lockfile, works with the skeleton CI.
2. **pnpm via corepack**: stricter node_modules, but one more tool for a weak executor and a fresh PC.
3. **yarn**: same downside.

## Decision
npm 11.13.0, one root `package.json` with `"workspaces": ["packages/ts"]`, `package-lock.json` committed, `npm ci` everywhere.

## Consequences
START-HERE needs only Node. `npm pack` makes the vendored tarball whose sha512 npm records in consumers' lockfiles.
