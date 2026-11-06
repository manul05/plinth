# Pattern: "the dangerous button needs two hands"

**Status:** Plinth 0.1 pattern (2026-10-31). Applies to every portfolio product. The cryptographic part is K2 (`contracts/spec/k2-approval.md`); this file fixes the **user experience and logging** so every product behaves the same. Products may be stricter, never looser.

## 1. What counts as dangerous
Anything that is hard to undo or reaches outside the product: pushing or merging to a protected branch, production writes, deleting data, rotating or revoking keys, sending data to a third party, changing who can approve. Each product lists its dangerous actions as a closed list of action names (`<product>.<area>.<verb>`), the same names used in K2 `allowedActions` and K1 events.

## 2. The confirmation screen (every product, every platform)
1. **Preview computed by the system, not the requester:** title, exact target (repo + ref + short SHA, record id, environment), risk badges (`main`, `force-push`, `production`, `secrets paths`, `deletes N records`).
2. **Consequence sentence**, plain English, present tense, with the number: "This pushes 3 commits to main of passdown." Never "Are you sure?".
3. **Matching code:** the 6-digit `matchingCode(request)` shown in large monospace on both the requesting screen and the approving screen, grouped `823 898`. The approver confirms they match.
4. **Hold to confirm:** a button the user holds for **1.5 seconds**, with a visible progress ring; releasing early cancels. Keyboard: Space or Enter held for 1.5 s. Screen readers announce "Hold for one and a half seconds to approve".
5. **Biometric / passkey:** the hold triggers the WebAuthn (or Keystore / Windows Hello) prompt with user verification required.
6. **Deny is one tap** and always visible; deny is signed too (K2 decision `deny`).
7. Expiry countdown shown (default 10 minutes, production windows 30 minutes).

## 3. Typed confirmation (extra step for irreversible deletes)
For actions that destroy data, the user also types the target name (for example the repo name) before the hold button activates. Case-sensitive, no paste.

## 4. Undo window
Where the action can be delayed, it runs after a **10-second undo window** with an "Undo" button; the K1 event is written when it actually runs.

## 5. Solo fallback (no second key available)
Hold-to-confirm + biometric unlock of the device + typed reason (≥ 10 characters) + undo window. This is **not** a K2 approval: log it with `data.assurance = "single-person"` and show it as weaker in any report.

## 6. What gets logged (K1 events)
| Moment | Action name | data | refs |
|---|---|---|---|
| Request created | `<product>.approval.requested` | `{matching_code, action, expires_at}` | — |
| Approved / denied | `<product>.approval.granted` / `.denied` | `{approver_id, assurance: "two-person" or "single-approver"}` | `[{kind:"pk.approval.decision", digest}]` |
| Action executed | the action name itself | product fields (IDs and digests only) | the decision digest |
| Break-glass used | `pk.approval.break_glass_used` | `{code_digest}` | — (and raise an alarm) |
| Window opened / closed | `<product>.window.opened` / `.closed` | `{opens_at, closes_at}` | decision digest |

## 7. Wording rules
Name the thing ("main", "production database"), give the number, never use "Are you sure", never blame the user, and say what happens if they do nothing ("If you do nothing, the push is refused in 10 minutes.").
