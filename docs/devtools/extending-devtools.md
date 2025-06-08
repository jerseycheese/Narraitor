---
title: "Extending the DevTools Panel"
type: guide
category: development
tags: [devtools, development, debugging, extension]
created: 2025-05-17
updated: 2025-06-08
---

# Extending the DevTools Panel

The DevTools panel in Narraitor is designed to be easily extensible. This document explains how to add new debugging tools and sections to the panel.

## Architecture Overview

The DevTools panel consists of these primary components:

- `DevToolsContext`: Manages the visibility state of the panel
- `DevToolsPanel`: The main panel UI with toggle functionality
- `CollapsibleSection`: Reusable component for creating collapsible sections
- `JsonViewer`: Component for displaying JSON data with syntax highlighting
- `StateSection`: Shows Zustand store states using the JsonViewer

## Adding a New Section

To add a new section to the DevTools panel, follow these steps:

1. Create a new component in the `src/components/devtools` directory
2. Use the `CollapsibleSection` component for consistent UI
3. Add your component to the `DevToolsPanel` component

### CollapsibleSection

The CollapsibleSection component provides a consistent way to create expandable/collapsible sections in the DevTools panel. Use this for grouping related debugging information.

```typescript
<CollapsibleSection 
  title="My Section Title" 
  initialCollapsed={true}  // Start collapsed by default
>
  {/* Your content here */}
  <div>Content for the section</div>
</CollapsibleSection>
```

The `initialCollapsed` prop determines whether the section starts in a collapsed state. By default, all sections in the StateSection component are now collapsed initially.

Don't forget to create an `index.ts` file to export your component:

```typescript
// src/components/devtools/MyNewSection/index.ts
export * from './MyNewSection';
```

### Step 2: Add Tests for Your Section

Following the TDD approach, create a test file for your section:

```typescript
// src/components/devtools/MyNewSection/MyNewSection.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyNewSection } from './MyNewSection';

// Mock the CollapsibleSection component if needed
jest.mock('../CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div data-testid="collapsible-section-title">{title}
      <div data-testid="collapsible-section-content">{children}</div>
    </div>
  )
}));

describe('MyNewSection', () => {
  it('renders correctly', () => {
    render(<MyNewSection />);
    
    expect(screen.getByTestId('devtools-my-new-section')).toBeInTheDocument();
    expect(screen.getByText('My New Section')).toBeInTheDocument();
  });
  
  // Add more tests as needed
});
```

### Step 3: Add Storybook Stories

Create a Storybook story for your component:

```typescript
// src/components/devtools/MyNewSection/MyNewSection.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyNewSection } from './MyNewSection';

const meta: Meta<typeof MyNewSection> = {
  title: 'DevTools/MyNewSection',
  component: MyNewSection,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof MyNewSection>;

export const Default: Story = {};
```

### Step 4: Integrate with DevToolsPanel

Finally, add your section to the `DevToolsPanel` component:

```typescript
// src/components/devtools/DevToolsPanel/DevToolsPanel.tsx
'use client';

import React from 'react';
import { useDevTools } from '../DevToolsContext';
import { StateSection } from '../StateSection';
import { MyNewSection } from '../MyNewSection'; // Import your new section

export const DevToolsPanel = () => {
  const { isOpen, toggleDevTools } = useDevTools();

  // Only render in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t border-gray-300 bg-white shadow-md z-50"
      style={{ maxHeight: isOpen ? '50vh' : 'auto' }}
    >
      {/* Header with toggle button */}
      <div 
        data-testid="devtools-panel-header"
        className="flex justify-between items-center p-2 bg-gray-100 border-b border-gray-200"
      >
        <div className="text-sm font-medium">
          Narraitor DevTools
        </div>
        <button
          data-testid="devtools-panel-toggle"
          onClick={toggleDevTools}
          className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {isOpen ? 'Hide DevTools' : 'Show DevTools'}
        </button>
      </div>

      {/* Content area - only rendered when open */}
      {isOpen && (
        <div 
          data-testid="devtools-panel-content"
          className="p-4 overflow-auto"
          style={{ maxHeight: 'calc(50vh - 40px)' }}
        >
          <StateSection />
          <MyNewSection /> {/* Add your new section here */}
        </div>
      )}
    </div>
  );
};
```

## Best Practices

When extending the DevTools panel, follow these best practices:

1. **Keep it simple**: Focus on essential debugging information
2. **Use collapsible sections**: Group related information to save space
3. **Ensure good performance**: Avoid expensive operations that could slow down the application
4. **Make it development-only**: Ensure your components check for development environment
5. **Follow TDD workflow**: Write tests before implementing features
6. **Keep components small**: Follow the 300-line limit for components
7. **Use Storybook**: Develop components in isolation first
8. **Add proper documentation**: Document any non-obvious functionality
9. **Prevent hydration mismatches**: For components that render dynamic content:
   - Use client-side only rendering with useEffect and useState for component mounting
   - Use stable values for dates and other variable content during development
   - Handle potential differences between server and client rendering
   - Consider using the pattern in JsonViewer as a reference

## Handling Hydration Mismatches

The DevTools components use specific techniques to prevent hydration mismatches in Next.js:

### Client-Side Only Rendering Pattern

For components that render dynamic content that may differ between server and client:

```tsx
'use client';

import React, { useState, useEffect } from 'react';

export const MyComponent = ({ data }) => {
  // State to track if the component is mounted (client-side only)
  const [isMounted, setIsMounted] = useState(false);
  
  // Compute data only after client-side mounting
  const processedData = isMounted 
    ? processData(data) 
    : null;
  
  // Set mounted state after component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div>
      {!isMounted ? (
        // Simple placeholder during server-side rendering
        <p>Loading...</p>
      ) : (
        // Actual content once client-side mounted
        <div>{processedData}</div>
      )}
    </div>
  );
};
```

### Stable Date Values

When using dates in test data or state:

```tsx
// Create a stable date function for testing
const getStableDate = () => {
  if (process.env.NODE_ENV === 'development') {
    return '2023-01-01T00:00:00.000Z'; // Static date for consistent rendering
  }
  return new Date().toISOString(); // Real date in production
};
```

### JSON Handling

When displaying JSON data that might contain dates, functions, or circular references:

```tsx
// Custom replacer function for JSON.stringify
function replacer(key, value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'function') {
    return '[Function]';
  }
  return value;
}
```

## Common Extension Types

Here are some ideas for DevTools extensions:

1. **Performance Monitoring**: Display render times, component re-renders, etc.
2. **State History**: Track state changes over time
3. **Network Requests**: Monitor API calls and responses
4. **Error Tracking**: Show recent errors and warnings
5. **Component Tree**: Visualize the component hierarchy
6. **Event Logging**: Log user interactions and events

## Related Documentation

- [DevTools Requirements](../requirements/core/devtools-requirements.md)
- [TDD Workflow](../workflows/tdd-workflow.md)
- [Component Development Guide](../development/component-development.md)
