# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

- Preferred: GitHub **private vulnerability reporting** on this repository (Security tab →
  "Report a vulnerability"). <!-- Available once the repo is public; enable it in Settings → Code security. -->
- Before the repository is public there is no external reporting channel (only the owner and his agents can see it). This line is replaced in task T-MR-08.

Include what you found, how to reproduce it, the version or commit, and the impact you expect.
Please give me a reasonable time to fix it before you disclose it publicly.

## What to expect

This is a one-person project, so these are best-effort targets, not guarantees:

| Step | Target |
|---|---|
| Acknowledge your report | within 7 days |
| First assessment (accepted / not a vulnerability / need more info) | within 14 days |
| Fix or mitigation for high and critical issues | as fast as practical; you will be kept informed |

You will be credited in the release notes unless you prefer not to be.

## Supported versions

| Version | Supported |
|---|---|
| Latest release (`v0.1`) | Yes |
| Older releases | No: please upgrade |

## Scope

In scope: the code, contracts, test vectors and rule packs in this repository (there is no hosted service).
Out of scope: denial of service by volume, social engineering, findings in third-party services
or dependencies that are already publicly known (report those upstream), and reports from
automated scanners without a demonstrated impact.

## Safe harbour

Good-faith research that respects users' privacy, avoids data destruction and service disruption,
uses only your own accounts and test data, and follows this policy will not lead to any complaint
from me.

## How this project handles security

- Threat model: [docs/05-threat-model.md](docs/05-threat-model.md)
- Security review and its findings: [docs/07-security-review.md](docs/07-security-review.md)
- Secrets never live in the repository; [.env.example](.env.example) lists the names only.
