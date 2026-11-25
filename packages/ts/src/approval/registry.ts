import {
  type Digest,
  digest,
  isTimestamp,
  kidOf,
  type P256PublicJwk,
  type TrustedKey,
  verifyEnvelope,
} from '../core/index.js';
import { type ErrorCode, PlinthError } from '../errors.js';
import { REGISTRY_POLICY } from './policies.js';

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
  update_threshold?: number;
}

export type RegistryResult =
  | { valid: true; version: number; registry_digest: Digest; registry: RegistryPayload }
  | { valid: false; error: ErrorCode; at_version: number };

const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidApproverShape(a: unknown): a is Record<string, unknown> {
  if (!isRecord(a)) return false;
  if (typeof a.id !== 'string' || a.id.length < 1 || typeof a.display !== 'string' || a.display.length < 1) {
    return false;
  }
  if (typeof a.kid !== 'string') return false;
  if (a.profile !== 'webauthn' && a.profile !== 'android-keystore' && a.profile !== 'windows-tpm') return false;
  if (!Array.isArray(a.roles) || a.roles.length < 1 || !a.roles.every((r) => typeof r === 'string' && r.length >= 1)) {
    return false;
  }
  if (typeof a.added_at !== 'string' || !isTimestamp(a.added_at)) return false;
  if (a.webauthn !== undefined) {
    if (
      !isRecord(a.webauthn) ||
      typeof a.webauthn.rp_id !== 'string' ||
      a.webauthn.rp_id.length < 1 ||
      !Array.isArray(a.webauthn.origins) ||
      a.webauthn.origins.length < 1 ||
      !a.webauthn.origins.every((o) => typeof o === 'string')
    ) {
      return false;
    }
  }
  return true;
}

function isValidRegistryPayload(p: Record<string, unknown>): boolean {
  if (
    p.spec !== 'pk-approval/1.0' ||
    typeof p.realm !== 'string' ||
    p.realm.length < 1 ||
    typeof p.version !== 'number' ||
    !Number.isSafeInteger(p.version) ||
    p.version < 1 ||
    !Array.isArray(p.approvers) ||
    p.approvers.length < 1 ||
    !Array.isArray(p.break_glass) ||
    typeof p.max_ttl_seconds !== 'number' ||
    !Number.isSafeInteger(p.max_ttl_seconds) ||
    p.max_ttl_seconds < 60 ||
    p.max_ttl_seconds > 86400 ||
    typeof p.allow_synced_passkeys !== 'boolean'
  ) {
    return false;
  }
  if (
    p.update_threshold !== undefined &&
    (typeof p.update_threshold !== 'number' ||
      !Number.isSafeInteger(p.update_threshold) ||
      p.update_threshold < 1 ||
      p.update_threshold > 5)
  ) {
    return false;
  }
  if (
    !p.break_glass.every((bg) => isRecord(bg) && typeof bg.code_digest === 'string' && DIGEST_RE.test(bg.code_digest))
  ) {
    return false;
  }
  return p.approvers.every(isValidApproverShape);
}

/**
 * Extracts `TrustedKey` entries from a registry's approver list for envelope verification.
 */
export function trustedKeysFromRegistry(registry: RegistryPayload): TrustedKey[] {
  return registry.approvers.map((approver) => {
    const key: TrustedKey = { kid: approver.kid, jwk: approver.jwk };
    if (approver.webauthn !== undefined && isRecord(approver.webauthn)) {
      key.webauthn = { rp_id: approver.webauthn.rp_id, origins: approver.webauthn.origins };
    }
    return key;
  });
}

/**
 * Verifies a signed registry evolution chain from genesis up to the latest version. Never throws.
 */
