import type { Digest } from '../core/index.js';

export type PackKind = 'secret-detection' | 'pii-detection' | 'untrusted-text';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface SecretBody {
  provider: string;
  short: string;
  secret_kind: 'secret' | 'public_id' | 'token' | 'private_key';
  environment: 'live' | 'test' | 'unknown';
  regex: string;
  flags?: string;
  secret_group: number;
  keywords: string[];
  entropy_min?: string;
  pair_with?: { rules: string[]; within_chars: number };
  allow: string[];
  severity: Severity;
  personal_data_reach: string;
  rotation_url: string;
}

export interface PiiBody {
  pii_type: string;
  regex: string;
  flags?: string;
  validator: 'verhoeff' | 'gstin' | 'upi_handle' | 'none';
  context_keywords: string[];
  mask: { store: 'never' | 'masked' | 'encrypted'; display: 'last4' | 'none' };
  severity: Severity;
  handles?: string[];
}

export type UntrustedBody =
  | { class: 'hidden_char'; ranges: [number, number][]; severity: Severity }
  | { class: 'phrase'; regex: string; flags?: string; severity: Severity };

export interface Rule {
  id: string;
  rev: number;
  title: string;
  description: string;
  status: 'experimental' | 'stable' | 'deprecated' | 'withdrawn';
  verified: { state: 'verified' | 'unverified'; by?: string; at?: string; note: string };
  source_refs: { source_id: string; locator: string }[];
  effective_from: string;
  effective_until?: string;
  changes: { rev: number; date: string; summary: string; source_ref?: string }[];
  tags: string[];
  body: SecretBody | PiiBody | UntrustedBody;
}

export interface PackManifest {
  spec: 'pk-rulepack/1.0';
  id: string;
  kind: PackKind;
  version: string;
  released_at: string;
  tz: 'Asia/Kolkata' | 'UTC';
  licence: 'MIT';
  attribution: string[];
  sources: {
    id: string;
    title: string;
    publisher: string;
    url: string;
    retrieved_at: string;
    doc_version: string;
    doc_sha256?: Digest;
  }[];
  files: { path: 'rules.json' | 'tests.json'; sha256: Digest }[];
  min_engine: 'pk-rulepack/1.0';
}

export interface RulesFile {
  spec: 'pk-rulepack/1.0';
  pack_id: string;
  rules: Rule[];
}

export interface TestsFile {
  spec: 'pk-rulepack/1.0';
  pack_id: string;
  tests: { rule_id: string; input_parts: string[]; expect: 'match' | 'no_match'; note?: string }[];
}

export interface CompiledPack {
  manifest: PackManifest;
  rules: RulesFile;
  tests: TestsFile;
}

export interface LoadedPack {
  manifest: PackManifest;
  rules: readonly Rule[];
}

export function loadPack(_pack: CompiledPack): LoadedPack {
  throw new Error('not implemented');
}
