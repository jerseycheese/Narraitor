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

[ADR-011](../architecture/ADR-011-three-design-systems.md) explains the design rationale for originally having three structurally-different design systems instead of one; [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md) explains why the app later collapsed back to one, DS3. For an AI-readable summary of the same surface (tokens, components, do's and don'ts), see [DESIGN.md](../../DESIGN.md) at the repo root.

## Architecture Overview

The token system uses a three-tier hierarchy of CSS custom properties:

**Global Tokens** to **Semantic Tokens** to **Component Tokens**

DS3 defines all three tiers under the `[data-theme="ds3"]` attribute selector, with separate blocks for light and dark mode. Every component that consumes `var(--token-name)` picks up the active mode automatically.

### Tier 1: Global Tokens

These establish the design system's identity — fonts, surface colors, and border radii. They live in `src/lib/theme/themes/ds3.css`. (The spacing scale is shared across light/dark rather than per-theme, so it lives in `_shared-tokens.css` under `:root` instead — see below.)

```css
/* From ds3.css — "Mechanical Manuscript" */
[data-theme="ds3"] {
  /* Typography: semantic names map to specific font families */
  --font-narrative: var(--font-newsreader);
  --font-system: var(--font-fira-code);
  --font-interface: var(--font-dm-sans);

  /* Surface colors */
  --color-canvas: rgb(247 243 237);            /* Page background */
  --color-surface: rgb(255 252 246 / 80%);     /* Component backgrounds */
  --color-surface-hover: rgb(239 233 224);     /* Interactive hover state */

  /* Border colors */
  --color-border: rgb(226 217 206);            /* Default borders */
  --color-border-strong: rgb(212 201 186);     /* Emphasized borders */

  /* Text colors */
  --color-text-primary: rgb(42 35 28);         /* Main body text */
  --color-text-secondary: rgb(115 102 88);     /* Secondary text */
  --color-text-muted: rgb(125 113 99);         /* Disabled/hint text */
  --color-text-inverse: rgb(255 255 255);      /* Text on dark surfaces */

  /* Accent (Steel Blue) */
  --color-accent: rgb(91 122 140);
  --color-accent-hover: rgb(74 105 120);
  --color-accent-soft: rgb(91 122 140 / 10%);

  /* Radius (per-theme; --radius-full lives in _shared-tokens.css) */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

```css
/* From _shared-tokens.css — identical across light/dark, no per-theme variation */
:root {
  --space-0_5: 0.125rem;
  --space-1:   0.25rem;
  --space-1_5: 0.375rem;
  --space-2:   0.5rem;
  --space-2_5: 0.625rem;
  --space-3:   0.75rem;
  --space-3_5: 0.875rem;
  --space-4:   1rem;
  --space-5:   1.25rem;
  --space-6:   1.5rem;
  --space-8:   2rem;
  --radius-full: 9999px;
}
```

### Tier 2: Semantic Tokens

These map intent and context onto the global foundation. Status feedback, storytelling contexts, and elevation are all semantic tokens.

```css
[data-theme="ds3"] {
  /* Status colors */
  --color-warning: rgb(113 88 51);
  --color-success: rgb(74 124 89);
  --color-info: rgb(91 122 140);
  --color-danger: rgb(156 64 64);

  /* Story ending tones (HSL values) */
  --ending-triumphant: 36 38% 50%;
  --ending-bittersweet: 200 21% 50%;
  --ending-mysterious: 25 20% 14%;
  --ending-tragic: 0 59% 41%;
  --ending-hopeful: 138 25% 40%;

  /* Lore category tags (background / border / text triplets) */
  --lore-characters-bg: 200 30% 91%;
  --lore-characters-border: 200 30% 68%;
  --lore-characters-text: 200 30% 25%;
  --lore-locations-bg: 138 25% 90%;
  --lore-locations-border: 138 25% 55%;
  --lore-locations-text: 138 30% 27%;

  /* Choice alignment colors */
  --alignment-lawful-bg: 200 40% 96%;
  --alignment-lawful-border: 200 30% 87%;
  --alignment-lawful-text: 200 30% 40%;
  --alignment-chaotic-bg: 30 60% 96%;
  --alignment-chaotic-border: 30 50% 82%;
  --alignment-chaotic-text: 20 50% 42%;

  /* Elevation (shadows) */
  --shadow-overlay: 0 4px 12px rgb(0 0 0 / 10%);
  --shadow-drawer: -12px 0 12px rgb(0 0 0 / 10%);
}
```

### Tier 3: Component Tokens (shadcn-derived)

HSL-based tokens carried over from the shadcn/ui component foundation. They're consumed via
`var()` in component CSS (typically wrapped in `hsl()`, e.g. `background: hsl(var(--primary))`).
These predate the Tailwind removal, so despite the `bg-primary`-style naming there are no
matching Tailwind utility classes — the values are reached through `var()` like every other token.

```css
[data-theme="ds3"] {
  --background: 36 24% 95%;
  --foreground: 25 20% 14%;
  --card: 38 100% 98%;
  --card-foreground: 25 20% 14%;
  --popover: 38 100% 98%;
  --popover-foreground: 25 20% 14%;
  --primary: 200 21% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 25 14% 40%;
  --secondary-foreground: 0 0% 100%;
  --muted: 30 16% 92%;
  --muted-foreground: 25 14% 46%;
  --accent: 30 16% 92%;
  --accent-foreground: 25 20% 14%;
  --border: 29 16% 85%;
  --input: 29 16% 85%;
  --ring: 200 21% 45%;
  --radius: 0.375rem;

  /* Extended status tokens with background/border/muted variants */
  --success: 138 25% 40%;
  --success-background: 138 25% 90%;
  --success-border: 138 25% 75%;
  --warning: 36 38% 40%;
  --warning-background: 36 38% 88%;
  --warning-border: 36 38% 70%;
  --info: 200 21% 45%;
  --info-background: 200 30% 91%;
  --info-border: 200 30% 78%;
}
```

Note: there's no `--destructive` / `--destructive-foreground` pair — `--color-danger` (Tier 2, above) covers that semantic need instead.

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

### In Components

JSX carries semantic class names (composed with `clsx`); the styling lives in the component's
CSS, which consumes the tokens via `var()`:

```tsx
import { clsx } from 'clsx';

