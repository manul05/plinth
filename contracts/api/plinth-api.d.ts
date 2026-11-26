// contracts/api/plinth-api.d.ts
// THE exact public TypeScript API of plinth-kit 0.1.0 (Stage 3 contract, 2026-10-31).
// The implementation in packages/ts/src MUST export exactly these names with these types
// from the listed subpaths. packages/ts/test/api-conformance.test.ts checks it at compile time.
// Changing this file needs an ADR and the owner's OK (START-HERE.md, executor rules).
// Normative behaviour: contracts/spec/k0-core.md ... k5-detection.md. Error codes: contracts/errors.json.

// ============================================================ shared (subpath: "plinth-kit/core")
export type Json = string | number | boolean | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };
/** "sha256:" + 64 lowercase hex characters */
export type Digest = `sha256:${string}`;
/** "PK_" + upper-case words, listed in contracts/errors.json */
export type ErrorCode = `PK_${string}`;

export declare const PLINTH_VERSION: '0.1.0';
export declare const GENESIS_DIGEST: Digest; // "sha256:" + 64 zeros

export declare class PlinthError extends Error {
  readonly code: ErrorCode;
  readonly detail: string | undefined;
  constructor(code: ErrorCode, detail?: string);
}
/** Exact messages from contracts/errors.json (97 entries). */
export declare const ERROR_MESSAGES: Readonly<Record<string, string>>;

// bytes
export declare function b64urlEncode(bytes: Uint8Array): string;
/** Throws PlinthError PK_ENCODING_INVALID for padding, '+', '/', or any other character outside A-Z a-z 0-9 - _ */
export declare function b64urlDecode(text: string): Uint8Array;
export declare function hexEncode(bytes: Uint8Array): string;
/** Accepts lower- or upper-case; throws PK_ENCODING_INVALID on odd length or non-hex. */
export declare function hexDecode(text: string): Uint8Array;
export declare function utf8Encode(text: string): Uint8Array;
export declare function sha256Bytes(bytes: Uint8Array): Uint8Array;

// JSON and pk-JCS
/** Strict I-JSON parser (k0-core.md section 2). Throws PlinthError with PK_JSON_* / PK_JCS_* codes. */
export declare function parseJson(text: string): Json;
/** pk-JCS canonical form (k0-core.md section 3). Throws PlinthError PK_JCS_* / PK_JSON_TOO_DEEP. */
export declare function canonicalize(value: unknown): string;
export declare function digest(value: unknown): Digest;
export declare function digestBytes(bytes: Uint8Array): Digest;

// keys
export type Ed25519PublicJwk = { kty: 'OKP'; crv: 'Ed25519'; x: string };
export type P256PublicJwk = { kty: 'EC'; crv: 'P-256'; x: string; y: string };
export type PublicJwk = Ed25519PublicJwk | P256PublicJwk;
/** Returns only the RFC 7638 members, validated. Throws PK_KEY_UNSUPPORTED / PK_KEY_INVALID / PK_ENCODING_INVALID. */
export declare function thumbprintMembers(jwk: unknown): PublicJwk;
export declare function kidOf(jwk: unknown): Digest;
/** 91-byte DER SubjectPublicKeyInfo of an uncompressed P-256 key (browser getPublicKey()). Throws PK_KEY_UNSUPPORTED / PK_KEY_INVALID. */
export declare function jwkFromP256Spki(spki: Uint8Array): P256PublicJwk;
export declare function ed25519PublicJwk(secretKey: Uint8Array): Ed25519PublicJwk;
/** The 5 TEST-ONLY kids from contracts/test-vectors/keys/test-kids.json */
export declare const TEST_KIDS: readonly Digest[];
export declare function isTestKid(kid: string): boolean;

// ECDSA signature encodings
export declare function p1363ToDer(sig: Uint8Array): Uint8Array;
/** Strict DER: minimal INTEGERs, no trailing bytes. Throws PK_ENCODING_INVALID. */
export declare function derToP1363(der: Uint8Array): Uint8Array;

// signed envelope pk-sig/1.0
export type Alg = 'Ed25519' | 'ES256' | 'webauthn-ES256';
export interface SignaturePlain { kid: Digest; alg: 'Ed25519' | 'ES256'; role: string; sig: string }
export interface SignatureWebauthn { kid: Digest; alg: 'webauthn-ES256'; role: string; sig: string; authenticator_data: string; client_data_json: string }
export type SignatureEntry = SignaturePlain | SignatureWebauthn;
export interface Envelope<P extends object = JsonObject> { spec: 'pk-sig/1.0'; type: string; payload: P; signatures: SignatureEntry[] }
export interface TrustedKey { kid: Digest; jwk: PublicJwk; webauthn?: { rp_id: string; origins: string[] } }
export type TypePolicy = Readonly<Record<string, { algs: readonly Alg[]; min_signatures: number }>>;
export interface AuthenticatorFlags { up: boolean; uv: boolean; be: boolean; bs: boolean }
export interface SignerInfo { kid: Digest; alg: Alg; role: string; flags?: AuthenticatorFlags }
export type VerifyResult = { valid: true; signers: SignerInfo[] } | { valid: false; error: ErrorCode };

