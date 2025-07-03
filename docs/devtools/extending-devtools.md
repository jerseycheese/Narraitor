---
title: Extending DevTools Panel
tags: [devtools, development, debugging]
created: 2025-05-17
updated: 2025-06-08
---

# Extending DevTools Panel

Guide for adding new debugging sections to the DevTools panel.

## Architecture

**Core Components:**
- `DevToolsContext`: Manages panel visibility state
- `DevToolsPanel`: Main panel UI with toggle functionality
- `CollapsibleSection`: Reusable collapsible sections
- `DevToolsSection`: Reusable container with consistent styling
- `JsonViewer`: JSON display with syntax highlighting
- `StateSection`: Shows Zustand store states
- `ConsistencyValidationSection`: AI consistency validation debugging

## Adding a New Section

### Step 1: Create Component
Create component in `src/components/devtools/` using consistent patterns:

```typescript
import { DevToolsSection } from '../shared/DevToolsSection';

// For simple sections with consistent styling
<DevToolsSection title="My Section Title">
  <div>Content for the section</div>
</DevToolsSection>

// For collapsible sections in the DevToolsPanel
<CollapsibleSection 
  title="My Section Title" 
  initialCollapsed={true}
>
  <DevToolsSection title="Subsection">
    <div>Subsection content</div>
  </DevToolsSection>
</CollapsibleSection>
```

Export in `index.ts`:
```typescript
// src/components/devtools/MyNewSection/index.ts
export * from './MyNewSection';
```

### Step 2: Add Tests
Follow TDD approach:

```typescript
// MyNewSection.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyNewSection } from './MyNewSection';

describe('MyNewSection', () => {
  it('renders correctly', () => {
    render(<MyNewSection />);
    expect(screen.getByTestId('devtools-my-new-section')).toBeInTheDocument();
  });
});
```

### Step 3: Create Storybook Story
```typescript
// MyNewSection.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyNewSection } from './MyNewSection';

const meta: Meta<typeof MyNewSection> = {
  title: 'DevTools/MyNewSection',
  component: MyNewSection,
  parameters: { layout: 'centered' },
};

export default meta;
export const Default: Story = {};
```

### Step 4: Integrate with DevToolsPanel
Add to `DevToolsPanel.tsx`:

```typescript
import { MyNewSection } from '../MyNewSection';

export const DevToolsPanel = () => {
  // ... existing code
  
  return (
    <div className="...">
      {isOpen && (
        <div className="...">
          <StateSection />
          <MyNewSection />
        </div>
      )}
    </div>
  );
};
```

## Best Practices

1. **Keep it simple** - Focus on essential debugging information
2. **Use collapsible sections** - Group related information
3. **Ensure good performance** - Avoid expensive operations
4. **Development-only** - Check environment in components
5. **Follow TDD** - Write tests before implementation
6. **300-line limit** - Keep components small
7. **Use Storybook** - Develop in isolation first

## Hydration Handling

### Client-Side Only Pattern
For dynamic content that differs between server and client:

```tsx
export const MyComponent = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  const processedData = isMounted ? processData(data) : null;
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div>
      {!isMounted ? (
        <p>Loading...</p>
      ) : (
        <div>{processedData}</div>
      )}
    </div>
  );
};
```

### Stable Date Values
```tsx
const getStableDate = () => {
  if (process.env.NODE_ENV === 'development') {
    return '2023-01-01T00:00:00.000Z'; // Static for consistency
  }
  return new Date().toISOString();
};
```

### JSON Handling
```tsx
function replacer(key, value) {
  if (value === undefined) return 'undefined';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'function') return '[Function]';
  return value;
}
```

## Available DevTools Sections

### AI Consistency Validation (Issue #184)
Real-time debugging for the AI consistency validation system:

```typescript
import { ConsistencyValidationSection } from '../ConsistencyValidationSection';

<CollapsibleSection title="Consistency Validation" initialCollapsed={true}>
  <ConsistencyValidationSection />
</CollapsibleSection>
```

**Features:**
- World selection with lore fact filtering
- Live lore context building analysis
- Generated consistency instructions preview
- Categorization breakdown (characters, locations, world rules, historical events)
- Importance ranking validation
- Statistics dashboard for lore metrics

**Use Cases:**
- Debug why consistency instructions aren't generating
- Verify lore fact categorization is working correctly
- Analyze importance ranking algorithm performance
- Inspect structured lore context output

## DevToolsSection Component

Use `DevToolsSection` for consistent styling across all DevTools components:

```typescript
import { DevToolsSection } from '../shared/DevToolsSection';

// Replaces this pattern:
<div className="bg-slate-700 p-2 rounded border border-slate-600">
  <h4 className="text-xs font-medium mb-2 text-slate-200">Title</h4>
  {content}
</div>

// With this:
<DevToolsSection title="Title">
  {content}
</DevToolsSection>
```

**Benefits:**
- Eliminates code duplication
- Ensures consistent dark theme styling
- Provides standardized spacing and typography
- Supports additional className for customization

## Common Extension Ideas

1. **Performance Monitoring** - Render times, re-renders
2. **State History** - Track state changes over time
3. **Network Requests** - Monitor API calls and responses
4. **Error Tracking** - Show recent errors and warnings
5. **Component Tree** - Visualize component hierarchy
6. **Event Logging** - Log user interactions
7. **AI Prompt Analysis** - Debug AI prompt generation and responses
8. **Lore Management** - CRUD operations for lore facts during development
