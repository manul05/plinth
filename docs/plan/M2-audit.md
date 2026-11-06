# M2 K1 Audit chain — task cards

**Goal:** 19 of the 21 `k1` vectors pass (the 2 `lintPersonalData` vectors arrive in T-M5-07 because they need K5); append, export, checkpoint, prune and verify per `contracts/spec/k1-audit.md`.
**Demo:** verify the 5-event chain, edit one event in the export, see `PK_AUDIT_HASH_MISMATCH at 2`.
Files: `packages/ts/src/audit/`, tests `packages/ts/test/audit/`. Audit code imports only from `../core/index.js` and `../errors.js` (and `../detect/index.js` in T-M5-07).

---

### T-M2-01 · Red skeleton: k1 vector runner
- **Size:** S
- **Depends on:** T-M1-11
- **Covers:** AC-6.1, AC-7.1, AC-7.2, AC-8.1 (failing harness)
- **Read first:** `contracts/spec/k1-audit.md`; `contracts/test-vectors/README.md`
- **Create:** `packages/ts/test/audit/k1-vectors.test.ts`; stubs `packages/ts/src/audit/index.ts`, `event.ts`, `jsonl.ts`, `checkpoint.ts`, `verify.ts` exporting every K1 name from `contracts/api/plinth-api.d.ts` except `lintPersonalData`, bodies `throw new Error('not implemented');`, plus `CHECKPOINT_POLICY` constant in `checkpoint.ts` exactly `{ 'pk.audit.checkpoint': { algs: ['Ed25519', 'ES256'], min_signatures: 1 } }`.
- **Modify:** `packages/ts/src/index.ts` (add `export * from './audit/index.js';`)
- **Tests (write first):** ops `eventHash` (`eventHash(input.event) === expect.hash`, `canonicalize(input.event) === expect.canonical`), `genesisPrev` (`GENESIS_DIGEST === expect.prev`), `verifyChain` (`verifyChain({chain: input.chain, lines: input.lines, checkpoints: input.checkpoints, trustedKeys: input.trusted_keys})` `toEqual(expect)`). Skip op `lintPersonalData` in this file (filter it out; it gets its own file in T-M5-07).
- **Run:** `npm test -- k1` → 18 failed, 1 passed (`k1-genesis-prev` already passes from core). Paste.
- **Done when:** failing output pasted · typecheck clean
- **Commit:** `test(audit): add failing k1 golden-vector runner (T-M2-01)`

### T-M2-02 · event.ts: eventHash and appendEvent
- **Size:** M
- **Depends on:** T-M2-01
- **Covers:** AC-6.1, AC-6.2
- **Read first:** `contracts/spec/k1-audit.md` §1–§2
- **Modify:** `packages/ts/src/audit/event.ts`
- **Create:** `packages/ts/test/audit/event.test.ts`
- **Steps:** `eventHash(e) = digest(e)`. `appendEvent(previous, draft, opts = {})` exactly per spec §2. Validation helper `assertEventShape(e)`: `isTimestamp(e.ts)`; `action` matches `/^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\.[a-z0-9]+(?:[_-][a-z0-9]+)*)+$/` and length ≤ 128; `actor.kind` in `['human','agent','service','device']`; `actor.id` string 1–200; `chain` matches `/^[a-z0-9][a-z0-9:._-]*$/` length 1–200 → else `PK_AUDIT_EVENT_MALFORMED`. Reserved: `action.startsWith('pk.') && !opts.allowReserved` → `PK_AUDIT_RESERVED_ACTION`.
- **Tests (write first):** `event.test.ts`, using draft D = `{chain:'passdown:project:0192f5e0-7c1a-7b3e-9a10-3f2c1d4e5a6b', ts:'2026-11-02T09:00:00.000Z', actor:{kind:'agent', id:'claude-code:client:01', display:'Claude Code'}, action:'passdown.handoff.created', target:{kind:'handoff', id:'0192f5e1-0000-7000-8000-000000000001'}, data:{redactions:1, body_digest: digest({b:1})}}`:
  - `appendEvent(null, D)` → `event.seq === 0`, `event.prev === GENESIS_DIGEST`, `hash === 'sha256:08c9735f5e478f6e59fd1fdd09a9b919f121fa8e7396123cdde66704855e5248'` (same as vector `k1-event-hash`);
  - second append → seq 1, prev = first hash;
  - draft with `chain: 'other'` after the first line → `PK_AUDIT_CHAIN_MISMATCH`;
  - `action: 'pk.audit.pruned'` → `PK_AUDIT_RESERVED_ACTION`; with `{allowReserved:true}` → ok;
  - `ts: '2026-11-02T09:00:00Z'` → `PK_AUDIT_EVENT_MALFORMED`; `action: 'Passdown.X'` → `PK_AUDIT_EVENT_MALFORMED`;
  - `data: {x: 1.5}` → `PK_JCS_NON_INTEGER`.
- **Run:** `npm test -- event k1`
- **Done when:** pass · STATUS updated
- **Commit:** `feat(audit): hash-chained event append (T-M2-02)`