export declare function signingInput(type: string, payload: object): Uint8Array;
export declare function signEd25519(type: string, payload: object, secretKey: Uint8Array, role: string): SignaturePlain;
export declare function createEnvelope<P extends object>(type: string, payload: P, signatures: SignatureEntry[]): Envelope<P>;
/** Never throws. Check order is normative (k0-core.md section 6). */
export declare function verifyEnvelope(envelope: unknown, opts: { trustedKeys: readonly TrustedKey[]; policy: TypePolicy }): VerifyResult;
/** base64url(this) is the clientDataJSON.challenge: SHA-256 of signingInput(type, payload). 32 bytes. */
export declare function webauthnChallenge(type: string, payload: object): Uint8Array;
export declare function signatureFromAssertion(input: { kid: Digest; role: string; authenticatorData: Uint8Array; clientDataJSON: Uint8Array; signature: Uint8Array }): SignatureWebauthn;

// ids and time
export declare function newUuidV7(nowMs?: number): string;
export declare function newNonce(): string;
export declare function isTimestamp(text: string): boolean;
export declare function timestampFromMs(ms: number): string;

// ============================================================ K1 (subpath: "plinth-kit/audit")
export type ActorKind = 'human' | 'agent' | 'service' | 'device';
export interface AuditEvent {
  spec: 'pk-audit/1.0'; chain: string; seq: number; prev: Digest; ts: string;
  actor: { kind: ActorKind; id: string; display?: string };
  action: string; target?: { kind: string; id: string }; data?: JsonObject; reason?: string;
  refs?: { kind: string; digest: Digest }[];
}
export type EventDraft = Omit<AuditEvent, 'spec' | 'seq' | 'prev'>;
export interface ExportLine { event: AuditEvent; hash: Digest }
export interface CheckpointPayload { spec: 'pk-audit/1.0'; chain: string; seq: number; head: Digest; ts: string; count: number }
export type ChainResult =
  | { valid: true; status: 'verified'; anchored_seq: number; last_seq: number }
  | { valid: true; status: 'intact_unanchored_tail'; anchored_seq: number; last_seq: number; warning: 'PK_AUDIT_UNANCHORED_TAIL' }
  | { valid: false; error: ErrorCode; at_seq?: number; cause?: ErrorCode };

export declare function eventHash(event: AuditEvent): Digest;
/** previous = null starts a chain at seq 0. Throws PK_AUDIT_EVENT_MALFORMED / PK_AUDIT_RESERVED_ACTION / PK_AUDIT_CHAIN_MISMATCH. */
export declare function appendEvent(previous: ExportLine | null, draft: EventDraft, opts?: { allowReserved?: boolean }): ExportLine;
export declare function createCheckpoint(line: ExportLine, ts: string, secretKey: Uint8Array): Envelope<CheckpointPayload>;
export declare function prunedEventDraft(input: { chain: string; ts: string; actor: AuditEvent['actor']; checkpoint: Envelope<CheckpointPayload> }): EventDraft;
export declare function verifyChain(input: { chain: string; lines: readonly unknown[]; checkpoints: readonly unknown[]; trustedKeys: readonly TrustedKey[] }): ChainResult;
/** JSON Lines; each line parsed with parseJson. Throws PlinthError on the first bad line (detail = "line N"). */
export declare function parseExport(text: string): ExportLine[];
/** One canonical {"event":...,"hash":...} per line, each line ends with "\n". */
export declare function serializeExport(lines: readonly ExportLine[]): string;
export declare function lintPersonalData(event: AuditEvent, packs: readonly LoadedPack[], date: string): Finding[];

