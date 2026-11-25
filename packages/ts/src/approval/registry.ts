import type { Digest, P256PublicJwk, TrustedKey } from '../core/index.js';
import type { ErrorCode } from '../errors.js';

export type ApproverProfile = 'webauthn' | 'android-keystore' | 'windows-tpm';

export interface Approver {
  id: string;
  display: string;
  kid: Digest;
  jwk: P256PublicJwk;
  profile: ApproverProfile;
  roles: string[];
  added_at: string;
  webauthn?: {
    rp_id: string;
    origins: string[];
    credential_id: string;
    backup_eligible: boolean;
    backup_state: boolean;
  };
  hardware?: boolean;
}

export interface RegistryPayload {
  spec: 'pk-approval/1.0';
  realm: string;
  version: number;
  approvers: Approver[];
  break_glass: { code_digest: Digest }[];
  max_ttl_seconds: number;
  allow_synced_passkeys: boolean;
}

export type RegistryResult =
  | { valid: true; version: number; registry_digest: Digest; registry: RegistryPayload }
  | { valid: false; error: ErrorCode; at_version: number };

export function trustedKeysFromRegistry(_registry: RegistryPayload): TrustedKey[] {
  throw new Error('not implemented');
}

export function verifyRegistryChain(_input: {
  envelopes: readonly unknown[];
  genesisDigest: Digest;
  highestSeenVersion: number;
}): RegistryResult {
  throw new Error('not implemented');
}
