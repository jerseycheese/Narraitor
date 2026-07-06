---
title: Security Overview
tags: [security, api, protection]
created: 2025-06-01
updated: 2026-05-22
---

# Security Overview

Secure AI integration that keeps the Gemini API key off the client, routes everything through
server-side API routes, and rate-limits the AI endpoints per IP.

## Core Security Features

**Server-Side Only**: The `GEMINI_API_KEY` lives on the server and never reaches the browser
**Secure Proxy**: Client requests go through Next.js API routes (`src/app/api/`), which make the actual AI calls
**Rate Limiting**: 50 requests/hour per IP in production (500 in dev), enforced by an in-memory limiter (`src/utils/rateLimiter.ts`) on the narrative generation routes via `src/utils/apiHelpers.ts`. Over the limit returns HTTP 429 with `X-RateLimit-*` headers.
**Input Validation**: API inputs are validated and sanitized before use

Separately, outbound AI calls are throttled with fixed delays for item processing and image requests (`src/lib/narrative/itemProcessorShared.ts`, `src/lib/services/imageRequestCoordinator.ts`) to stay under provider limits.

## Quick Verification

```bash
# Test security implementation
cd public_docs/security
./demo-secure-api.sh
```

## Best Practices

**Development**: Use `GEMINI_API_KEY` in `.env.local` (never `NEXT_PUBLIC_`)
**Production**: Configure environment variables in the deployment platform
**Code Review**: Check for exposed secrets and confirm AI calls stay server-side

## CI Security Scanning

The CI pipeline runs security checks on every PR to catch vulnerabilities before they hit production. This has caught real issues with outdated dependencies and known CVEs.

**Security Scan job** runs `npm audit --production --audit-level=high` on every pull request. It also captures `npm outdated` metadata so you can see which dependencies are falling behind. The results get saved as artifacts (check `ci-security/summary.md`, `npm-audit.json`, and `npm-outdated.json` in the workflow run).

**CodeQL analysis** runs on pushes, pull requests, and Monday mornings at 09:00 UTC. It's set to `fail-on: none` so new security alerts show up in the GitHub Security tab without blocking deploys. This gives you time to triage and fix issues without emergency hotfixes.

**Next step**: Once you've triaged the backlog of vulnerabilities, tighten the thresholds by removing `continue-on-error`. That way CI will actually fail if critical issues persist, instead of just logging warnings nobody reads.

### Reviewing `npm-outdated.json`

1. Open the latest **Security Scan** workflow run (from the PR timeline or **Actions, then Security Scan**), download the `ci-security` artifact, and unzip it locally.
2. Inspect `npm-outdated.json` with `jq` or VS Code. For a quick table view, run:
   ```bash
   jq -r 'to_entries[] | [.key, .value.current, .value.wanted, .value.latest] | @tsv' npm-outdated.json | column -t
   ```
3. Cross-check each package against `package.json` to confirm whether it is a runtime dependency (`dependencies`) or tooling/test dependency (`devDependencies`).
4. Capture the status in the GitHub ticket you’re working from (or open a new one), then rerun `npm outdated --json` locally to confirm the plan before implementation.