const Button = ({ variant = 'primary' }) => (
  <button className={clsx('btn', `btn-${variant}`)}>Click me</button>
);

const WarningAlert = () => (
  <div className="alert alert-warning">Warning message</div>
);
```

```css
.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}

.alert-warning {
  background: hsl(var(--warning-background));
  border: 1px solid hsl(var(--warning-border));
  color: var(--color-text-primary);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}
```

### Font Utility Classes

Three semantic font slots are available as utility classes:

```tsx
// Narrative text (Newsreader)
<p className="font-narrative">Story content goes here...</p>

// System/code text (Fira Code)
<code className="font-system">const x = 42;</code>

// Interface text (DM Sans)
<span className="font-interface">Button Label</span>
```

### Direct Import (Rare)

For JavaScript contexts like chart libraries that need actual values, the legacy TypeScript tokens at `src/lib/design-tokens/` still exist. However, CSS custom properties are the canonical system — prefer reading computed styles when JS values are needed.

## DS3 at a Glance

| Property | DS3 "Mechanical Manuscript" |
|----------|---------------------------|
| **Narrative Font** | Newsreader |
| **System Font** | Fira Code |
| **Interface Font** | DM Sans |
| **Canvas** | `rgb(247 243 237)` |
| **Accent** | Steel Blue `rgb(91 122 140)` |
| **Radius** | `--radius-md: 6px` (tight) |
| **Background** | Dot grid (24x24px) |

This used to be a three-column comparison against DS1 "Drafting Table" and DS2 "Warm Earth" — see
[ADR-011](../architecture/ADR-011-three-design-systems.md) if you want that history — but DS3 is
the only design system now ([ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md)).

## Shadow Tokens

Two shadow tokens handle different elevation contexts:

**`--shadow-overlay`** — Centered shadow for modals, popovers, and floating elements:
```css
/* DS3 light */ --shadow-overlay: 0 4px 12px rgb(0 0 0 / 10%);
/* DS3 dark  */ --shadow-overlay: 0 4px 12px rgb(0 0 0 / 35%);
```

**`--shadow-drawer`** — Directional shadow with negative x-offset for side panels and drawers:
```css
/* DS3 light */ --shadow-drawer: -12px 0 12px rgb(0 0 0 / 10%);
/* DS3 dark  */ --shadow-drawer: -12px 0 12px rgb(0 0 0 / 35%);
```

The pattern: dark mode increases shadow opacity (8% to 40%) because shadows need more contrast against dark backgrounds to remain visible. The `-12px` x-offset on drawer shadows keeps the shadow on the leading edge of a left-anchored panel.

## What Stays Hardcoded

Some values are intentionally constant across all themes:

- **Font sizes** — Typography scale doesn't change per theme; readability consistency matters more than thematic variation
- **Blur values** — Backdrop blur amounts are perceptual constants
- **Transforms** — Animation translations and scales are functional, not decorative
- **Component heights** — Input heights, header heights, etc. maintain layout consistency across theme switches

These values live in `globals.css` or component-level CSS, not in theme files.

## Storybook Documentation

All design tokens are documented in Storybook with interactive swatches. Navigate to "Foundation, then Design Tokens" to explore the complete system visually.

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

Dark mode is fully implemented. DS3 defines a complete set of dark-mode token overrides using the `.dark` class on `<html>`:

```css
/* Light mode tokens */
[data-theme="ds3"] {
  --color-canvas: rgb(247 243 237);
  --color-text-primary: rgb(42 35 28);
}

/* Dark mode overrides */
[data-theme="ds3"].dark {
  --color-canvas: rgb(23 19 16);
  --color-text-primary: rgb(237 232 224);
}
```

Color scheme selection supports three modes:
- **Light** — forces light tokens
- **Dark** — forces dark tokens
- **System** — follows `prefers-color-scheme` media query, updates in real time

See [global-styles.md](./global-styles.md) for the `ThemeProvider` API and resolution chain.

## Future Considerations

The three-tier system still makes it *possible* to add another design system by creating a new
theme CSS file with the same token interface — but [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md)
collapsed DS1/DS2/DS3 down to one because maintaining three stopped paying for itself, so that's
not a direction to reach for casually. More realistic near-term uses of the same three-tier
structure:
- New contextual token families for future game features
- Per-world theme overrides where story worlds customize token subsets

The key principle: components reference semantic or contextual tokens via `var()`, never raw color values. This keeps the system flexible as visual requirements evolve.
