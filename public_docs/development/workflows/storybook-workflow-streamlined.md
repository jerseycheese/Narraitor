---
title: Storybook Development Workflow
tags: [storybook, components, development, isolation]
created: 2025-06-26
updated: 2025-06-26
---

# Storybook Development Workflow

Component-first development using Storybook for isolated testing and documentation.

## Quick Start

1. **Create component** with TypeScript interface
2. **Write Storybook stories** for all variants
3. **Develop in isolation** using mock data
4. **Test all states** (loading, error, success)
5. **Move to integration** only after Storybook verification

## Story Structure

### Basic Story Setup
```typescript
// Component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
  title: 'Domain/Component',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger'],
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Core variants
export const Default: Story = {
  args: {
    data: mockData,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Something went wrong',
  },
};
```

### Story Organization Pattern
```
title: 'Domain/ComponentName'

Examples:
- 'Character/CharacterCard'
- 'World/WorldEditor' 
- 'Narrative/ChoiceDisplay'
- 'UI/Button'
- 'Forms/InputField'
```

## Mock Data Strategy

### Create Domain-Specific Mocks
```typescript
import { createMockCharacter } from '@/lib/test-utils';

export const mockCharacter = createMockCharacter({
  id: 'char-1',
  name: 'Jake "The Snake" Morrison',
  attributes: {
    strength: 8,
    dexterity: 6,
    intelligence: 4,
    charisma: 7
  },
  skills: ['Gunslinging', 'Intimidation', 'Survival'],
  background: 'Former outlaw turned bounty hunter...'
});

export const mockCharacterEmpty = createMockCharacter({
  id: 'char-2',
  name: '',
  attributes: {},
  skills: [],
  background: ''
});
```

### Use Mocks in Stories
```typescript
export const WithData: Story = {
  args: {
    character: mockCharacter,
  },
};

export const EmptyState: Story = {
  args: {
    character: mockCharacterEmpty,
  },
};
```

## Essential Story Variants

### Standard Variants (All Components)
- **Default**: Normal state with typical data
- **Loading**: Loading/pending state
- **Error**: Error state with error message
- **Empty**: Empty/no data state

### Interactive Variants (When Applicable)
- **Disabled**: Non-interactive state
- **ReadOnly**: Display-only mode
- **Validation**: Form validation states

### Size/Style Variants (UI Components)
- **Sizes**: Small, medium, large
- **Themes**: Primary, secondary, danger, etc.

## Development Process

### 1. Component Interface First
```typescript
interface ComponentProps {
  // Required props
  data: DataType;
  onAction: (action: ActionType) => void;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  error?: string;
}
```

### 2. Stories Before Implementation
Write all story variants before implementing the component logic.

### 3. Iterative Development
- Implement basic rendering
- Test in Storybook
- Add interaction handling
- Test all variants
- Refine based on visual feedback

### 4. Documentation Through Stories
Stories serve as:
- Component documentation
- Usage examples
- Visual regression tests
- Design system reference

## Testing in Storybook

### Visual Testing Checklist
- [ ] All variants render correctly
- [ ] Interactive elements respond to user input
- [ ] Loading states display properly
- [ ] Error states show appropriate messages
- [ ] Responsive design works across screen sizes
- [ ] Accessibility features function (keyboard nav, screen readers)

### Interaction Testing
```typescript
// Use Storybook's interaction testing
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const InteractionTest: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};
```

## Commands

### Development
```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook

# Run Storybook tests
npm run test-storybook
```

### Workflow Integration
- Develop components in Storybook first
- Move to test harness (`/dev/component-name`) for limited integration
- Finally integrate into main application

## Best Practices

### Component Design
- Keep components focused and single-purpose
- Use TypeScript for all props and state
- Handle all possible states (loading, error, empty, success)
- Make components controllable via props

### Story Writing
- Cover all realistic use cases
- Use descriptive story names
- Include edge cases and error scenarios
- Document prop purposes in story descriptions

### Mock Data
- Create realistic, representative data
- Include edge cases (empty strings, null values)
- Use consistent data structure across stories
- Keep mocks focused and minimal

### Performance
- Avoid heavy computations in stories
- Use lazy loading for large datasets
- Optimize re-renders with proper prop structures

## Troubleshooting

**Component doesn't render in Storybook**
- Check import paths
- Verify props interface matches story args
- Look for missing dependencies

**Stories don't show interactions**
- Add `args: { onClick: fn() }` for function props
- Use Storybook's interaction testing features
- Check browser console for errors

**Visual inconsistencies**
- Verify CSS imports
- Check for missing theme providers
- Test in different viewport sizes
