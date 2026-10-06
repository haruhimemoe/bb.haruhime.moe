# Security

Please report vulnerabilities privately, not in an issue or the Discord server:

1. **GitHub private vulnerability reporting** (preferred): [report a vulnerability](https://github.com/haruhimemoe/bb.haruhime.moe/security/advisories/new) on this repository.
2. **Email**: haruhime@haruhime.moe, if you can't use GitHub.

Include steps to reproduce and the impact you expect. You'll get a reply within 7 days.

In scope: this repository and the live site at https://bb.haruhime.moe, its osu! sign-in, the template routes (`/api/templates`), account deletion (`/api/account`), the admin route (`/api/admin`), player lookups (`/api/osu/users`) and pool import (`/api/pools`). The BBCode preview must never run script or break out of its markup, whatever a template or draft holds; report any way to make it. Only the current `main` branch and the live site are supported.

The `@haruhimemoe` packages bb uses have their own repositories and SECURITY.md files; report problems with them there. Report problems in third-party services (osu!) to those services.
