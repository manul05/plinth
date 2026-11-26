# K1 Audit chain (`pk-audit/1.0`)

**Status:** normative for Plinth 0.1 (2026-10-31). **Vectors:** `contracts/test-vectors/k1/` (21). **Schemas:** `pk-audit.event`, `pk-audit.export-line`, `pk-audit.checkpoint-payload`, `pk-audit.pruned-data`. **API:** subpath `plinth-kit/audit`.

## 1. Event
```json
{ "spec": "pk-audit/1.0", "chain": "passdown:project:0192f5e0-…", "seq": 41, "prev": "sha256:…", "ts": "2026-11-02T09:00:00.000Z",
  "actor": { "kind": "agent", "id": "claude-code:client:01", "display": "Claude Code" },
  "action": "passdown.handoff.created", "target": { "kind": "handoff", "id": "…" }, "data": { }, "reason": "…",
  "refs": [ { "kind": "pk.approval.decision", "digest": "sha256:…" } ] }
```
- Required: `spec, chain, seq, prev, ts, actor{kind,id}, action`. Optional: `actor.display, target, data, reason, refs`. Exact limits: `pk-audit.event.schema.json`.
- `hash(event) = digest(event)` (K0). The hash is stored **next to** the event (`{"event":…,"hash":…}`), never inside it.
- `seq` starts at 0 and increases by exactly 1. `prev` of seq 0 = `GENESIS_DIGEST`; `prev` of seq n = hash of seq n−1.
- `action` matches `common.schema.json#/$defs/dottedName` (`<product>.<area>.<verb>`). Names starting `pk.` are reserved for the kit: `pk.audit.pruned`, `pk.audit.key_rotated`, `pk.approval.break_glass_used`. `appendEvent` refuses `pk.*` with `PK_AUDIT_RESERVED_ACTION` unless `{allowReserved: true}`.
- **Personal data rule:** events carry IDs and digests, never raw personal data or secrets (DPDP erasure vs. immutable log). `lintPersonalData` (§6) is the test-time check.

## 2. `appendEvent(previous, draft, opts)`
1. `previous === null` → seq 0, prev `GENESIS_DIGEST`; else seq = previous.event.seq + 1, prev = previous.hash, and `draft.chain` MUST equal `previous.event.chain` (`PK_AUDIT_CHAIN_MISMATCH`).
2. Build `{spec:"pk-audit/1.0", ...draft, seq, prev}` and check: `ts` is a timestamp, `action` matches dottedName, `actor.kind` in the four kinds, `chain` matches `^[a-z0-9][a-z0-9:._-]*$` and is 1–200 characters → else `PK_AUDIT_EVENT_MALFORMED`; reserved action rule above.
3. Return `{event, hash: digest(event)}` (a canonicalisation error is thrown as its own PK_JCS_* code).
- Appending MUST be serialised per chain by the product (one Durable Object per chain on Cloudflare; Postgres advisory lock; single SQLite writer). The app's database role MUST NOT be able to UPDATE or DELETE audit rows.

