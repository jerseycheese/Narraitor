---
title: Extending DevTools Panel
tags: [devtools, development, debugging]
created: 2025-05-17
updated: 2025-06-08
---

# Extending DevTools Panel

The DevTools panel is your window into what's happening under the hood during development. Adding a new section is straightforward once you know the patterns.

## Architecture

The DevTools system is built from a few key components:

- `DevToolsContext`: Controls whether the panel is open or closed
- `DevToolsPanel`: The main panel that holds everything else
- `CollapsibleSection`: Lets you group related debug info that can be expanded/collapsed
- `DevToolsSection`: Provides consistent styling so all sections look the same
- `JsonViewer`: Pretty-prints JSON with syntax highlighting
- `StateSection`: Shows what's in your Zustand stores
- `ConsistencyValidationSection`: Debug the AI consistency validation system

## Adding a New Section

### Step 1: Create Component
Build your component in `src/components/devtools/` following the established patterns:

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
Write tests first because debugging tools need to be reliable:

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

1. **Keep it simple** - Show what developers need to debug, nothing more
2. **Use collapsible sections** - Nobody wants a wall of debug info
3. **Ensure good performance** - Debug tools shouldn't slow down development
4. **Development-only** - Check environment to avoid shipping debug code
5. **Follow TDD** - Buggy debug tools are worse than no debug tools
6. **300-line limit** - If your debug component is huge, split it up
7. **Use Storybook** - Develop debug tools in isolation first

## Hydration Handling

### Client-Side Only Pattern
When your debug info changes between server and client rendering, use this pattern to avoid hydration mismatches:

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
import { getTimestamp } from '@/lib/utils';

const getStableDate = () => {
  if (process.env.NODE_ENV === 'development') {
    return '2023-01-01T00:00:00.000Z'; // Static for consistency
  }
  return getTimestamp();
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

### AI Mocking & Simulation
So this is pretty handy when you need to test how your code handles various AI response scenarios without actually hitting the real API. Whether you're debugging locally or just want to see how error handling works, mocking saves you from burning through API quota.

```typescript
import { AIMockingSection } from '../AIMockingSection';

<CollapsibleSection title="AI Mocking & Simulation" initialCollapsed={true}>
  <AIMockingSection />
</CollapsibleSection>
```

The system comes with five built-in scenarios that cover the most common testing situations: standard success responses, timeouts (which happen more than you'd think), rate limiting errors, API key failures, and network issues. You can also create custom scenarios if you need to test specific response patterns.

What makes this useful is that everything persists across browser sessions, so you can set up your testing scenarios once and they stick around. The mock responses include realistic delays with some variation, which helps catch timing-related bugs that only show up with actual network conditions.

This is particularly useful when you're working offline or when the AI service is having issues. Instead of your development workflow grinding to a halt, you can flip the toggle and keep working with predictable mock responses.

### AI Consistency Validation
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

### Decision Relevance Debugger
When the AI keeps surfacing a decision that feels out of place, the relevance debugger shows exactly what the scoring engine saw. Here's what you get:

- **Factor table**: Overall, recency, context, impact, tag, and character scores side-by-side for the top decisions, sorted descending. Makes it easy to spot why one decision is ranking higher than another.
- **Scoped filters**: Flip between active session, world, or all decisions without reloading the page. Super handy when you're testing specific scenarios.
- **Context snapshot**: Displays the current narrative context alongside the raw decision metadata so you can confirm the inputs feeding the calculator.
- **Detail panel**: Click any row to reveal matched tags, impact category, and the structured context payload that informs relevance scoring.
- **Quick refresh loop**: Pull the latest decisions straight from `PlayerDecisionTracker` while you rerun scenarios or scripted flows.

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

Need inspiration for what to build next? Here are some ideas:

1. **Performance Monitoring** - Track render times and expensive re-renders
2. **State History** - See how store state changes over time
3. **Network Requests** - Monitor API calls, especially to AI services
4. **Error Tracking** - Collect and display recent errors and warnings
5. **Component Tree** - Visualize the component hierarchy
6. **Event Logging** - Track user interactions and their effects
7. **AI Prompt Analysis** - Debug what prompts are being sent to AI
8. **Lore Management** - CRUD operations for lore facts during development
