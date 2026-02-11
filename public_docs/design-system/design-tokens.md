---
title: "Design Token System"
type: design-system
category: tokens
tags: [design-tokens, colors, architecture, theming]
created: 2025-01-09
updated: 2025-01-09
---

# Design Token System

Design tokens manage colors, spacing, and other properties across the app. When you need a color or spacing value, grab it from here instead of hardcoding.

## Architecture Overview

The token system uses a three-tier approach that keeps things organized and maintainable:

**Primitive Tokens** → **Semantic Tokens** → **Component/Contextual Tokens**

This hierarchy means you can change the entire visual feel of the app by adjusting primitive values, and everything else updates automatically.

### Primitive Tokens

These are the raw color values - the actual hex codes that define our palette. They live in `src/lib/design-tokens/tokens/primitives.ts` and represent the foundational colors we use throughout the app.

```typescript
export const primitiveColors = {
  white: '#ffffff',
  black: '#000000',
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  blue: {
    100: '#dbeafe',
    300: '#93c5fd',
    500: '#3b82f6',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  // green, red, amber follow the same pattern
}
```

The palette uses the full Zinc scale for neutrals to support subtle UI nuances, while other colors use a simplified scale (100, 300, 500, 700, 900) to keep decisions manageable.

### Semantic Tokens

These map primitive colors to their intended purpose in the interface. Instead of using `blue-500` directly, you'd use `primary` which happens to be `blue-500`. This layer lets you change what "primary" means without touching every component.

```typescript
export const semanticColors = {
  primary: primitiveColors.blue[700],      // Main action color
  secondary: primitiveColors.zinc[700],    // Secondary actions
  success: primitiveColors.green[700],     // Positive feedback
  warning: primitiveColors.amber[700],     // Caution states
  danger: primitiveColors.red[700],        // Error states
  info: primitiveColors.blue[500],         // Informational content
  muted: primitiveColors.zinc[500],        // Subtle text
  accent: primitiveColors.blue[300],       // Highlights
}
```

### Component & Contextual Tokens

The third layer handles specific use cases - like colors for different types of story endings or lore categories. These tokens understand the context they'll be used in.

```typescript
export const contextualColors = {
  endings: {
    triumphant: primitiveColors.green[700],
    bittersweet: primitiveColors.amber[700],
    mysterious: primitiveColors.blue[700],
    tragic: primitiveColors.red[700],
    hopeful: primitiveColors.blue[500],
  },
  lore: {
    characters: primitiveColors.blue[700],
    locations: primitiveColors.green[700], 
    events: primitiveColors.amber[700],
    rules: primitiveColors.red[700],
  }
}
```

## Using Design Tokens

### In Tailwind Classes

The most common way you'll use tokens is through semantic Tailwind classes. Use design token classes instead of primitive colors:

```tsx
// ✅ Good - Uses semantic design tokens
const Button = ({ variant = 'primary' }) => {
  return (
    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
      Click me
    </button>
  )
}

// ❌ Avoid - Uses primitive colors directly  
const BadButton = () => {
  return (
    <button className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900">
      Click me
    </button>
  )
}

// ✅ Good - Uses semantic warning tokens
const WarningAlert = () => {
  return (
    <div className="bg-warning-background border border-warning-border text-warning-foreground p-3 rounded-md">
      Warning message
    </div>
  )
}
```

### With CSS theme() Functions

For more complex styling or when you need to reference tokens in CSS, use the `theme()` function:

```css
.custom-component {
  background-color: theme('colors.blue.500');
  border: 1px solid theme('colors.zinc.300');
  color: theme('colors.zinc.900');
}
```

### Direct Import (Rare)

Sometimes you need the actual color values in JavaScript - like for chart libraries or dynamic styling:

```typescript
import { primitiveColors, semanticColors } from '@/lib/design-tokens'

// For a chart library that needs hex values
const chartColors = [
  primitiveColors.blue[500],
  primitiveColors.green[500], 
  primitiveColors.amber[500],
]

// For dynamic theme switching
const buttonColor = isActive ? semanticColors.primary : semanticColors.muted
```

## Color Palette Breakdown