// ============================================================ K2 (subpath: "plinth-kit/approval")
export interface ApprovalRequest {
  spec: 'pk-approval/1.0'; id: string; realm: string; action: string;
  subject: { kind: string; digest: Digest; attributes?: Record<string, string> };
  display: { title: string; risk: string[] };
  requester: { kind: ActorKind; id: string; human_id?: string };
  created_at: string; expires_at: string; nonce: string;
  policy: { registry_version: number; min_approvals: number; distinct_from_requester: boolean };
  window?: { opens_at: string; closes_at: string };
}
export interface DecisionPayload { spec: 'pk-approval/1.0'; request_digest: Digest; decision: 'approve' | 'deny'; decided_at: string; approver_id: string; reason?: string }
export type ApproverProfile = 'webauthn' | 'android-keystore' | 'windows-tpm';
export interface Approver {
  id: string; display: string; kid: Digest; jwk: P256PublicJwk; profile: ApproverProfile; roles: string[]; added_at: string;
  webauthn?: { rp_id: string; origins: string[]; credential_id: string; backup_eligible: boolean; backup_state: boolean };
  hardware?: boolean;
}
export interface RegistryPayload {
  spec: 'pk-approval/1.0'; realm: string; version: number; approvers: Approver[];
  break_glass: { code_digest: Digest }[]; max_ttl_seconds: number; allow_synced_passkeys: boolean;
  update_threshold?: number;
}
export type RegistryResult = { valid: true; version: number; registry_digest: Digest; registry: RegistryPayload } | { valid: false; error: ErrorCode; at_version: number };
export interface ActionPolicy {
  min_approvals: number;
  distinct_from_requester: boolean;
}
export type ApprovalResult =
  | { valid: true; request_digest: Digest; matching_code: string; approver_ids: string[]; consume_id: string }
  | { valid: false; error: ErrorCode };
export interface ConsumedIdStore {
  has(id: string): Promise<boolean>;
  /** Atomically adds; resolves false if the id was already present. */
  add(id: string): Promise<boolean>;
}
export declare const SKEW_SECONDS: 300;
export declare const DECISION_POLICY: TypePolicy;
export declare const REGISTRY_POLICY: TypePolicy;
export declare const CHECKPOINT_POLICY: TypePolicy;

export declare function createApprovalRequest(input: {
  realm: string; action: string; subject: ApprovalRequest['subject']; display: ApprovalRequest['display'];
  requester: ApprovalRequest['requester']; policy: ApprovalRequest['policy']; window?: ApprovalRequest['window'];
  nowMs: number; ttlSeconds: number;
}): ApprovalRequest;
export declare function matchingCode(request: ApprovalRequest): string;
export declare function decisionPayload(input: { request: ApprovalRequest; decision: 'approve' | 'deny'; decidedAt: string; approverId: string; reason?: string }): DecisionPayload;
export declare function trustedKeysFromRegistry(registry: RegistryPayload): TrustedKey[];
export declare function verifyRegistryChain(input: { envelopes: readonly unknown[]; genesisDigest: Digest; highestSeenVersion: number }): RegistryResult;
/** Pure and synchronous; never throws. Does NOT record the id: use verifyAndConsume or call store.add yourself. Products MUST pass actionPolicies and requesterHumanId from enforcement auth. */
export declare function verifyApproval(input: {
  request: unknown; decisions: readonly unknown[]; registry: RegistryPayload; actualSubjectDigest: string;
  allowedActions: readonly string[]; now: string; isConsumed: (id: string) => boolean;
  actionPolicies?: Readonly<Record<string, ActionPolicy>>; requesterHumanId?: string;
}): ApprovalResult;
/** verifyApproval, then store.add(consume_id); if add resolves false returns { valid: false, error: 'PK_APPROVAL_REPLAYED' }. */
export declare function verifyAndConsume(input: {
  request: unknown; decisions: readonly unknown[]; registry: RegistryPayload; actualSubjectDigest: string;
  allowedActions: readonly string[]; now: string; store: ConsumedIdStore;
  actionPolicies?: Readonly<Record<string, ActionPolicy>>; requesterHumanId?: string;
}): Promise<ApprovalResult>;
export declare class MemoryConsumedIdStore implements ConsumedIdStore {
  has(id: string): Promise<boolean>;
  add(id: string): Promise<boolean>;
}
/** 20 base32 characters (A-Z, 2-7) from 100 random bits, shown as XXXXX-XXXXX-XXXXX-XXXXX. */
export declare function newBreakGlassCode(): string;
export declare function breakGlassDigest(code: string): Digest;
export declare function verifyBreakGlass(input: { code: string; registry: RegistryPayload; usedDigests: readonly string[] }):
  { valid: true; code_digest: Digest } | { valid: false; error: ErrorCode };

// ============================================================ K4 (subpath: "plinth-kit/rulepack")
export type PackKind = 'secret-detection' | 'pii-detection' | 'untrusted-text';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export interface SecretBody {
  provider: string; short: string; secret_kind: 'secret' | 'public_id' | 'token' | 'private_key'; environment: 'live' | 'test' | 'unknown';
  regex: string; flags?: string; secret_group: number; keywords: string[]; entropy_min?: string;
  pair_with?: { rules: string[]; within_chars: number }; allow: string[]; severity: Severity; personal_data_reach: string; rotation_url: string;
}
export interface PiiBody {
  pii_type: string; regex: string; flags?: string; validator: 'verhoeff' | 'gstin' | 'upi_handle' | 'none';
  context_keywords: string[]; mask: { store: 'never' | 'masked' | 'encrypted'; display: 'last4' | 'none' }; severity: Severity; handles?: string[];
}
export type UntrustedBody =
  | { class: 'hidden_char'; ranges: [number, number][]; severity: Severity }
  | { class: 'phrase'; regex: string; flags?: string; severity: Severity };