## 3. Checkpoint
Signed envelope, type `pk.audit.checkpoint`, payload `{spec:"pk-audit/1.0", chain, seq, head, ts, count}` where `head` = hash of event `seq` and `count = seq + 1`. `createCheckpoint(line, ts, secretKey)` signs it Ed25519 with role `"service"`. `CHECKPOINT_POLICY = {"pk.audit.checkpoint": {algs:["Ed25519","ES256"], min_signatures:1}}`.
A chain alone proves nothing against someone who can rewrite the whole table: checkpoints MUST be anchored where the attacker cannot write (Passdown: hashes in the repo's signed `.baton/snapshot.md`). **Honest limit:** `verifyChain` detects tail truncation only when callers pass the latest checkpoint fetched from that external anchor—never from the same mutable database/store as the events, where an attacker who deletes tail events can also withhold the newest checkpoint.

## 4. Pruning (180-day retention)
Deleting events below seq k is allowed only after a checkpoint at k−1 exists. Then append a `pk.audit.pruned` event whose `data` = `{up_to_seq: k−1, checkpoint_digest: digest(checkpoint.payload)}` (`prunedEventDraft` builds it). The pruned export starts at seq k and the verifier needs the checkpoint at k−1.

## 5. `verifyChain({chain, lines, checkpoints, trustedKeys})` — normative order, never throws
A. `lines` empty → `{valid:false, error:"PK_AUDIT_EMPTY"}`.
B. For each line i in the given order (no sorting), with e = line.event:
   1. line has object `event` and string `hash`; e has string spec, string chain, safe integer seq ≥ 0, string prev, ts matching the timestamp pattern, object actor, string action → else `PK_AUDIT_EVENT_MALFORMED` (`at_seq` = e.seq if it is a safe integer, else i).
   2. `e.spec === "pk-audit/1.0"` → else `PK_SPEC_UNSUPPORTED`.
   3. `e.chain === chain` → else `PK_AUDIT_CHAIN_MISMATCH`.
   4. `digest(e) === line.hash` → else `PK_AUDIT_HASH_MISMATCH` (canonicalisation failure → `PK_AUDIT_EVENT_MALFORMED`).
   5. i > 0: `e.seq === previousSeq + 1` → else `PK_AUDIT_SEQ_GAP` with `at_seq = previousSeq + 1`.
   6. i = 0 and e.seq = 0: `e.prev === GENESIS_DIGEST` → else `PK_AUDIT_PREV_MISMATCH`. i > 0: `e.prev === previous line's hash` → else `PK_AUDIT_PREV_MISMATCH`.
   `at_seq` = e.seq unless stated.
C. Checkpoints, sorted by `payload.seq` ascending. For each c with p = c.payload:
   1. p is an object, `p.spec === "pk-audit/1.0"`, string chain, safe integer seq, string head, `p.ts` matching the strict timestamp pattern, `p.count === p.seq + 1`, `c.type === "pk.audit.checkpoint"` → else `PK_AUDIT_CHECKPOINT_MALFORMED` (`at_seq` = p.seq or −1).
   2. `verifyEnvelope(c, {trustedKeys, policy: CHECKPOINT_POLICY})` → if invalid: `PK_AUDIT_CHECKPOINT_SIG_INVALID` with `cause` = the envelope error.
   3. `p.chain === chain` → else `PK_AUDIT_CHAIN_MISMATCH`.
   4. p.seq < firstSeq − 1 → ignore. p.seq = firstSeq − 1 → start anchor: `p.head === first event's prev` → else `PK_AUDIT_CHECKPOINT_MISMATCH`. p.seq > lastSeq → `PK_AUDIT_TRUNCATED` with `at_seq = lastSeq + 1`. Otherwise `p.head === hash at p.seq` → else `PK_AUDIT_CHECKPOINT_MISMATCH`. Track `anchored_seq` = highest accepted checkpoint seq (start −1).
D. If firstSeq > 0: no start anchor → `PK_AUDIT_PRUNED_WITHOUT_ANCHOR` (`at_seq` = firstSeq); no event with action `pk.audit.pruned` whose `data.up_to_seq === firstSeq − 1` and `data.checkpoint_digest === digest(startAnchor.payload)` → `PK_AUDIT_PRUNE_UNRECORDED`.
E. `anchored_seq === lastSeq` → `{valid:true, status:"verified", anchored_seq, last_seq}`; otherwise `{valid:true, status:"intact_unanchored_tail", anchored_seq, last_seq, warning:"PK_AUDIT_UNANCHORED_TAIL"}`. Products MUST show the second case as "intact, not yet anchored", never as fully verified.

## 6. Export format and personal-data lint
- Export = JSON Lines: each line is `canonicalize({event, hash})` followed by `\n` (`serializeExport`). `parseExport` splits on `\n`, ignores one trailing empty line, parses each line with `parseJson` and checks the export-line shape; error detail `"line N"` (1-based).
- `lintPersonalData(event, packs, date)`: walk every string value in the event; skip strings that are digests (`^sha256:[0-9a-f]{64}$`), UUIDs (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`) or top-level `event.prev` (`depth === 0`); run `scan(value, packs, {date})` (K5) on the rest (including nested `data.prev`); return all findings whose kind is `pii`, in walk order (object members in `Object.entries` order, arrays in order). Vectors pass the `pk.pii.india` pack.
