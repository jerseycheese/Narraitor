---
title: "Design Token System"
type: design-system
category: tokens
tags: [design-tokens, colors, architecture, theming]
created: 2025-01-09
updated: 2025-01-09
---

# Design Token System

The design token system provides a structured approach to managing colors, spacing, and other design properties across the entire application. Think of it as the foundation that everything else builds on - when you need a color or spacing value, you grab it from here instead of hardcoding values.

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
  gray: {
    100: '#f3f4f6',
    300: '#d1d5db', 
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
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

The palette intentionally uses a simplified scale (100, 300, 500, 700, 900) rather than the full Tailwind spectrum. This keeps color decisions manageable and ensures consistency.

### Semantic Tokens

These map primitive colors to their intended purpose in the interface. Instead of using `blue-500` directly, you'd use `primary` which happens to be `blue-500`. This layer lets you change what "primary" means without touching every component.

```typescript
export const semanticColors = {
  primary: primitiveColors.blue[700],      // Main action color
  secondary: primitiveColors.gray[700],    // Secondary actions
  success: primitiveColors.green[700],     // Positive feedback
  warning: primitiveColors.amber[700],     // Caution states
  danger: primitiveColors.red[700],        // Error states
  info: primitiveColors.blue[500],         // Informational content
  muted: primitiveColors.gray[500],        // Subtle text
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

The most common way you'll use tokens is through Tailwind classes. The system is configured so that `bg-blue-500` automatically maps to our design token values.

```tsx
const Button = ({ variant = 'primary' }) => {
  return (
    <button className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900">
      Click me
    </button>
  )
}
```

### With CSS theme() Functions

For more complex styling or when you need to reference tokens in CSS, use the `theme()` function:

```css
.custom-component {
  background-color: theme('colors.blue.500');
  border: 1px solid theme('colors.gray.300');
  color: theme('colors.gray.900');
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

**Gray Family**: Neutral elements, text, and subtle UI components
- `gray-100`: Light backgrounds, subtle sections
- `gray-300`: Borders, dividers, inactive states
- `gray-500`: Muted text, secondary information  
- `gray-700`: Primary text, active states
- `gray-900`: High contrast text, headings

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
  gray: primitiveColors.gray,
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

The gray scale particularly ensures readable text across all backgrounds, while the color families provide sufficient contrast for their intended uses.

## Dark Mode Ready

The token architecture supports theme switching - though dark mode isn't implemented yet, the foundation is there. When we add dark mode, we'll create alternate token values that map to the same semantic meanings.

## Future Considerations

The three-tier system makes it straightforward to:
- Add new color families (like purple for premium features)
- Create seasonal or themed color variations
- Implement user-customizable themes
- Support brand-specific color schemes for different story worlds

The key principle is that components reference semantic or contextual tokens, never primitive values directly. This keeps the system flexible as visual requirements evolve.