---
name: Code Cleanup
about: Internal codebase maintenance and cleanup
title: '[CHORE] Remove Dead Code from Audit'
labels: enhancement
---

## Plain Language Summary
A quick cleanup of the codebase to remove old, unused code that was identified in a recent audit. This is like tidying up the workshop—it doesn't add new features but makes everything cleaner and easier to work on.

## Description
The dead code audit from October 9, 2025, identified several React hooks, components, and service functions that are no longer referenced anywhere in the application. This work involves systematically removing those files and code blocks to reduce clutter and improve maintainability.

## Reason for Enhancement
Keeping the codebase clean is crucial. Removing dead code reduces the cognitive load on developers, shrinks the bundle size (even if only slightly), and eliminates potential confusion down the road. It's good hygiene.

## Work Performed
1.  Created a branch `chore/remove-dead-code`.
2.  Went through the "Confirmed Unreferenced Code" list in the audit.
3.  For each item, verified it's still unreferenced using a global search.
4.  Deleted the file/code block.
5.  Ran tests to ensure no regressions.
6.  Investigated the "Runtime-Unused" items and found that `useToast` is actually in use, so it was left alone.
