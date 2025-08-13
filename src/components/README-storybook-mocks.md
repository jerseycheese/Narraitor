# Storybook Mock Components Guide

This directory contains mock versions of components specifically designed for Storybook. So basically, the problem is that Next.js App Router components can't be easily rendered in Storybook because they depend on router context that doesn't exist there.

## Why Mock Components?

When using Next.js App Router, components that depend on routing functionality (through hooks like `useRouter()`) will fail in Storybook with errors like:

```
Error: invariant expected app router to be mounted
```

To solve this, we create mock versions of these components that provide the same UI and functionality but without the router dependencies.

## Guidelines for Creating Mock Components

The approach is pretty straightforward:

1. **Keep the same interface**: Match the props interface as closely as possible to the real component
2. **Inject dependencies**: Use props instead of importing router hooks directly
3. **Log instead of navigate**: Replace router navigation with console logging for Storybook
4. **Use callbacks**: Add callback props to notify parent components of events (like clicking "Play")
5. **Consistent naming**: Use the `Mock` prefix (e.g., `MockWorldCard`, `MockWorldList`)

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

Mock components are used only in Storybook and tests. The real application always uses the actual components with real router functionality. Think of mock components as development tools rather than production code.

## See Also

For more information, see the [Mock Components for Storybook ADR](/docs/adr/mock-components-for-storybook.md).
