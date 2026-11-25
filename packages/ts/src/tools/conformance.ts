#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type ActionPolicy,
  type ApprovalRequest,
  type AuditEvent,
  b64urlEncode,
  canonicalize,
  type Digest,
  derToP1363,
  digest,
  eventHash,
  GENESIS_DIGEST,
  gstinValid,
  hexDecode,
  hexEncode,
  jwkFromP256Spki,
  kidOf,
  type LoadedPack,
  lintPersonalData,
  loadPack,
  localDate,
  maskSecret,
  matchingCode,
  PlinthError,
  p1363ToDer,
  parseJson,
  type RegistryPayload,
  type RuleWindow,
  redact,
  scan,
  selectAsOf,
  signEd25519,
  signingInput,
  type TrustedKey,
  type TypePolicy,
  thumbprintMembers,
  upiHandleValid,
  verhoeffValid,
  verifyApproval,
  verifyBreakGlass,
  verifyChain,
  verifyEnvelope,
  verifyRegistryChain,
  webauthnChallenge,
} from '../index.js';
import { BUILTIN_PACKS, type BuiltinPackId } from '../packs/index.js';

export interface ConformanceFailure {
  id: string;
  reason: string;
}

export interface ConformanceResult {
  passed: number;
  total: number;
  failures: ConformanceFailure[];
  skipped: number;
}

interface VectorFile {
  id: string;
  op: string;
  input: Record<string, unknown>;
  expect: Record<string, unknown>;
}

const TOOL_OPS = new Set<string>(['yamlSubset', 'lintRegex', 'compilePackDigests']);

