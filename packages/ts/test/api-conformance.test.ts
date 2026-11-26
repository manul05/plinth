import { describe, expect, it } from 'vitest';
import type * as Api from '../../../contracts/api/plinth-api.js';
import * as approval from '../src/approval/index.js';
import * as audit from '../src/audit/index.js';
import * as core from '../src/core/index.js';
import * as detect from '../src/detect/index.js';
import * as errors from '../src/errors.js';
import * as root from '../src/index.js';
import * as packs from '../src/packs/index.js';
import * as rulepack from '../src/rulepack/index.js';

// Compile-time type checks against contracts/api/plinth-api.d.ts
const _plinthVersion: typeof Api.PLINTH_VERSION = core.PLINTH_VERSION;
const _genesisDigest: typeof Api.GENESIS_DIGEST = core.GENESIS_DIGEST;
const _plinthError: typeof Api.PlinthError = errors.PlinthError;
const _errorMessages: typeof Api.ERROR_MESSAGES = errors.ERROR_MESSAGES;
const _b64urlEncode: typeof Api.b64urlEncode = core.b64urlEncode;
const _b64urlDecode: typeof Api.b64urlDecode = core.b64urlDecode;
const _hexEncode: typeof Api.hexEncode = core.hexEncode;
const _hexDecode: typeof Api.hexDecode = core.hexDecode;
const _utf8Encode: typeof Api.utf8Encode = core.utf8Encode;
const _sha256Bytes: typeof Api.sha256Bytes = core.sha256Bytes;
const _parseJson: typeof Api.parseJson = core.parseJson;
const _canonicalize: typeof Api.canonicalize = core.canonicalize;
const _digest: typeof Api.digest = core.digest;
const _digestBytes: typeof Api.digestBytes = core.digestBytes;
const _thumbprintMembers: typeof Api.thumbprintMembers = core.thumbprintMembers;
const _kidOf: typeof Api.kidOf = core.kidOf;
const _jwkFromP256Spki: typeof Api.jwkFromP256Spki = core.jwkFromP256Spki;
const _ed25519PublicJwk: typeof Api.ed25519PublicJwk = core.ed25519PublicJwk;
const _testKids: typeof Api.TEST_KIDS = core.TEST_KIDS;
const _isTestKid: typeof Api.isTestKid = core.isTestKid;
const _p1363ToDer: typeof Api.p1363ToDer = core.p1363ToDer;
const _derToP1363: typeof Api.derToP1363 = core.derToP1363;
const _signingInput: typeof Api.signingInput = core.signingInput;
const _signEd25519: typeof Api.signEd25519 = core.signEd25519;
const _createEnvelope: typeof Api.createEnvelope = core.createEnvelope;
const _verifyEnvelope: typeof Api.verifyEnvelope = core.verifyEnvelope;
const _webauthnChallenge: typeof Api.webauthnChallenge = core.webauthnChallenge;
const _signatureFromAssertion: typeof Api.signatureFromAssertion = core.signatureFromAssertion;
const _newUuidV7: typeof Api.newUuidV7 = core.newUuidV7;
const _newNonce: typeof Api.newNonce = core.newNonce;
const _isTimestamp: typeof Api.isTimestamp = core.isTimestamp;
const _timestampFromMs: typeof Api.timestampFromMs = core.timestampFromMs;

// K1 audit
const _eventHash: typeof Api.eventHash = audit.eventHash;
const _appendEvent: typeof Api.appendEvent = audit.appendEvent;
const _createCheckpoint: typeof Api.createCheckpoint = audit.createCheckpoint;
const _prunedEventDraft: typeof Api.prunedEventDraft = audit.prunedEventDraft;
const _verifyChain: typeof Api.verifyChain = audit.verifyChain;
const _parseExport: typeof Api.parseExport = audit.parseExport;
const _serializeExport: typeof Api.serializeExport = audit.serializeExport;
const _lintPersonalData: typeof Api.lintPersonalData = audit.lintPersonalData;
const _auditCheckpointPolicy: typeof Api.CHECKPOINT_POLICY = audit.CHECKPOINT_POLICY;

