import type { TypePolicy } from '../core/index.js';

export const SKEW_SECONDS = 300 as const;

export const DECISION_POLICY: TypePolicy = {
  'pk.approval.decision': { algs: ['webauthn-ES256', 'ES256'], min_signatures: 1 },
};

export const REGISTRY_POLICY: TypePolicy = {
  'pk.approval.registry': { algs: ['webauthn-ES256', 'ES256'], min_signatures: 1 },
};
