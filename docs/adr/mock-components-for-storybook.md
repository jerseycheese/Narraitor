# Architectural Decision Record: Mock Components for Storybook

## Date
2025-05-15

## Status
Accepted

## Context
We are using Next.js with the App Router for our Narraitor application. However, when using component-first development with Storybook, we encountered issues where Next.js router-dependent components would fail in the Storybook environment with errors like:

```
Error: invariant expected app router to be mounted
```

The issue occurs because Next.js App Router expects to be mounted in a Next.js application context, but Storybook renders components in isolation outside of that context.

## Decision
We've decided to implement a pattern of creating separate mock components specifically for Storybook that don't depend on Next.js router or other environment-specific APIs. These mock components:

1. Replicate the UI and basic functionality of the real components
2. Replace router-dependent code with console logging or callback functions
3. Use dependency injection for testability
4. Share the same interface as the real components when possible

This approach allows us to maintain our component-first development workflow in Storybook while ensuring our real components can use the Next.js App Router features.

## Examples
- `WorldCard` → `MockWorldCard` (for isolated component stories)
- `WorldList` → `MockWorldList` (for component composition stories)

## Consequences
### Positive
- Storybook stories run without router-related errors
- Components can be developed in isolation before integration
- Tests can be written against both real and mock components
- Maintains our TDD and component-first workflow

### Negative
- Code duplication between real and mock components
- Need to maintain two versions of components that use routing
- Slightly more complex development workflow

## Guidelines for Implementation
1. Create mock versions of components only when they depend on Next.js router or other environment-specific APIs
2. Keep mock components as similar as possible to real components
3. Use dependency injection for testability in both mock and real components
4. Document the pattern clearly in component files and tests
5. Use a consistent naming convention (e.g., `MockComponentName`)

## Future Considerations
- Explore whether a higher-order component or context provider approach could reduce duplication
- Investigate if Next.js provides better tools for testing router-dependent components
- Consider creating a reusable pattern or utility for this approach