### T-M2-03 · jsonl.ts: export and parse JSON Lines
- **Size:** S
- **Depends on:** T-M2-02
- **Covers:** AC-8.2
- **Read first:** `contracts/spec/k1-audit.md` §6 (first bullet)
- **Modify:** `packages/ts/src/audit/jsonl.ts`
- **Create:** `packages/ts/test/audit/jsonl.test.ts`
- **Steps:** `serializeExport(lines) = lines.map(l => canonicalize({event: l.event, hash: l.hash}) + '\n').join('')`. `parseExport(text)`: split on `'\n'`; if the last element is `''` drop it; for line N (1-based): `parseJson` (errors re-thrown as `new PlinthError(err.code, 'line ' + N)`), then shape: object with object `event` and string `hash` matching `/^sha256:[0-9a-f]{64}$/` → else `new PlinthError('PK_AUDIT_EVENT_MALFORMED', 'line ' + N)`.
- **Tests (write first):** round trip of the 5 lines from vector `k1-chain-valid-anchored` (`parseExport(serializeExport(lines))` deep-equals lines); serialized text has exactly 5 `\n`; `parseExport('{"event":{},"hash":1}\n')` → code `PK_AUDIT_EVENT_MALFORMED`, `detail === 'line 1'`; `parseExport('x\n')` → `PK_JSON_SYNTAX`, detail `line 1`.
- **Run:** `npm test -- jsonl`
- **Done when:** pass · STATUS updated
- **Commit:** `feat(audit): JSON Lines export and strict parse (T-M2-03)`

### T-M2-04 · checkpoint.ts: createCheckpoint and prunedEventDraft
- **Size:** S
- **Depends on:** T-M2-02
- **Covers:** AC-7.1, AC-8.1 (producer side), TM-17
- **Read first:** `contracts/spec/k1-audit.md` §3–§4
- **Modify:** `packages/ts/src/audit/checkpoint.ts`
- **Create:** `packages/ts/test/audit/checkpoint.test.ts`
- **Steps:** `createCheckpoint(line, ts, sk)`: payload `{spec:'pk-audit/1.0', chain: line.event.chain, seq: line.event.seq, head: line.hash, ts, count: line.event.seq + 1}`; `createEnvelope('pk.audit.checkpoint', payload, [signEd25519('pk.audit.checkpoint', payload, sk, 'service')])`. `prunedEventDraft({chain, ts, actor, checkpoint})` = `{chain, ts, actor, action:'pk.audit.pruned', data:{up_to_seq: checkpoint.payload.seq, checkpoint_digest: digest(checkpoint.payload)}}`.
- **Tests (write first):** `createCheckpoint(<line seq 4 of k1-chain-valid-anchored>, '2026-11-02T10:00:00.000Z', <ed25519-test-2 private key>)` deep-equals `input.checkpoints[0]` of that vector (Ed25519 is deterministic); `prunedEventDraft` for the checkpoint at seq 2 of `k1-chain-pruned-valid` gives `data` equal to the `pk.audit.pruned` event's `data` in that vector.
- **Run:** `npm test -- checkpoint`
- **Done when:** pass · STATUS updated
- **Commit:** `feat(audit): signed checkpoints and prune marker (T-M2-04)`

### T-M2-05 · verify.ts: verifyChain
- **Size:** M
- **Depends on:** T-M2-04
- **Covers:** AC-7.1, AC-7.2, AC-8.1, TM-15, TM-16, TM-17, TM-35, NFR-5
- **Read first:** `contracts/spec/k1-audit.md` §5 (steps A–E are the implementation order)
- **Modify:** `packages/ts/src/audit/verify.ts`
- **Create:** `packages/ts/test/audit/verify.test.ts`
- **Steps:** implement A–E exactly; never throw (wrap `digest` in try/catch → `PK_AUDIT_EVENT_MALFORMED`). Sort checkpoints with `[...checkpoints].sort((a, b) => seqOf(a) - seqOf(b))` where `seqOf` returns `payload.seq` if it is a safe integer, else 0. Results must have exactly the members shown in the spec (`at_seq` only on errors that carry it; `cause` only for `PK_AUDIT_CHECKPOINT_SIG_INVALID`).
- **Tests (write first):** the 17 `verifyChain` vectors; `verify.test.ts` › `verifyChain never throws`: for `lines` = `[null]`, `[1]`, `[{event:null, hash:'x'}]`, and `checkpoints` = `[null]` with a valid line, the result has `valid: false` and an error code (no exception); `chain` mismatch on a checkpoint only (valid lines, checkpoint payload chain `'other'` signed by ed25519-test-2) → `PK_AUDIT_CHAIN_MISMATCH`.
- **Run:** `npm test -- verify k1` → 19 k1 vectors pass (all except lint)
- **Done when:** pass · STATUS updated
- **Stop and ask the owner if:** a vector's `at_seq` disagrees with your reading of the spec.
- **Commit:** `feat(audit): fail-closed chain verification with checkpoints (T-M2-05)`

### T-M2-06 · M2 close: mutation checks, E2E-3 and status
- **Size:** S
- **Depends on:** T-M2-03, T-M2-05
- **Covers:** NFR-11 (MC-6, MC-7)
- **Modify:** `docs/status/STATUS.md`, `docs/status/LOG.md`, `docs/06-plan.md`
- **Steps:** MC-6 and MC-7 per `docs/testing.md` §6 (break, show failing vector name, restore). `npm run check`.
- **Done when:** 2 mutation checks logged · check green · STATUS "Next step: T-M3-01"
- **Commit:** `docs: close milestone M2 with mutation checks (T-M2-06)`
