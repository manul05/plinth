import type { ErrorCode } from '../errors.js';
import type { Approver } from './registry.js';

/**
 * Checks that a verified envelope signer satisfies the approver's profile/alg binding and synced-passkey policy.
 */
export function checkApproverSignerPolicy(
  approver: Approver,
  signer: { alg: string; flags?: { be: boolean } },
  allowSyncedPasskeys: boolean,
): ErrorCode | undefined {
  if ((approver.profile === 'webauthn') !== (signer.alg === 'webauthn-ES256')) {
    return 'PK_APPROVAL_PROFILE_ALG_MISMATCH';
  }
  if (signer.flags?.be === true && allowSyncedPasskeys !== true) {
    return 'PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED';
  }
  return undefined;
}
