---
title: Security Overview
tags: [security, api, protection]
created: 2025-06-01
updated: 2025-10-27
---

# Security Overview

Secure AI integration with API key protection and rate limiting.

## Core Security Features

**Server-Side Only**: API keys never exposed to browser
**Rate Limiting**: 50 requests/hour per IP prevents abuse  
**Input Validation**: All API inputs sanitized and validated
**Secure Proxy**: Client requests routed through Next.js API routes

## Quick Verification

```bash
# Test security implementation
cd docs/security
./demo-secure-api.sh
```

## Best Practices

**Development**: Use `GEMINI_API_KEY` in `.env.local` (never `NEXT_PUBLIC_`)
**Production**: Configure environment variables in deployment platform
**Code Review**: Check for exposed secrets, verify rate limiting active

## CI Security Scanning

The CI pipeline runs security checks on every PR to catch vulnerabilities before they hit production. This has caught real issues with outdated dependencies and known CVEs.

**Security Scan job** runs `npm audit --production --audit-level=high` on every pull request. It also captures `npm outdated` metadata so you can see which dependencies are falling behind. The results get saved as artifacts (check `ci-security/summary.md`, `npm-audit.json`, and `npm-outdated.json` in the workflow run).

**CodeQL analysis** runs on pushes, pull requests, and Monday mornings at 09:00 UTC. It's set to `fail-on: none` so new security alerts show up in the GitHub Security tab without blocking deploys. This gives you time to triage and fix issues without emergency hotfixes.

**Next step**: Once you've triaged the backlog of vulnerabilities, tighten the thresholds by removing `continue-on-error`. That way CI will actually fail if critical issues persist, instead of just logging warnings nobody reads.

### Reviewing `npm-outdated.json`

1. Open the latest **Security Scan** workflow run (from the PR timeline or **Actions → Security Scan**), download the `ci-security` artifact, and unzip it locally.
2. Inspect `npm-outdated.json` with `jq` or VS Code. For a quick table view, run:
   ```bash
   jq -r 'to_entries[] | [.key, .value.current, .value.wanted, .value.latest] | @tsv' npm-outdated.json | column -t
   ```
3. Cross-check each package against `package.json` to confirm whether it is a runtime dependency (`dependencies`) or tooling/test dependency (`devDependencies`).
4. Capture the status in the GitHub ticket you’re working from (or open a new one), then rerun `npm outdated --json` locally to confirm the plan before implementation.
