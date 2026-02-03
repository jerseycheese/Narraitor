# Security Scan Enforcement Design

## Context
The CI security scan is currently informational because the npm audit step is marked `continue-on-error: true`. That made sense during the initial rollout, but issue #950 confirms the blockers are resolved and the repo now needs the audit to fail on HIGH+ vulnerabilities.

This design keeps the scope narrow: patch-level dependency updates plus a small CI tweak to enforce the audit step. It is intentionally conservative to avoid surprises and keep rollback simple.

## Goals
- Resolve the known HIGH vulnerabilities detected by the security scan.
- Enforce the npm audit step in CI for HIGH+ findings.
- Preserve the JSON audit artifact for debugging even if the audit fails.

## Non-Goals
- No changes to runtime behavior beyond dependency patches.
- No additional security tooling or new suppression rules.

## Approach
The dependency updates are handled via `npm audit fix` without `--force`, which should lift Next.js to 15.5.11 and the transitive `jws` to 4.0.1 while updating other patch-level transitives. The CI change removes `continue-on-error` from the main audit step but keeps the JSON report generation non-blocking so artifacts still publish.

## Files
- `package-lock.json` (updated by npm audit fix)
- `package.json` (may update Next.js patch range)
- `.github/workflows/ci.yml` (enforce audit step)

## Verification
Local verification mirrors CI gates to catch regressions from patch updates:
- `npm audit --production --audit-level=high` should report zero HIGH/CRITICAL vulnerabilities.
- `npm run type-check`, `npm run lint`, `npm run lint:css`, `npm run lint:layout-usage`
- `npm run test:coverage`
- `npm run build` and `npm run build-storybook`
- `npm run test:e2e:critical` (with `npm run dev` in another terminal)

## Rollback
- Revert only the CI workflow change if enforcement proves too strict.
- Revert the full commit if patch-level updates cause regressions.

## Open Questions
No open questions remain after confirming a single-PR approach.
