---
title: Release Notes
tags: [release-notes, updates]
created: 2025-10-27
updated: 2025-10-27
---

# Release Notes

## 2025-10-27 – Framework Maintenance

- Upgraded Next.js from 15.3.1 to 15.5.6 to adopt the security fixes from the October 2025 patch set and keep parity with upstream recommendations.
- Re-ran the standard verification suite (`npm run lint`, `npm run build`, `npm test -- --runInBand`) to confirm the upgrade is safe.
- Validated that production dependencies are clear of high-severity issues with `npm audit --production --audit-level=high`.
