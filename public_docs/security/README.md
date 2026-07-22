---
title: Security Overview
tags: [security, api, protection]
created: 2025-06-01
updated: 2026-07-21
---

# Security Overview

Narraitor keeps provider calls behind its own server-side API routes. A player can save a provider key in the browser, where it is encrypted before persistence, and the app decrypts it just in time to send it to Narraitor's API route for a single request. The server-side `GEMINI_API_KEY` remains available as a local/dev fallback.

## Core Security Features

**Provider key storage**: User-entered keys are encrypted by `src/state/providerStore.ts` before they are persisted in browser storage.
**Per-request key forwarding**: `src/lib/ai/aiFetch.ts` attaches the decrypted key as `x-provider-api-key` only for the current same-origin API request.
**Server fallback**: `GEMINI_API_KEY` lives on the server and is used only when a request does not include a player provider key.
**Secure proxy**: Client requests go through Next.js API routes (`src/app/api/`), which make the actual provider calls.
**Rate limiting**: 50 requests/hour per IP in production (500 in dev), enforced by an in-memory limiter (`src/utils/rateLimiter.ts`) on the narrative generation routes via `src/utils/apiHelpers.ts`. Over the limit returns HTTP 429 with `X-RateLimit-*` headers.
**Input validation**: API inputs are validated and sanitized before use.

Separately, outbound AI calls are throttled with fixed delays for item processing and image requests (`src/lib/narrative/itemProcessorShared.ts`, `src/lib/services/imageRequestCoordinator.ts`) to stay under provider limits.

## Quick Verification

```bash
# Test security implementation
cd public_docs/security
./demo-secure-api.sh
```

## Best Practices

**Development**: Use the in-app provider settings, or use `GEMINI_API_KEY` in `.env.local` as a fallback. Never use a `NEXT_PUBLIC_` provider key.
**Production**: Prefer player-owned provider keys. Configure `GEMINI_API_KEY` only if the deployment intentionally offers a server fallback.
**Code Review**: Check for exposed secrets, confirm provider calls stay behind API routes, and never log `x-provider-api-key` or resolved provider keys.

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
