---
title: "Narraitor Global Styles"
type: design-system
category: styling
tags: [global-styles, css, design-system, theming, dark-mode]
created: 2025-05-17
updated: 2025-06-15
---

# Narraitor Global Styles

The global styling system provides a theme-aware foundation built on CSS custom properties and Tailwind CSS v4. Three design systems (DS1, DS2, DS3) with light and dark modes are fully supported — components consume tokens through `var()` and adapt automatically when the user switches themes.

## CSS Architecture

The styling stack loads in this order:

1. **Theme CSS files** (`src/lib/theme/themes/ds1.css`, `ds2.css`, `ds3.css`) — define all CSS custom properties under `[data-theme]` selectors
2. **Global styles** (`src/app/globals.css`) — base element resets and defaults that consume `var(--token)` values
3. **Component CSS** — co-located styles for specific components
4. **Tailwind utilities** — atomic utility classes for layout, spacing, and responsive design

## Design Token Integration

This file works with the [design token system](./design-tokens.md) to provide consistent styling. Colors, spacing, typography, and elevation values should always reference CSS custom properties rather than hardcoded values.

### Style Guidelines

**The Golden Rule: No Inline Styles**

We stick to Tailwind classes and CSS custom properties because inline styles bypass the theme system:

- Always use Tailwind utility classes or `var(--token)` references
- Never use inline styles (`style` prop) in components
- If Tailwind doesn't provide what you need, create a custom CSS class that consumes tokens

### In Component CSS

```css
/* Good — consumes theme tokens */
.custom-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
}

.custom-card:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}
```

### In Tailwind Classes

```tsx
// Good — uses semantic design tokens via Tailwind
const CustomButton = ({ children }) => {
  return (
    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
      {children}
    </button>
  );
};

// Bad — bypasses theme system with hardcoded colors
const BadButton = ({ children }) => {
  return (
    <button className="bg-blue-600 px-4 py-2 rounded-md text-white hover:bg-blue-700">
      {children}
    </button>
  );
};
```

## Theme Resolution Chain

The theme system resolves through four stages from CSS definition to rendered output:

### 1. CSS Files Define Tokens

Three theme CSS files (`ds1.css`, `ds2.css`, `ds3.css`) define the complete token set under attribute selectors. Each file has two blocks:

```css
[data-theme="ds1"]      { /* light mode tokens */ }
[data-theme="ds1"].dark { /* dark mode overrides */ }
```

These files are imported in `src/app/layout.tsx` so all tokens are available globally.

### 2. FOUC Prevention Script

An inline `<script>` in `layout.tsx` runs before React hydrates, reading stored preferences from `localStorage` and applying them immediately to avoid a flash of unstyled content:

```javascript
// Reads narraitor-theme → sets data-theme attribute
// Reads narraitor-color-scheme → adds .dark class if needed
// Runs synchronously before first paint
```

This script matches what `ThemeProvider` will set after hydration, preventing a visible theme flash.

### 3. ThemeProvider Manages State

After React hydrates, `ThemeProvider` takes over. It syncs React state from `localStorage`, applies DOM attributes, and listens for system preference changes.

### 4. CSS Selectors Resolve

The browser resolves `var(--token-name)` references based on the active selectors:
- `[data-theme="ds2"]` → DS2 light tokens win
- `[data-theme="ds2"].dark` → DS2 dark tokens override

Components never need to know which theme is active — they just reference `var(--color-surface)` and the cascade handles the rest.

## ThemeProvider and useTheme() API

### ThemeProvider

Wrap your app tree with `ThemeProvider` (already done in `layout.tsx`):

```tsx
import { ThemeProvider } from '@/lib/theme';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="ds1">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### useTheme() Hook

Access theme state from any component:

```tsx
import { useTheme } from '@/lib/theme';

function MyComponent() {
  const { theme, colorScheme, resolvedColorScheme, setTheme, setColorScheme } = useTheme();

  // theme: 'ds1' | 'ds2' | 'ds3'
  // colorScheme: 'light' | 'dark' | 'system'
  // resolvedColorScheme: 'light' | 'dark' (computed — resolves 'system' to actual)
  // setTheme: (theme) => void
  // setColorScheme: (scheme) => void
}
```

Throws `Error('useTheme must be used within a ThemeProvider')` if called outside the provider.

### Storage & Defaults

| Key | localStorage Key | Default | Purpose |
|-----|-----------------|---------|---------|
| Theme | `narraitor-theme` | `'ds1'` | Which design system is active |
| Color scheme | `narraitor-color-scheme` | `'light'` | Light, dark, or system preference |

Server-side renders default to DS1 + light. The FOUC script and ThemeProvider sync the actual preference after the page loads, preventing hydration mismatches.

### System Preference Detection

When `colorScheme` is `'system'`, ThemeProvider listens to `window.matchMedia('(prefers-color-scheme: dark)')` and updates `resolvedColorScheme` in real time when the OS setting changes.

## Adding Theme-Aware Styles to New Components

When building a new component, follow these patterns:

```css
/* Good — uses token variables, works across all themes and modes */
.my-component {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-interface);
}

/* Bad — hardcoded values that ignore the theme system */
.my-component {
  background: #ffffff;
  color: #111111;
  border: 1px solid #e4e4e7;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
}
```

For elevation, use the shadow tokens rather than custom shadow values:
```css
/* Modals, popovers, floating elements */
.modal { box-shadow: var(--shadow-overlay); }

/* Side panels, drawers */
.drawer { box-shadow: var(--shadow-drawer); }
```

## Semantic HTML

Good HTML structure helps with accessibility and SEO, plus it makes the CSS easier to reason about. Use these semantic elements:

- `<main>`: Primary content area
- `<header>`: Introductory content
- `<footer>`: Footer content
- `<section>`: Standalone sections
- `<article>`: Self-contained compositions
- `<nav>`: Navigation sections
- Proper heading hierarchy (`<h1>` through `<h6>`)

## Custom Components

A minimal set of component classes is included:

- `.card`: Card container with border and shadow
- `.form-group`: Form field container
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`: Button variants

Example usage:

```tsx
const CardExample = () => {
  return (
    <div className="card">
      <h2>Card Title</h2>
      <p>Card content goes here.</p>
      <button className="btn btn-primary">Primary Action</button>
      <button className="btn btn-secondary">Secondary Action</button>
    </div>
  );
};
```

## Utility Classes

Essential utility classes for common needs:

- `.text-balanced`: Balanced text wrapping
- `.visually-hidden`: Hide content visually but keep it accessible to screen readers
- `.focus-visible`: Enhanced focus styling for accessibility

```tsx
const AccessibleComponent = () => {
  return (
    <div>
      <span className="visually-hidden">This text is only visible to screen readers</span>
      <p className="text-balanced">This text will have balanced wrapping for better readability</p>
      <button className="focus-visible">This button has enhanced focus styling</button>
    </div>
  );
};
```

## Testing and Development

The global styles can be viewed and tested through the `GlobalStylesDemo` component in Storybook, which demonstrates all styled elements across all theme and color scheme combinations.