// K2 approval
const _skewSeconds: typeof Api.SKEW_SECONDS = approval.SKEW_SECONDS;
const _decisionPolicy: typeof Api.DECISION_POLICY = approval.DECISION_POLICY;
const _registryPolicy: typeof Api.REGISTRY_POLICY = approval.REGISTRY_POLICY;
const _approvalCheckpointPolicy: typeof Api.CHECKPOINT_POLICY = approval.CHECKPOINT_POLICY;
const _createApprovalRequest: typeof Api.createApprovalRequest = approval.createApprovalRequest;
const _matchingCode: typeof Api.matchingCode = approval.matchingCode;
const _decisionPayload: typeof Api.decisionPayload = approval.decisionPayload;
const _trustedKeysFromRegistry: typeof Api.trustedKeysFromRegistry = approval.trustedKeysFromRegistry;
const _verifyRegistryChain: typeof Api.verifyRegistryChain = approval.verifyRegistryChain;
const _verifyApproval: typeof Api.verifyApproval = approval.verifyApproval;
const _verifyAndConsume: typeof Api.verifyAndConsume = approval.verifyAndConsume;
const _memoryConsumedIdStore: typeof Api.MemoryConsumedIdStore = approval.MemoryConsumedIdStore;
const _newBreakGlassCode: typeof Api.newBreakGlassCode = approval.newBreakGlassCode;
const _breakGlassDigest: typeof Api.breakGlassDigest = approval.breakGlassDigest;
const _verifyBreakGlass: typeof Api.verifyBreakGlass = approval.verifyBreakGlass;

// K4 rulepack
const _loadPack: typeof Api.loadPack = rulepack.loadPack;
const _selectAsOf: typeof Api.selectAsOf = rulepack.selectAsOf;
const _localDate: typeof Api.localDate = rulepack.localDate;
const _activeRules: typeof Api.activeRules = rulepack.activeRules;

// Built-in packs
const _builtinPacks: typeof Api.BUILTIN_PACKS = packs.BUILTIN_PACKS;

// K5 detect
const _maxScanInput: typeof Api.MAX_SCAN_INPUT = detect.MAX_SCAN_INPUT;
const _scan: typeof Api.scan = detect.scan;
const _redact: typeof Api.redact = detect.redact;
const _verhoeffValid: typeof Api.verhoeffValid = detect.verhoeffValid;
const _gstinValid: typeof Api.gstinValid = detect.gstinValid;
const _upiHandleValid: typeof Api.upiHandleValid = detect.upiHandleValid;
const _shannonEntropy: typeof Api.shannonEntropy = detect.shannonEntropy;
const _maskSecret: typeof Api.maskSecret = detect.maskSecret;

void [
  _plinthVersion,
  _genesisDigest,
  _plinthError,
  _errorMessages,
  _b64urlEncode,
  _b64urlDecode,
  _hexEncode,
  _hexDecode,
  _utf8Encode,
  _sha256Bytes,
  _parseJson,
  _canonicalize,
  _digest,
  _digestBytes,
  _thumbprintMembers,
  _kidOf,
  _jwkFromP256Spki,
  _ed25519PublicJwk,
  _testKids,
  _isTestKid,
  _p1363ToDer,
  _derToP1363,
  _signingInput,
  _signEd25519,
  _createEnvelope,
  _verifyEnvelope,
  _webauthnChallenge,
  _signatureFromAssertion,
  _newUuidV7,
  _newNonce,
  _isTimestamp,
  _timestampFromMs,
  _eventHash,
  _appendEvent,
  _createCheckpoint,
  _prunedEventDraft,
  _verifyChain,
  _parseExport,
  _serializeExport,
  _lintPersonalData,
  _auditCheckpointPolicy,
  _skewSeconds,
  _decisionPolicy,
  _registryPolicy,
  _approvalCheckpointPolicy,
  _createApprovalRequest,
  _matchingCode,
  _decisionPayload,
  _trustedKeysFromRegistry,
  _verifyRegistryChain,
  _verifyApproval,
  _verifyAndConsume,
  _memoryConsumedIdStore,
  _newBreakGlassCode,
  _breakGlassDigest,
  _verifyBreakGlass,
  _loadPack,
  _selectAsOf,
  _localDate,
  _activeRules,
  _builtinPacks,
  _maxScanInput,
  _scan,
  _redact,
  _verhoeffValid,
  _gstinValid,
  _upiHandleValid,
  _shannonEntropy,
  _maskSecret,
];

