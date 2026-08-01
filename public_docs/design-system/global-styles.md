---
title: "Narraitor Global Styles"
type: design-system
category: styling
tags: [global-styles, css, design-system, theming, dark-mode]
created: 2025-05-17
updated: 2026-07-21
---

# Narraitor Global Styles

The global styling system provides a theme-aware foundation built on plain CSS and design-token custom properties. (There's no Tailwind — it was removed in the design-system migration, `#1097`.) One design system (DS3) with light and dark modes is fully supported — components consume tokens through `var()` and adapt automatically when the user switches color scheme.

[ADR-011](../architecture/ADR-011-three-design-systems.md) explains the rationale for originally having three design systems (and the structural-differentiation principle that shaped the per-theme CSS files); [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md) explains why that later collapsed to DS3 alone.

## CSS Architecture

The styling stack loads in this order:

1. **Theme CSS files** (`src/lib/theme/themes/ds3.css`, plus `_shared-tokens.css`) — define all CSS custom properties under `:root` selectors
2. **Global styles** (`src/app/globals.css`) — base element resets and defaults that consume `var(--token)` values
3. **Component CSS** — co-located styles for specific components, keyed off semantic class names

## Design Token Integration

This file works with the [design token system](./design-tokens.md) to provide consistent styling. Colors, spacing, typography, and elevation values should always reference CSS custom properties rather than hardcoded values.

### Style Guidelines

**The Golden Rule: No Inline Styles**

Styling stays in CSS keyed off semantic class names, because inline styles bypass the theme system:

- Put styling in a CSS class that consumes `var(--token)` values
- Compose class names in JSX with `clsx` (`clsx('card', isActive && 'card-active')`)
- Never use inline styles (`style` prop) for anything the theme should control

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

### In Components

```tsx
import { clsx } from 'clsx';

// Good — a semantic class name; the styling lives in CSS keyed off it
const CustomButton = ({ children, variant = 'primary' }) => {
  return (
    <button className={clsx('btn', `btn-${variant}`)}>
      {children}
    </button>
  );
};
```

```css
/* btn styling consumes tokens, so it adapts per theme */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}
.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
```

## Theme Resolution Chain

The theme system resolves through four stages from CSS definition to rendered output:

### 1. CSS Files Define Tokens

The active token files are `_shared-tokens.css` and `ds3.css`. Shared tokens cover app-wide primitives, and DS3 defines the current design-system tokens under `:root` plus dark-mode overrides:

```css
:root      { /* DS3 light mode tokens */ }
:root.dark { /* DS3 dark mode overrides */ }
```

These files are imported in `src/app/layout.tsx` so all tokens are available globally.

### 2. FOUC Prevention Script

An inline `<script>` in `layout.tsx` runs before React hydrates, reading stored preferences from `localStorage` and applying them immediately to avoid a flash of unstyled content:

```javascript
// Reads narraitor-color-scheme, adds the .dark class if needed
// Runs synchronously before first paint
```

This script matches what `ThemeProvider` will set after hydration, preventing a visible theme flash.

### 3. ThemeProvider Manages State

After React hydrates, `ThemeProvider` takes over. It syncs React state from `localStorage`, applies DOM attributes, and listens for system preference changes.

### 4. CSS Selectors Resolve

The browser resolves `var(--token-name)` references based on the active selectors:
- `:root` selects DS3 light tokens
- `:root.dark` lets DS3 dark tokens override

Components never need to know which theme is active — they just reference `var(--color-surface)` and the cascade handles the rest.

## ThemeProvider and useTheme() API

### ThemeProvider

Wrap your app tree with `ThemeProvider` (already done in `layout.tsx`):

```tsx
import { ThemeProvider } from '@/lib/theme';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="ds3">
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
  const { colorScheme, resolvedColorScheme, setColorScheme } = useTheme();

  // colorScheme: 'light' | 'dark' | 'system'
  // resolvedColorScheme: 'light' | 'dark' (computed — resolves 'system' to actual)
  // setColorScheme: (scheme) => void
}
```

Throws `Error('useTheme must be used within a ThemeProvider')` if called outside the provider.

### Storage & Defaults

| Key | localStorage Key | Default | Purpose |
|-----|-----------------|---------|---------|
| Color scheme | `narraitor-color-scheme` | `'light'` | Light, dark, or system preference |

There's no theme key: the design-system axis was collapsed to one (ADR-013), and the vestigial `theme`/`setTheme` surface was removed from `useTheme()` along with the selector flatten (#1546).

Server-side renders default to DS3 + light. The FOUC script and ThemeProvider sync the actual color-scheme preference after the page loads, preventing hydration mismatches.

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

Buttons are the main thing `globals.css` styles directly. There's no `.btn` family and no
`.card`; the base class is `.button`, with variants `.button-default`, `.button-secondary`,
`.button-outline`, `.button-ghost`, `.button-link`, `.button-destructive`, `.button-success`,
`.button-info`, `.button-warning`, plus sizes `.button-size-default`, `.button-size-sm`,
`.button-size-lg`, `.button-size-icon`.

In practice you don't write those class names yourself. Use the `Button` component from
`src/components/ui/button.tsx`, which composes them from `variant` and `size` props:

```tsx
import { Button } from '@/components/ui/button';

<Button variant="secondary" size="sm">Secondary Action</Button>
```

`.form-group` does exist, but it's route-scoped in `src/app/wizard.css` rather than global.

Also global: the typography classes `.text-narrative`, `.text-technical`, `.text-ui`, the font
helpers `.font-narrative` / `.font-system` / `.font-interface`, and `.data-table`.

## Utility Classes

There's one, and it's the standard name rather than the invented ones this section used to list:
`.sr-only` hides content visually while leaving it available to screen readers. No
`.text-balanced`, no `.visually-hidden`, no `.focus-visible` utility (focus styling is baked into
the component classes via `:focus-visible` selectors).

```tsx
const AccessibleComponent = () => {
  return (
    <span className="sr-only">This text is only visible to screen readers</span>
  );
};
```

## Testing and Development

The global styles can be viewed and tested through the `00-Foundation/Design System Showcase` story in Storybook (`src/stories/00-foundation/DesignSystemShowcase.stories.tsx`), which renders the styled elements in light and dark.
