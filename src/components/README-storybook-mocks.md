# Storybook Mock Components Guide

This directory contains mock versions of components specifically designed for Storybook. These mock components are necessary because Next.js App Router components cannot be easily rendered in Storybook due to the lack of router context.

## Why Mock Components?

When using Next.js App Router, components that depend on routing functionality (through hooks like `useRouter()`) will fail in Storybook with errors like:

```
Error: invariant expected app router to be mounted
```

To solve this issue, we create mock versions of these components that provide the same UI and functionality but without the router dependencies.

## Guidelines for Creating Mock Components

1. **Similar Interface**: Keep the props interface as similar to the real component as possible
2. **Dependency Injection**: Use props to inject dependencies rather than importing them directly
3. **Console Logging**: Replace router navigation with console logging for Storybook
4. **Event Callbacks**: Use callback props to notify parent components of events (like clicking "Play")
5. **Consistent Naming**: Use the `Mock` prefix (e.g., `MockWorldCard`, `MockWorldList`)

## Example Usage

```tsx
// In your Storybook story file
import MockWorldList from './MockWorldList';

export const Default = {
  component: MockWorldList,
  args: {
    worlds: mockWorlds,
    onSelectWorld: (id) => console.log(`Selected world: ${id}`),
    onDeleteWorld: (id) => console.log(`Delete world: ${id}`),
    onPlayWorld: (id) => console.log(`Play world: ${id}`),
  },
};
```

## Testing Mock Components

Mock components should have their own test files to verify that they work correctly in isolation. This helps ensure that the Storybook stories will work as expected.

## Relationship to Real Components

Mock components are used ONLY in Storybook and tests. The real application will always use the real components with actual router functionality. Think of mock components as development tools rather than production code.

## See Also

For more information, see the [Mock Components for Storybook ADR](/docs/adr/mock-components-for-storybook.md).