const CORE_EXPORTS = [
  'ERROR_MESSAGES',
  'GENESIS_DIGEST',
  'PLINTH_VERSION',
  'PlinthError',
  'TEST_KIDS',
  'b64urlDecode',
  'b64urlEncode',
  'canonicalize',
  'createEnvelope',
  'derToP1363',
  'digest',
  'digestBytes',
  'ed25519PublicJwk',
  'hexDecode',
  'hexEncode',
  'isTestKid',
  'isTimestamp',
  'jwkFromP256Spki',
  'kidOf',
  'newNonce',
  'newUuidV7',
  'p1363ToDer',
  'parseJson',
  'sha256Bytes',
  'signEd25519',
  'signatureFromAssertion',
  'signingInput',
  'thumbprintMembers',
  'timestampFromMs',
  'utf8Encode',
  'verifyEnvelope',
  'webauthnChallenge',
].sort();

const AUDIT_EXPORTS = [
  'CHECKPOINT_POLICY',
  'appendEvent',
  'createCheckpoint',
  'eventHash',
  'lintPersonalData',
  'parseExport',
  'prunedEventDraft',
  'serializeExport',
  'verifyChain',
].sort();

const APPROVAL_EXPORTS = [
  'CHECKPOINT_POLICY',
  'DECISION_POLICY',
  'MemoryConsumedIdStore',
  'REGISTRY_POLICY',
  'SKEW_SECONDS',
  'breakGlassDigest',
  'createApprovalRequest',
  'decisionPayload',
  'matchingCode',
  'newBreakGlassCode',
  'trustedKeysFromRegistry',
  'verifyAndConsume',
  'verifyApproval',
  'verifyBreakGlass',
  'verifyRegistryChain',
].sort();

const RULEPACK_EXPORTS = ['activeRules', 'loadPack', 'localDate', 'selectAsOf'].sort();

const DETECT_EXPORTS = [
  'MAX_SCAN_INPUT',
  'gstinValid',
  'maskSecret',
  'redact',
  'scan',
  'shannonEntropy',
  'upiHandleValid',
  'verhoeffValid',
].sort();

const PACKS_EXPORTS = ['BUILTIN_PACKS'].sort();

const ROOT_EXPORTS = [
  ...new Set([
    ...CORE_EXPORTS,
    ...AUDIT_EXPORTS,
    ...APPROVAL_EXPORTS,
    ...RULEPACK_EXPORTS,
    ...DETECT_EXPORTS,
    ...PACKS_EXPORTS,
  ]),
].sort();

describe('API conformance', () => {
  it('exports exactly the API names', () => {
    expect(Object.keys(core).sort()).toEqual(CORE_EXPORTS);
    expect(Object.keys(audit).sort()).toEqual(AUDIT_EXPORTS);
    expect(Object.keys(approval).sort()).toEqual(APPROVAL_EXPORTS);
    expect(Object.keys(rulepack).sort()).toEqual(RULEPACK_EXPORTS);
    expect(Object.keys(detect).sort()).toEqual(DETECT_EXPORTS);
    expect(Object.keys(packs).sort()).toEqual(PACKS_EXPORTS);
    expect(Object.keys(root).sort()).toEqual(ROOT_EXPORTS);
  });
});
