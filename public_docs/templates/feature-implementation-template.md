---
title: [Feature Name] Implementation
tags: [feature, implementation, [domain]]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
---

# [Feature Name] Implementation

**Issue**: #[NUMBER]
**Status**: [In Progress | Complete | Blocked]

## What This Does

Start with the user impact or developer pain point this addresses. What problem does this solve? What was broken or missing before?

Then explain the approach taken and why. If there were other options considered, mention them and why this approach won out.

## Implementation Details

### Main Components

List the key pieces with enough context to understand what they do. Not just "ComponentA" but "ComponentA handles the user input validation before submitting to the API."

- `ComponentA` at `<component-file>` - What it does and why it exists
- `ComponentB` at `<component-file>` - Its role in the feature
- `utilityFunction` at `<utility-file>` - Specific responsibility

### How It Fits Together

Explain the architecture in terms of data flow or user interaction, not just technical layers. Walk through what happens when someone uses the feature.

If there's state management involved, explain what state is tracked and why. If it integrates with external services, explain the interaction pattern.

### Trade-offs and Decisions

Call out any trade-offs made or areas that could be improved later. This is where you acknowledge limitations: "This approach keeps things simple for now, but if we need to handle X in the future, we might need to refactor Y."

## Testing Approach

Explain what's being tested and why, not just a checklist of test types.

**Component Tests**: What behavior is verified and why it matters. Focus on user-facing functionality, not implementation details.

**Integration Tests**: How components work together or interact with stores/APIs. Explain what scenarios are covered.

**Edge Cases**: Specific weird situations that needed test coverage — describe what actually happens, like "shows a placeholder when the avatar fails to load" or "retries once before showing an error banner."

## Verification Steps

These are the things to check before considering this done. Make them specific to this feature, not generic checklist items.

- Core functionality verified: [specific thing users can do]
- Error handling tested: [specific error scenarios covered]
- Performance checked: [what was measured and what's acceptable]
- Accessibility verified: [specific a11y concerns addressed]
- Tests pass and cover the main flows
- Storybook stories show all the relevant states

## Notes and Gotchas

Anything that's not obvious from the code. This is for future you or other developers who need to modify this later.

Things like:
- "The debounce is set to 300ms because the API rate limits at 10/sec"
- "Had to use useLayoutEffect here instead of useEffect because of the measurement timing"
- "The fallback path is there for browsers that don't support IndexedDB"

Include references to related issues or PRs if they provide useful context.

---

**Writing Tips:**
- This is technical documentation, but it should still sound conversational
- Explain the "why" behind decisions, not just the "what"
- Future developers (including you) will read this when debugging - make it helpful
- Skip the corporate language and template phrases
- If something was tricky or has a gotcha, call it out explicitly
