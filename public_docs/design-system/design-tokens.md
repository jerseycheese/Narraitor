---
title: "Design Token System"
type: design-system
category: tokens
tags: [design-tokens, colors, architecture, theming, dark-mode]
created: 2025-01-09
updated: 2025-06-15
---

# Design Token System

Design tokens manage colors, spacing, typography, and elevation across the app via CSS custom properties. Every visual value consumed by components comes from token variables scoped to the active design system and color scheme.

For the design rationale behind having three structurally-different design systems instead of one — and how that shapes the token model below — see [ADR-011](../architecture/ADR-011-three-design-systems.md). For an AI-readable summary of the same surface (tokens, components, do's and don'ts), see [DESIGN.md](../../DESIGN.md) at the repo root.

## Architecture Overview

The token system uses a three-tier hierarchy of CSS custom properties, defined per-theme in dedicated CSS files:

**Global Tokens** → **Semantic Tokens** → **Component Tokens**

Each design system (DS1, DS2, DS3) defines all three tiers under a `[data-theme]` attribute selector, with separate blocks for light and dark mode. Changing the active theme swaps the entire token set at the root level — every component that consumes `var(--token-name)` updates automatically.

### Tier 1: Global Tokens

These establish the design system's identity — fonts, surface colors, spacing, and border radii. They live in `src/lib/theme/themes/ds1.css`, `ds2.css`, and `ds3.css`.

```css
/* From ds1.css — "The Drafting Table" */
[data-theme="ds1"] {
  /* Typography: semantic names map to specific font families */
  --font-narrative: var(--font-lora);
  --font-system: var(--font-ibm-plex-mono);
  --font-interface: var(--font-ibm-plex-sans);

  /* Surface colors */
  --color-canvas: rgb(253 251 247);        /* Page background */
  --color-surface: rgb(255 255 255);       /* Component backgrounds */
  --color-surface-hover: rgb(244 244 245); /* Interactive hover state */

  /* Border colors */
  --color-border: rgb(228 228 231);        /* Default borders */
  --color-border-strong: rgb(212 212 216); /* Emphasized borders */

  /* Text colors */
  --color-text-primary: rgb(17 17 17);     /* Main body text */
  --color-text-secondary: rgb(63 63 70);   /* Secondary text */
  --color-text-muted: rgb(113 113 122);    /* Disabled/hint text */
  --color-text-inverse: rgb(255 255 255);  /* Text on dark surfaces */

  /* Accent */
  --color-accent: rgb(49 46 129);          /* Primary accent */
  --color-accent-hover: rgb(30 27 75);     /* Accent hover state */
  --color-accent-soft: rgb(49 46 129 / 8%);

  /* Spacing scale (Tailwind-aligned) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Radius */
  --radius: 0.5rem;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-full: 9999px;
}
```

Each design system provides these same tokens with different values — DS2 uses warmer tones and softer radii, DS3 uses cooler tones and tighter radii.

### Tier 2: Semantic Tokens

These map intent and context onto the global foundation. Status feedback, storytelling contexts, and elevation are all semantic tokens.

```css
[data-theme="ds1"] {
  /* Status colors */
  --color-warning: rgb(146 64 14);
  --color-success: hsl(var(--success));
  --color-info: hsl(var(--info));
  --color-danger: rgb(185 28 28);

  /* Story ending tones (HSL values) */
  --ending-triumphant: 43 96% 56%;
  --ending-bittersweet: 221.2 83.2% 53.1%;
  --ending-mysterious: 240 5.9% 10%;
  --ending-tragic: 0 84% 60%;
  --ending-hopeful: 142.1 76.2% 45.3%;

  /* Lore category tags (background / border / text triplets) */
  --lore-characters-bg: 214 92% 91%;
  --lore-characters-border: 213 84% 73%;
  --lore-characters-text: 224 76% 25%;
  --lore-locations-bg: 142 69% 83%;
  --lore-locations-border: 34 84% 44%;
  --lore-locations-text: 154 86% 27%;

  /* Choice alignment colors */
  --alignment-lawful-bg: 213 100% 96%;
  --alignment-lawful-border: 221 91% 91%;
  --alignment-lawful-text: 224 76% 48%;
  --alignment-chaotic-bg: 33 100% 96%;
  --alignment-chaotic-border: 32 98% 83%;
  --alignment-chaotic-text: 20 91% 48%;

  /* Elevation (shadows) */
  --shadow-overlay: 0 6px 18px rgb(0 0 0 / 8%);
  --shadow-drawer: -12px 0 18px rgb(0 0 0 / 8%);
}
```

### Tier 3: Component Tokens (shadcn/ui)

HSL-based tokens that integrate with the shadcn/ui component library. These are consumed by component classes like `bg-primary`, `text-muted-foreground`, etc.

```css
[data-theme="ds1"] {
  --background: 0 0% 100%;
  --foreground: 240 5.9% 10%;
  --primary: 221.2 83.2% 44.3%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 3.8% 26.1%;
  --secondary-foreground: 0 0% 100%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 240 5.2% 90%;
  --input: 240 5.2% 90%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;

  /* Extended status tokens with background/border/muted variants */
  --success: 142 71% 45%;
  --success-background: 142 69% 83%;
  --success-border: 142 69% 83%;
  --warning: 32 95% 44%;
  --warning-background: 43 76% 83%;
  --warning-border: 43 76% 83%;
  --info: 217 91% 60%;
  --info-background: 214 92% 91%;
  --info-border: 214 92% 91%;
}
```

