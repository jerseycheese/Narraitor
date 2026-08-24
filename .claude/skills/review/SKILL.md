---
name: review
description: Use when reviewing Narraitor code or PR changes for bugs, regressions, missing tests, and merge readiness.
---

# Code Review Skill

1. Fetch the latest diff from the remote PR branch (never use cached data)
2. Analyze all changed files for bugs, logic errors, missing edge cases, and style issues
3. Run `npm run lint` and `npm run test` against the branch
4. Present findings as: Blocking, Suggestions, Praise (ordered by severity)
5. Do NOT enter plan mode or create plan files
6. End with a clear MERGE / NEEDS CHANGES verdict
