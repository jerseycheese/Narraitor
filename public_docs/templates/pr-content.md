---
title: "Pull Request Template"
type: template
category: process
tags: [pr, template, github, process]
created: 2025-05-21
updated: 2026-07-21
---

# Pull Request Content Template

## Description
This PR addresses [short problem statement]. The approach taken is [brief implementation summary], with the main trade-off being [trade-off or "none worth calling out"].

## Related Issue
Closes #[issue-number]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactoring (code improvements without changing functionality)
- [ ] Documentation update
- [ ] Test addition or improvement

## TDD Compliance
- [ ] Tests written before implementation
- [ ] All new code is tested
- [ ] All tests pass locally
- [ ] Test coverage maintained or improved

## User Stories Addressed
- [User-facing behavior or developer workflow this changes]

## Flow Diagrams
[Add diagram or write N/A]

## Component Development
- [ ] Storybook stories created/updated
- [ ] Components developed in isolation first where applicable
- [ ] Visual consistency verified

[Describe Storybook or visual verification, or write N/A with why.]

## Implementation Notes
1. [Key implementation detail and why it matters]
2. [Any migration, data, or compatibility note]
3. [Known limitation or follow-up, if any]

## Testing Instructions
1. Run `[command]`
2. Verify `[route or behavior]`
3. Check `[specific edge case]`

## Checklist
- [ ] Code follows the project's coding standards
- [ ] Scope stays limited to the issue
- [ ] Self-review of code performed
- [ ] Comments explain why where the code needs it
- [ ] Documentation updated or confirmed unnecessary
- [ ] No new warnings generated
- [ ] Accessibility considerations addressed