export interface Rule {
  id: string; rev: number; title: string; description: string; status: 'experimental' | 'stable' | 'deprecated' | 'withdrawn';
  verified: { state: 'verified' | 'unverified'; by?: string; at?: string; note: string };
  source_refs: { source_id: string; locator: string }[];
  effective_from: string; effective_until?: string;
  changes: { rev: number; date: string; summary: string; source_ref?: string }[]; tags: string[];
  body: SecretBody | PiiBody | UntrustedBody;
}
export interface PackManifest {
  spec: 'pk-rulepack/1.0'; id: string; kind: PackKind; version: string; released_at: string; tz: 'Asia/Kolkata' | 'UTC';
  licence: 'MIT'; attribution: string[];
  sources: { id: string; title: string; publisher: string; url: string; retrieved_at: string; doc_version: string; doc_sha256?: Digest }[];
  files: { path: 'rules.json' | 'tests.json'; sha256: Digest }[]; min_engine: 'pk-rulepack/1.0';
}
export interface RulesFile { spec: 'pk-rulepack/1.0'; pack_id: string; rules: Rule[] }
export interface TestsFile { spec: 'pk-rulepack/1.0'; pack_id: string; tests: { rule_id: string; input_parts: string[]; expect: 'match' | 'no_match'; note?: string }[] }
export interface CompiledPack { manifest: PackManifest; rules: RulesFile; tests: TestsFile }
export interface LoadedPack { manifest: PackManifest; rules: readonly Rule[] }
export interface RuleWindow { id: string; rev: number; status: Rule['status']; effective_from: string; effective_until?: string }

/** Throws PK_SPEC_UNSUPPORTED, PK_RULEPACK_KIND_UNSUPPORTED, PK_RULEPACK_FILE_HASH_MISMATCH. */
export declare function loadPack(pack: CompiledPack): LoadedPack;
/** Throws PK_RULEPACK_OVERLAP if two non-withdrawn revisions both contain the date. */
export declare function selectAsOf<R extends RuleWindow>(rules: readonly R[], ruleId: string, date: string): R | null;
/** Calendar date YYYY-MM-DD of a timestamp in 'Asia/Kolkata' (UTC+05:30) or 'UTC'. Throws PK_RULEPACK_TZ_UNSUPPORTED. */
export declare function localDate(ts: string, tz: string): string;
/** Rules effective on date, excluding deprecated and withdrawn, in pack order. */
export declare function activeRules(pack: LoadedPack, date: string): Rule[];

// ============================================================ built-in packs (subpath: "plinth-kit/packs")
export type BuiltinPackId = 'pk.secrets.global' | 'pk.secrets.india' | 'pk.pii.india' | 'pk.untrusted-text';
/** Generated by repo-tools/compile-packs.ts into packages/ts/src/packs/builtin.ts. */
export declare const BUILTIN_PACKS: Readonly<Record<BuiltinPackId, CompiledPack>>;

// ============================================================ K5 (subpath: "plinth-kit/detect")
export interface Finding {
  rule_id: string; rev: number; kind: 'secret' | 'pii' | 'untrusted'; start: number; end: number; severity: Severity; masked_preview: string;
  provider?: string; secret_kind?: SecretBody['secret_kind']; environment?: SecretBody['environment']; short?: string;
  fingerprint?: string; pii_type?: string; placeholder?: string;
}
export interface RedactResult { output: string; findings: Finding[]; counts: { secret: number; pii: number } }
export declare const MAX_SCAN_INPUT: 1000000;
/** Never returns raw secret values. Throws PK_DETECT_INPUT_TOO_LARGE. */
export declare function scan(text: string, packs: readonly LoadedPack[], opts: { date: string; installationSecret?: Uint8Array }): Finding[];
/** Throws PK_DETECT_SECRET_REQUIRED (secret shorter than 32 bytes) and PK_DETECT_INPUT_TOO_LARGE. */
export declare function redact(text: string, packs: readonly LoadedPack[], opts: { date: string; installationSecret: Uint8Array }): RedactResult;
export declare function verhoeffValid(value: string): boolean;
export declare function gstinValid(value: string): boolean;
export declare function upiHandleValid(value: string, handles: readonly string[]): boolean;
export declare function shannonEntropy(value: string): number;
export declare function maskSecret(value: string): string;
