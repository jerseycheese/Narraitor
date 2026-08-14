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

Export in `index.ts` (example from an existing section):
```typescript
// src/components/devtools/StateSection/index.ts
export * from './StateSection';
```

### Step 2: Add Tests
Write tests first because debugging tools need to be reliable:

```typescript
// src/components/devtools/StateSection/StateSection.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StateSection } from './StateSection';

describe('StateSection', () => {
  it('renders correctly', () => {
    render(<StateSection />);
    expect(screen.getByTestId('devtools-state-section')).toBeInTheDocument();
  });
});
```

### Step 3: Create Storybook Story
```typescript
// src/stories/03-organisms/devtools/sections/StateSection.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StateSection } from '@/components/devtools/StateSection';

const meta: Meta<typeof StateSection> = {
  title: 'DevTools/StateSection',
  component: StateSection,
  parameters: { layout: 'centered' },
};

export default meta;
export const Default: Story = {};
```

### Step 4: Integrate with DevToolsPanel
Add to `DevToolsPanel.tsx`:

```typescript
import { StateSection } from '../StateSection';

export const DevToolsPanel = () => {
  // ... existing code
  
  return (
    <div className="...">
      {isOpen && (
        <div className="...">
          <StateSection />
          <StateSection />
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

### Decision Flow Section
There's no relevance-scoring debugger. Relevance is plain recency filtering
(`src/lib/ai/simpleDecisionRelevance.ts`, see
[ADR-010](../architecture/ADR-010-decision-relevance-simplification.md)).

What exists is `DecisionFlowSection`, a read-only trace of how each decision was created,
presented, selected, and recorded:

- **Per-decision trace**: origin segment, the AI-generated options with their alignment and any
  custom input, what the player picked, the `playerDecisionTracker` record, and the outcome segment.
- **Session picker**: switch between sessions that have recorded decisions.
- **Prompt debug**: segment-level prompt info shows up when "Show Prompts" capture was on. Choice
  generation prompts aren't retained by the pipeline, so the trace covers what state actually stores.
- **Snapshot on demand**: it reads state and never mutates it.

`DecisionConsoleSection` is the sibling tool for driving decisions rather than inspecting them.

## DevToolsSection Component

Use `DevToolsSection` for consistent styling across all DevTools components:

```tsx
import { DevToolsSection } from '../shared/DevToolsSection';

<DevToolsSection title="Lore Statistics">
  {content}
</DevToolsSection>

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