### Core UI Colors (Genre-Neutral)

**Blue Family**: Primary actions, informational content, and trustworthy interactions
- `blue-100`: Light backgrounds and subtle highlights  
- `blue-300`: Soft accents and secondary information
- `blue-500`: Standard informational blue
- `blue-700`: Primary action color (buttons, links)
- `blue-900`: Deep blue for emphasis

**Zinc Family**: Neutral elements, text, and subtle UI components
- `zinc-100`: Light backgrounds, subtle sections
- `zinc-300`: Borders, dividers, inactive states
- `zinc-500`: Muted text, secondary information  
- `zinc-700`: Primary text, active states
- `zinc-900`: High contrast text, headings

**Green Family**: Success states and positive feedback
- `green-500`: Standard success messaging
- `green-700`: Success actions and confirmation

**Amber Family**: Warning states and caution indicators  
- `amber-500`: Standard warning messaging
- `amber-700`: Warning actions

**Red Family**: Error states and destructive actions
- `red-500`: Standard error messaging  
- `red-700`: Destructive actions (delete, remove)

### Contextual Colors

**Story Endings**: Colors that match the emotional tone of different story conclusions
- Triumphant endings use green (positive, victorious)
- Bittersweet endings use amber (mixed emotions)
- Mysterious endings use blue (unknown, intriguing)
- Tragic endings use red (loss, sadness)
- Hopeful endings use lighter blue (optimism, possibility)

**Lore Categories**: Visual organization for different types of world-building content
- Characters use blue (trustworthy, personal)
- Locations use green (natural, grounding)
- Events use amber (important, noteworthy)
- Rules use red (important, systematic)

## Integration with Tailwind

The design tokens are enforced through the Tailwind configuration, which restricts the available colors to only our design token palette. This prevents accidentally using colors outside the system.

```typescript
// tailwind.config.ts
colors: {
  white: primitiveColors.white,
  black: primitiveColors.black,  
  zinc: primitiveColors.zinc,
  blue: primitiveColors.blue,
  green: primitiveColors.green,
  red: primitiveColors.red,
  amber: primitiveColors.amber,
}
```

If you try to use a color like `purple-400` or `indigo-600`, Tailwind will ignore it since those colors aren't in our token system.

## Storybook Documentation

All design tokens are documented in Storybook with interactive color swatches. You can see the full palette, copy hex values, and understand the relationships between different token levels.

Navigate to the "Foundation → Design Tokens" story to explore the complete system visually.

## Accessibility & Contrast

All color combinations in the token system meet WCAG accessibility standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum  
- Interactive elements maintain proper contrast in all states
- Warning/alert colors provide sufficient contrast for accessibility compliance

The zinc scale particularly ensures readable text across all backgrounds, while the color families provide sufficient contrast for their intended uses.

### Accessibility Implementation Requirements

When using design tokens for UI components, follow these accessibility patterns:

```tsx
// ✅ Proper alert implementation with accessibility
const AccessibleWarning = () => {
  return (
    <div 
      className="bg-warning-background border border-warning-border text-warning-foreground p-3 rounded-md"
      role="alert"
      aria-live="polite"
    >
      <div className="font-medium">Warning Title</div>
      <div className="text-sm mt-1">Warning description</div>
    </div>
  )
}

// ✅ Proper interactive element with ARIA
const AccessibleButton = ({ isExpanded, onToggle, children }) => {
  return (
    <button
      className="bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-ring"
      aria-expanded={isExpanded}
      onClick={onToggle}
    >
      {children}
    </button>
  )
}
```

Always pair design tokens with proper semantic markup and ARIA attributes for full accessibility compliance.

## Dark Mode Ready

The token architecture supports theme switching - though dark mode isn't implemented yet, the foundation is there. When we add dark mode, we'll create alternate token values that map to the same semantic meanings.

## Future Considerations

The three-tier system makes it straightforward to:
- Add new color families (like purple for premium features)
- Create seasonal or themed color variations
- Implement user-customizable themes
- Support brand-specific color schemes for different story worlds

The key principle is that components reference semantic or contextual tokens, never primitive values directly. This keeps the system flexible as visual requirements evolve.