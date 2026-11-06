# Plinth error codes (0.1)

Source of truth: `contracts/errors.json` (this table is generated from it; if they differ, the JSON wins). `PlinthError.message` is `<code>: <message>` and, when a detail is present, `<code>: <message> (<detail>)`. Details never contain secret values or personal data.

| Component | Code | Message |
|---|---|---|
| K0 | `PK_JSON_SYNTAX` | The JSON text is not valid JSON. |
| K0 | `PK_JSON_TOO_DEEP` | The JSON value is nested deeper than 64 levels. |
| K0 | `PK_JCS_DUPLICATE_KEY` | An object has the same member name twice. |
| K0 | `PK_JCS_LONE_SURROGATE` | A string contains a lone UTF-16 surrogate. |
| K0 | `PK_JCS_NON_INTEGER` | A number has a fraction or exponent; only integers are allowed. |
| K0 | `PK_JCS_INT_RANGE` | An integer is outside -(2^53-1) to 2^53-1. |
| K0 | `PK_JCS_NULL` | null is not allowed; omit the member instead. |
| K0 | `PK_JCS_UNSUPPORTED_TYPE` | The value is not a string, integer, boolean, array or plain object. |
| K0 | `PK_ENCODING_INVALID` | The bytes are not valid base64url, hex or DER. |
| K0 | `PK_KEY_UNSUPPORTED` | Only Ed25519 (OKP) and P-256 (EC) public keys are supported. |
| K0 | `PK_KEY_INVALID` | The public key bytes are malformed or the point is not on the curve. |
| K0 | `PK_KEY_KID_MISMATCH` | The kid does not match the key it is listed with. |
| K0 | `PK_ENVELOPE_MALFORMED` | The signed envelope does not have the required shape. |
| K0 | `PK_SPEC_UNSUPPORTED` | The spec version is unknown or newer than this verifier supports. |
| K0 | `PK_SIG_TYPE_NOT_ALLOWED` | The envelope type is not on this verifier's allowlist. |
| K0 | `PK_SIG_NONE` | The envelope has no signatures. |
| K0 | `PK_SIG_UNKNOWN_ALG` | The signature algorithm is unknown. |
| K0 | `PK_SIG_ALG_NOT_ALLOWED` | The signature algorithm is not allowed for this envelope type. |
| K0 | `PK_SIG_UNKNOWN_KID` | The signing key is not in the trusted keys. |
| K0 | `PK_SIG_DUPLICATE_KID` | The same key signed the envelope twice. |
| K0 | `PK_SIG_KEY_ALG_MISMATCH` | The key type does not match the signature algorithm. |
| K0 | `PK_SIG_INVALID` | The signature does not verify. |
| K0 | `PK_SIG_INSUFFICIENT` | Fewer valid signatures than the policy requires. |
| K0 | `PK_WEBAUTHN_NO_CONFIG` | The trusted key has no WebAuthn relying-party settings. |
| K0 | `PK_WEBAUTHN_MALFORMED` | The WebAuthn authenticator data or client data is malformed. |
| K0 | `PK_WEBAUTHN_TYPE` | The WebAuthn client data type is not webauthn.get. |
| K0 | `PK_WEBAUTHN_CHALLENGE` | The WebAuthn challenge does not match the signed content. |
| K0 | `PK_WEBAUTHN_ORIGIN` | The WebAuthn origin is not one of the registered origins. |
| K0 | `PK_WEBAUTHN_CROSS_ORIGIN` | The WebAuthn assertion was made in a cross-origin frame. |
| K0 | `PK_WEBAUTHN_RPID` | The WebAuthn relying-party ID hash does not match. |
| K0 | `PK_WEBAUTHN_UP` | The authenticator did not report user presence. |
| K0 | `PK_WEBAUTHN_UV` | The authenticator did not report user verification (fingerprint, face or PIN). |
| K1 | `PK_AUDIT_EMPTY` | The audit export has no events. |
| K1 | `PK_AUDIT_EVENT_MALFORMED` | An audit event does not have the required shape. |
| K1 | `PK_AUDIT_RESERVED_ACTION` | Actions starting with pk. are reserved for Plinth. |
| K1 | `PK_AUDIT_CHAIN_MISMATCH` | An event or checkpoint belongs to a different chain. |
| K1 | `PK_AUDIT_HASH_MISMATCH` | An event does not match its stored hash. |
| K1 | `PK_AUDIT_SEQ_GAP` | Event sequence numbers are missing or out of order. |
| K1 | `PK_AUDIT_PREV_MISMATCH` | An event does not link to the hash of the event before it. |
| K1 | `PK_AUDIT_CHECKPOINT_MALFORMED` | A checkpoint does not have the required shape. |
| K1 | `PK_AUDIT_CHECKPOINT_SIG_INVALID` | A checkpoint signature does not verify against the trusted keys. |
| K1 | `PK_AUDIT_CHECKPOINT_MISMATCH` | A checkpoint head does not match the event hash at its sequence number. |
| K1 | `PK_AUDIT_TRUNCATED` | A checkpoint covers events that are missing from the export. |
| K1 | `PK_AUDIT_PRUNED_WITHOUT_ANCHOR` | Older events were removed but no checkpoint anchors the new start. |
| K1 | `PK_AUDIT_PRUNE_UNRECORDED` | Older events were removed without a pk.audit.pruned event. |
| K1 | `PK_AUDIT_UNANCHORED_TAIL` | Warning: the newest events are intact but not yet covered by a checkpoint. |
| K2 | `PK_APPROVAL_REQUEST_MALFORMED` | The approval request does not have the required shape. |
| K2 | `PK_APPROVAL_REALM_MISMATCH` | The approval request or registry is for a different realm. |
| K2 | `PK_APPROVAL_UNKNOWN_ACTION` | The action is not on this product's list of approvable actions. |
| K2 | `PK_APPROVAL_REGISTRY_STALE` | The request was made against a newer approver registry than this verifier holds. |
| K2 | `PK_APPROVAL_SUBJECT_MISMATCH` | The thing about to be done is not the thing that was approved. |
| K2 | `PK_APPROVAL_TTL_TOO_LONG` | The request lifetime is longer than the registry allows. |
| K2 | `PK_APPROVAL_NOT_YET_VALID` | The request was created more than 5 minutes in the future. |
| K2 | `PK_APPROVAL_EXPIRED` | The approval has expired. |
| K2 | `PK_APPROVAL_WINDOW_NOT_OPEN` | The approved window has not opened yet. |
| K2 | `PK_APPROVAL_WINDOW_CLOSED` | The approved window has closed. |
| K2 | `PK_APPROVAL_REPLAYED` | This approval has already been used. |
| K2 | `PK_APPROVAL_NO_DECISION` | No signed decision was supplied. |
| K2 | `PK_APPROVAL_DECISION_MALFORMED` | A decision does not have the required shape. |
| K2 | `PK_APPROVAL_REQUEST_MISMATCH` | The decision was signed for a different request. |
| K2 | `PK_APPROVAL_APPROVER_MISMATCH` | The decision names a different approver than the key that signed it. |
| K2 | `PK_APPROVAL_PROFILE_ALG_MISMATCH` | The signature algorithm does not match the approver's key profile. |
| K2 | `PK_APPROVAL_SYNCED_KEY_NOT_ALLOWED` | This realm requires a device-bound key; a synced passkey was used. |
| K2 | `PK_APPROVAL_DENIED` | An approver denied the request. |
| K2 | `PK_APPROVAL_DECISION_TIME` | The decision time is outside the request lifetime. |
| K2 | `PK_APPROVAL_REQUESTER_UNKNOWN` | The policy needs the requester's human identity, and it is missing. |
| K2 | `PK_APPROVAL_SELF_APPROVAL` | The requester cannot approve their own request. |
| K2 | `PK_APPROVAL_INSUFFICIENT` | Not enough distinct approvers. |
| K2 | `PK_APPROVAL_REGISTRY_MALFORMED` | The approver registry does not have the required shape. |
| K2 | `PK_APPROVAL_REGISTRY_GENESIS_MISMATCH` | The first registry does not match the pinned genesis digest. |
| K2 | `PK_APPROVAL_REGISTRY_VERSION_GAP` | Registry versions must increase by exactly 1. |
| K2 | `PK_APPROVAL_REGISTRY_UNAUTHORISED` | A registry change was not signed by an existing approver. |
| K2 | `PK_APPROVAL_REGISTRY_ROLLBACK` | The registry is older than one this verifier has already seen. |
| K2 | `PK_APPROVAL_BREAK_GLASS_FORMAT` | A recovery code is 20 characters A-Z and 2-7, in four groups of five. |
| K2 | `PK_APPROVAL_BREAK_GLASS_UNKNOWN` | This recovery code is not in the registry. |
| K2 | `PK_APPROVAL_BREAK_GLASS_USED` | This recovery code has already been used. |
| K4 | `PK_RULEPACK_YAML_SYNTAX` | The YAML file has a syntax error. |
| K4 | `PK_RULEPACK_YAML_DUPLICATE_KEY` | The YAML file has a duplicate key. |
| K4 | `PK_RULEPACK_YAML_MULTI_DOC` | The YAML file has more than one document. |
| K4 | `PK_RULEPACK_YAML_ANCHOR` | YAML anchors and aliases are not allowed. |
| K4 | `PK_RULEPACK_YAML_TAG` | Explicit YAML tags are not allowed. |
| K4 | `PK_RULEPACK_YAML_AMBIGUOUS_SCALAR` | Quote this value: unquoted dates, yes/no/on/off, decimals, octal-like numbers and empty values are not allowed. |
| K4 | `PK_RULEPACK_SCHEMA` | The rule-pack file does not match its JSON Schema. |
| K4 | `PK_RULEPACK_KIND_UNSUPPORTED` | This rule-pack kind has no body definition in this version. |
| K4 | `PK_RULEPACK_DUPLICATE_REV` | Two rules have the same id and rev. |
| K4 | `PK_RULEPACK_OVERLAP` | Two revisions of one rule have overlapping effective dates. |
| K4 | `PK_RULEPACK_UNKNOWN_PAIR_RULE` | pair_with names a rule that is not in the pack. |
| K4 | `PK_RULEPACK_REGEX_INVALID` | The regular expression does not compile. |
| K4 | `PK_RULEPACK_REGEX_DIALECT` | The regular expression uses a feature outside the portable dialect. |
| K4 | `PK_RULEPACK_REGEX_UNSAFE` | The regular expression has nested quantifiers (risk of catastrophic backtracking). |
| K4 | `PK_RULEPACK_TESTS_MISSING` | Every rule needs at least one match test and one no_match test. |
| K4 | `PK_RULEPACK_TEST_FAILED` | A rule test did not give the expected result. |
| K4 | `PK_RULEPACK_FILE_HASH_MISMATCH` | A rule-pack file does not match the digest in its manifest. |
| K4 | `PK_RULEPACK_TZ_UNSUPPORTED` | Only the Asia/Kolkata and UTC time zones are supported. |
| K5 | `PK_DETECT_INPUT_TOO_LARGE` | The text is longer than 1,000,000 characters. |
| K5 | `PK_DETECT_SECRET_REQUIRED` | Redaction needs an installation secret of at least 32 bytes. |
| K5 | `PK_DETECT_UNKNOWN_VALIDATOR` | The rule names a validator this version does not have. |

97 codes. Codes used by the golden vectors: 74.