## Using Design Tokens

### In CSS (Preferred)

Use `var()` to consume tokens. This is the primary pattern:

```css
.custom-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
}
```

### In Tailwind Classes

Semantic Tailwind classes consume the component-tier tokens automatically:

```tsx
// Good — uses semantic design tokens
const Button = ({ variant = 'primary' }) => {
  return (
    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
      Click me
    </button>
  )
}

// Bad — hardcodes specific color values
const BadButton = () => {
  return (
    <button className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-900">
      Click me
    </button>
  )
}

// Good — uses semantic warning tokens
const WarningAlert = () => {
  return (
    <div className="bg-warning-background border border-warning-border text-warning-foreground p-3 rounded-md">
      Warning message
    </div>
  )
}
```

### Font Utility Classes

Three semantic font slots are available as utility classes that resolve per-theme:

```tsx
// Narrative text (Lora in DS1, Crimson Pro in DS2, Newsreader in DS3)
<p className="font-narrative">Story content goes here...</p>

// System/code text (IBM Plex Mono in DS1, JetBrains Mono in DS2, Fira Code in DS3)
<code className="font-system">const x = 42;</code>

// Interface text (IBM Plex Sans in DS1, Manrope in DS2, DM Sans in DS3)
<span className="font-interface">Button Label</span>
```

### Direct Import (Rare)

For JavaScript contexts like chart libraries that need actual values, the legacy TypeScript tokens at `src/lib/design-tokens/` still exist. However, CSS custom properties are the canonical system — prefer reading computed styles when JS values are needed.

## Theme-Specific Differences

Each design system has a distinct visual personality:

| Property | DS1 "Drafting Table" | DS2 "Warm Earth" | DS3 "Mechanical Manuscript" |
|----------|---------------------|-------------------|---------------------------|
| **Narrative Font** | Lora | Crimson Pro | Newsreader |
| **System Font** | IBM Plex Mono | JetBrains Mono | Fira Code |
| **Interface Font** | IBM Plex Sans | Manrope | DM Sans |
| **Canvas** | `rgb(253 251 247)` | `rgb(250 248 243)` | `rgb(247 243 237)` |
| **Accent** | Archival Ink Blue `rgb(49 46 129)` | Sage Green `rgb(124 139 111)` | Steel Blue `rgb(91 122 140)` |
| **Radius** | `0.5rem` (square) | `0.75rem` (soft) | `0.375rem` (tight) |
| **Background** | Mechanical grid (72x72px) | Clean solid | Dot grid (24x24px) |

## Shadow Tokens

Two shadow tokens handle different elevation contexts:

**`--shadow-overlay`** — Centered shadow for modals, popovers, and floating elements:
```css
/* DS1 light */ --shadow-overlay: 0 6px 18px rgb(0 0 0 / 8%);
/* DS1 dark  */ --shadow-overlay: 0 8px 24px rgb(0 0 0 / 40%);
```

**`--shadow-drawer`** — Directional shadow with negative x-offset for side panels and drawers:
```css
/* DS1 light */ --shadow-drawer: -12px 0 18px rgb(0 0 0 / 8%);
/* DS1 dark  */ --shadow-drawer: -12px 0 24px rgb(0 0 0 / 40%);
```

The pattern: dark mode increases shadow opacity (8% → 40%) because shadows need more contrast against dark backgrounds to remain visible. The `-12px` x-offset on drawer shadows keeps the shadow on the leading edge of a left-anchored panel.

## What Stays Hardcoded

Some values are intentionally constant across all themes:

- **Font sizes** — Typography scale doesn't change per theme; readability consistency matters more than thematic variation
- **Blur values** — Backdrop blur amounts are perceptual constants
- **Transforms** — Animation translations and scales are functional, not decorative
- **Component heights** — Input heights, header heights, etc. maintain layout consistency across theme switches

These values live in `globals.css` or component-level CSS, not in theme files.

## Storybook Documentation

All design tokens are documented in Storybook with interactive swatches. Navigate to "Foundation → Design Tokens" to explore the complete system visually.

## Accessibility & Contrast

All color combinations meet WCAG accessibility standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum
- Interactive elements maintain proper contrast in all states and themes
- Dark mode tokens are specifically tuned for sufficient contrast on dark backgrounds

```tsx
// Proper alert with accessibility attributes
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
```

Always pair design tokens with proper semantic markup and ARIA attributes for full accessibility compliance.

## Dark Mode

Dark mode is fully implemented. Each design system defines a complete set of dark-mode token overrides using the `.dark` class on `<html>`:

```css
/* Light mode tokens */
[data-theme="ds1"] {
  --color-canvas: rgb(253 251 247);
  --color-text-primary: rgb(17 17 17);
}

/* Dark mode overrides */
[data-theme="ds1"].dark {
  --color-canvas: rgb(9 9 11);
  --color-text-primary: rgb(250 250 250);
}
```

Color scheme selection supports three modes:
- **Light** — forces light tokens
- **Dark** — forces dark tokens
- **System** — follows `prefers-color-scheme` media query, updates in real time

See [global-styles.md](./global-styles.md) for the `ThemeProvider` API and resolution chain.

## Future Considerations

The three-tier system makes it straightforward to:
- Add new design systems (DS4+) by creating a new theme CSS file with the same token interface
- Add new contextual token families for future game features
- Support per-world theme overrides where story worlds customize token subsets

The key principle: components reference semantic or contextual tokens via `var()`, never raw color values. This keeps the system flexible as visual requirements evolve.