function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a === null || b === null || typeof a !== typeof b) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (!jsonEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const entriesA = Object.entries(a).filter(([, value]) => value !== undefined);
    const entriesB = Object.entries(b).filter(([, value]) => value !== undefined);
    if (entriesA.length !== entriesB.length) {
      return false;
    }
    const mapB = new Map(entriesB);
    for (const [key, value] of entriesA) {
      if (!mapB.has(key) || !jsonEqual(value, mapB.get(key))) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function resolveText(input: Record<string, unknown>): string {
  if (Array.isArray(input.text_parts)) {
    return (input.text_parts as string[]).join('');
  }
  const repeat = input.text_repeat as { unit: string; times: number };
  return repeat.unit.repeat(repeat.times);
}

function resolvePacks(input: Record<string, unknown>): LoadedPack[] {
  return (input.packs as BuiltinPackId[]).map((id) => loadPack(BUILTIN_PACKS[id]));
}

function evaluateCoreOp(op: string, input: Record<string, unknown>, vectorsDir: string): unknown {
  if (op === 'parseAndCanonicalize') {
    const parsed = parseJson(input.json_text as string);
    return { canonical: canonicalize(parsed), digest: digest(parsed) };
  }
  if (op === 'kidOf') {
    return { kid: kidOf(input.jwk), canonical_member_set: canonicalize(thumbprintMembers(input.jwk)) };
  }
  if (op === 'p1363ToDer') {
    return { der_hex: hexEncode(p1363ToDer(hexDecode(input.p1363_hex as string))) };
  }
  if (op === 'derToP1363') {
    return { p1363_hex: hexEncode(derToP1363(hexDecode(input.der_hex as string))) };
  }
  if (op === 'signingInput') {
    const type = input.type as string;
    const payload = input.payload as object;
    return {
      signing_input_hex: hexEncode(signingInput(type, payload)),
      payload_canonical: canonicalize(payload),
      webauthn_challenge_b64url: b64urlEncode(webauthnChallenge(type, payload)),
    };
  }
  if (op === 'signEd25519') {
    const key = JSON.parse(readFileSync(join(vectorsDir, input.key_file as string), 'utf8')) as { private_hex: string };
    return {
      signature: signEd25519(
        input.type as string,
        input.payload as object,
        hexDecode(key.private_hex),
        input.role as string,
      ),
    };
  }
  if (op === 'verifyEnvelope') {
    return verifyEnvelope(input.envelope, {
      trustedKeys: input.trusted_keys as readonly TrustedKey[],
      policy: input.policy as TypePolicy,
    });
  }
  return undefined;
}

function evaluateAuditAndApprovalOp(
  op: string,
  input: Record<string, unknown>,
  expectObj: Record<string, unknown>,
): unknown {
  if (op === 'eventHash') {
    const event = input.event as AuditEvent;
    return { hash: eventHash(event), canonical: canonicalize(event) };
  }
  if (op === 'genesisPrev') {
    return { prev: GENESIS_DIGEST };
  }
  if (op === 'verifyChain') {
    return verifyChain({
      chain: input.chain as string,
      lines: input.lines as readonly unknown[],
      checkpoints: input.checkpoints as readonly unknown[],
      trustedKeys: input.trusted_keys as readonly TrustedKey[],
    });
  }
  if (op === 'lintPersonalData') {
    const findings = lintPersonalData(input.event as AuditEvent, resolvePacks(input), input.date as string);
    return { rule_ids: findings.map((f) => f.rule_id) };
  }
  if (op === 'matchingCode') {
    const request = input.request as ApprovalRequest;
    return { request_digest: digest(request), matching_code: matchingCode(request) };
  }
  if (op === 'verifyRegistryChain') {
    const result = verifyRegistryChain({
      envelopes: input.envelopes as readonly unknown[],
      genesisDigest: input.genesis_digest as Digest,
      highestSeenVersion: input.highest_seen_version as number,
    });
    const projected: Record<string, unknown> = {};
    for (const key of Object.keys(expectObj)) {
      projected[key] = (result as Record<string, unknown>)[key];
    }
    return projected;
  }
  if (op === 'verifyApproval') {
    const consumedIds = input.consumed_ids as readonly string[];
    const actionPolicies = input.action_policies as Readonly<Record<string, ActionPolicy>> | undefined;
    const requesterHumanId = input.requester_human_id as string | undefined;
    return verifyApproval({
      request: input.request,
      decisions: input.decisions as readonly unknown[],
      registry: input.registry as RegistryPayload,
      actualSubjectDigest: input.actual_subject_digest as string,
      allowedActions: input.allowed_actions as readonly string[],
      now: input.now as string,
      isConsumed: (id) => consumedIds.includes(id),
      ...(actionPolicies !== undefined ? { actionPolicies } : {}),
      ...(requesterHumanId !== undefined ? { requesterHumanId } : {}),
    });
  }
  if (op === 'verifyBreakGlass') {
    return verifyBreakGlass({
      code: input.code as string,
      registry: input.registry as RegistryPayload,
      usedDigests: input.used_digests as readonly string[],
    });
  }
  if (op === 'jwkFromP256Spki') {
    return { jwk: jwkFromP256Spki(hexDecode(input.spki_hex as string)) };
  }
  return undefined;
}

function evaluateRulepackAndDetectOp(op: string, input: Record<string, unknown>): unknown {
  if (op === 'selectAsOf') {
    const rule = selectAsOf(input.rules as readonly RuleWindow[], input.rule_id as string, input.date as string);
    return { found: rule !== null, rev: rule ? rule.rev : 0 };
  }
  if (op === 'localDate') {
    return { date: localDate(input.ts as string, input.tz as string) };
  }
  if (op === 'scan') {
    const date = input.date as string;
    const secret =
      typeof input.installation_secret_hex === 'string' ? hexDecode(input.installation_secret_hex) : undefined;
    const opts = secret === undefined ? { date } : { date, installationSecret: secret };
    return { findings: scan(resolveText(input), resolvePacks(input), opts) };
  }
  if (op === 'redact') {
    const date = input.date as string;
    const secret =
      typeof input.installation_secret_hex === 'string' ? hexDecode(input.installation_secret_hex) : new Uint8Array(0);
    return redact(resolveText(input), resolvePacks(input), { date, installationSecret: secret });
  }
  if (op === 'validator') {
    const name = input.name as string;
    const value = input.value as string;
    if (name === 'verhoeff') return { valid: verhoeffValid(value) };
    if (name === 'gstin') return { valid: gstinValid(value) };
    if (name === 'upi_handle') return { valid: upiHandleValid(value, input.handles as readonly string[]) };
    throw new Error(`Unknown validator: ${name}`);
  }
  if (op === 'maskSecret') {
    return { masked: (input.values as string[]).map(maskSecret) };
  }
  return undefined;
}

function evaluateVector(vec: VectorFile, vectorsDir: string): unknown {
  try {
    const core = evaluateCoreOp(vec.op, vec.input, vectorsDir);
    if (core !== undefined) return core;
    const auditApproval = evaluateAuditAndApprovalOp(vec.op, vec.input, vec.expect);
    if (auditApproval !== undefined) return auditApproval;
    const rulepackDetect = evaluateRulepackAndDetectOp(vec.op, vec.input);
    if (rulepackDetect !== undefined) return rulepackDetect;
    throw new Error(`Unsupported vector op: ${vec.op}`);
  } catch (err) {
    if (err instanceof PlinthError) {
      return { error: err.code };
    }
    throw err;
  }
}

function loadVectorFiles(vectorsDir: string): VectorFile[] {
  const dirs = readdirSync(vectorsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'keys')
    .map((entry) => entry.name)
    .sort();

  const vectors: VectorFile[] = [];
  for (const dirName of dirs) {
    const subDir = join(vectorsDir, dirName);
    const files = readdirSync(subDir)
      .filter((name) => name.endsWith('.json'))
      .sort();
    for (const file of files) {
      vectors.push(JSON.parse(readFileSync(join(subDir, file), 'utf8')) as VectorFile);
    }
  }
  vectors.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return vectors;
}

function cut200(text: string): string {
  return text.slice(0, 200);
}

export function runConformance(vectorsDir: string): ConformanceResult {
  const vectors = loadVectorFiles(vectorsDir);
  let passed = 0;
  let total = 0;
  let skipped = 0;
  const failures: ConformanceFailure[] = [];

  for (const vec of vectors) {
    if (TOOL_OPS.has(vec.op)) {
      skipped += 1;
      continue;
    }
    total += 1;
    const actual = evaluateVector(vec, vectorsDir);
    if (jsonEqual(actual, vec.expect)) {
      passed += 1;
    } else {
      failures.push({
        id: vec.id,
        reason: `expected ${cut200(JSON.stringify(vec.expect))} got ${cut200(JSON.stringify(actual))}`,
      });
    }
  }

  return { passed, total, failures, skipped };
}

function runCli(): void {
  const vectorsDir = process.argv[2];
  if (vectorsDir === undefined || vectorsDir === '') {
    process.stderr.write('usage: plinth-conformance <vectors-dir>\n');
    process.exitCode = 2;
    return;
  }
  const result = runConformance(vectorsDir);
  for (const failure of result.failures) {
    process.stdout.write(`FAIL ${failure.id}: ${failure.reason}\n`);
  }
  if (result.failures.length === 0) {
    process.stdout.write(`PASS ${result.passed}/${result.total}\n`);
    return;
  }
  process.stdout.write(`FAILED ${result.failures.length}/${result.total}\n`);
  process.exitCode = 1;
}

const entry = process.argv[1];
if (entry !== undefined && (entry.endsWith('conformance.js') || entry.endsWith('plinth-conformance'))) {
  try {
    runCli();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