export function verifyRegistryChain(input: {
  envelopes: readonly unknown[];
  genesisDigest: Digest;
  highestSeenVersion: number;
}): RegistryResult {
  try {
    if (!Array.isArray(input.envelopes) || input.envelopes.length === 0) {
      return { valid: false, error: 'PK_APPROVAL_REGISTRY_MALFORMED', at_version: -1 };
    }

    let previous: RegistryPayload | undefined;

    for (let i = 0; i < input.envelopes.length; i++) {
      const e = input.envelopes[i];
      const payloadRaw = isRecord(e) ? e.payload : undefined;
      const atVersion =
        isRecord(payloadRaw) && typeof payloadRaw.version === 'number' && Number.isSafeInteger(payloadRaw.version)
          ? payloadRaw.version
          : -1;

      if (
        !isRecord(e) ||
        !isRecord(payloadRaw) ||
        e.type !== 'pk.approval.registry' ||
        !isValidRegistryPayload(payloadRaw)
      ) {
        return { valid: false, error: 'PK_APPROVAL_REGISTRY_MALFORMED', at_version: atVersion };
      }

      for (const approver of payloadRaw.approvers as Array<Record<string, unknown>>) {
        let computedKid: Digest;
        try {
          computedKid = kidOf(approver.jwk);
        } catch (err) {
          const code = err instanceof PlinthError ? err.code : 'PK_KEY_INVALID';
          return { valid: false, error: code, at_version: atVersion };
        }
        if (computedKid !== approver.kid) {
          return { valid: false, error: 'PK_KEY_KID_MISMATCH', at_version: atVersion };
        }
      }

      const reg = payloadRaw as unknown as RegistryPayload;

      if (i === 0) {
        let payloadDigest: Digest;
        try {
          payloadDigest = digest(payloadRaw);
        } catch (err) {
          const code = err instanceof PlinthError ? err.code : 'PK_APPROVAL_REGISTRY_MALFORMED';
          return { valid: false, error: code, at_version: atVersion };
        }
        if (reg.version !== 1 || payloadDigest !== input.genesisDigest) {
          return { valid: false, error: 'PK_APPROVAL_REGISTRY_GENESIS_MISMATCH', at_version: atVersion };
        }
        const res = verifyEnvelope(e, {
          trustedKeys: trustedKeysFromRegistry(reg),
          policy: REGISTRY_POLICY,
        });
        if (!res.valid) {
          return { valid: false, error: res.error, at_version: atVersion };
        }
      } else {
        const prev = previous as RegistryPayload;
        if (reg.realm !== prev.realm) {
          return { valid: false, error: 'PK_APPROVAL_REALM_MISMATCH', at_version: atVersion };
        }
        if (reg.version !== prev.version + 1) {
          return { valid: false, error: 'PK_APPROVAL_REGISTRY_VERSION_GAP', at_version: atVersion };
        }
        const res = verifyEnvelope(e, {
          trustedKeys: trustedKeysFromRegistry(prev),
          policy: REGISTRY_POLICY,
        });
        if (!res.valid) {
          const error = res.error === 'PK_SIG_UNKNOWN_KID' ? 'PK_APPROVAL_REGISTRY_UNAUTHORISED' : res.error;
          return { valid: false, error, at_version: atVersion };
        }
        const threshold = prev.update_threshold ?? 1;
        const distinctApproverIds = new Set<string>();
        for (const signer of res.signers) {
          const approver = prev.approvers.find((a) => a.kid === signer.kid);
          if (approver !== undefined) {
            distinctApproverIds.add(approver.id);
          }
        }
        if (distinctApproverIds.size < threshold) {
          return { valid: false, error: 'PK_APPROVAL_REGISTRY_UNAUTHORISED', at_version: atVersion };
        }
      }

      previous = reg;
    }

    const last = previous as RegistryPayload;
    if (last.version < input.highestSeenVersion) {
      return { valid: false, error: 'PK_APPROVAL_REGISTRY_ROLLBACK', at_version: last.version };
    }

    return {
      valid: true,
      version: last.version,
      registry_digest: digest(last),
      registry: last,
    };
  } catch {
    return { valid: false, error: 'PK_APPROVAL_REGISTRY_MALFORMED', at_version: -1 };
  }
}
