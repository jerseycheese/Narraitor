---
title: "Tailwind CSS v4 Configuration Guide"
type: guide
category: styling
tags: [tailwind, css, configuration, styling]
created: 2025-05-16
updated: 2025-06-08
---

# Tailwind CSS v4 Configuration Guide

This guide documents the configuration setup for Tailwind CSS v4 in the Narraitor project.

## Overview

Narraitor uses Tailwind CSS v4 with Next.js 15+ App Router. This configuration addresses the build failures that were previously occurring due to incompatibilities between Tailwind CSS v4 and the PostCSS configuration.

## Key Files

The Tailwind CSS configuration is managed through the following files:

1. **postcss.config.mjs** - PostCSS configuration
2. **tailwind.config.ts** - Tailwind CSS configuration
3. **next.config.js** - Next.js configuration
4. **src/app/globals.css** - Global CSS file with Tailwind directives

## Configuration Details

### PostCSS Configuration

The key change in PostCSS configuration for Tailwind CSS v4 is to use `@tailwindcss/postcss` instead of `tailwindcss` directly:

```javascript
export default {
  plugins: {
    'postcss-nested': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

**Important Notes:**
- Plugin order matters - `postcss-nested` should come before `@tailwindcss/postcss`
- Tailwind CSS v4 doesn't have a separate nesting plugin, so we use `postcss-nested` instead

### Tailwind Configuration

The Tailwind configuration targets all necessary directories and includes v4-specific options:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/config-tests/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Theme extensions go here
    },
  },
  // Tailwind v4 specifics
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};

export default config;
```

### Global CSS Structure

The `globals.css` file includes the necessary Tailwind CSS v4 directives:

```css
/* Tailwind CSS v4 directives */
@import "tailwindcss/preflight";
@import "tailwindcss/utilities";

/* Global styles */
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

/* Base styles */
@layer base {
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
    padding: 0;
  }
  
  * {
    box-sizing: border-box;
  }
}

/* Custom components */
@layer components {
  /* Define reusable component classes here */
}

/* Custom utilities */
@layer utilities {
  /* Define custom utility classes here */
}
```

**Important Note:** Tailwind CSS v4 has changed the directive structure:
- `@tailwind base` is replaced with `@import "tailwindcss/preflight"`
- `@tailwind components` is no longer needed (or available) in v4
- `@tailwind utilities` is replaced with `@import "tailwindcss/utilities"`

## Usage Guidelines

### Basic Utility Classes

Use Tailwind utility classes directly in your JSX:

```jsx
<div className="bg-blue-500 text-white p-4 rounded">
  <p className="text-lg font-bold">Hello World</p>
</div>
```

### Responsive Design

Tailwind's responsive prefixes work as expected:

```jsx
<div className="text-sm sm:text-base md:text-lg lg:text-xl">
  Responsive Text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid content */}
</div>
```

### Hover and Other States

Use state variants as needed:

```jsx
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Hover Me
</button>
```

## Testing

A StyleTest component has been created in `src/config-tests/StyleTest.tsx` to verify and demonstrate proper styling. This component is available:

1. In Storybook at `Narraitor/Config/StyleTest`
2. As a test page at `/dev/style-test` in the development environment

### Test Harness Implementation

The test harness (`/src/app/dev/style-test/page.tsx`) demonstrates various Tailwind CSS features:

- Basic styling (colors, typography, spacing)
- Responsive design (breakpoint-specific classes)
- Interactive states (hover effects)
- Grid layouts and component organization

This harness follows our Three-Stage Component Testing approach:
1. **Stage 1:** StyleTest component isolation in Storybook
2. **Stage 2:** Test harness integration in the `/dev/style-test` route
3. **Stage 3:** System integration with tests verifying correct setup

To run the test harness:
```bash
npm run dev
# Then visit http://localhost:3000/dev/style-test in your browser
```

## Storybook Integration

For Storybook to properly display Tailwind CSS styles, additional configuration is required:

1. Import the global CSS file in `.storybook/preview.ts`:

```typescript
import '../src/app/globals.css';
```

2. Add Storybook files to the Tailwind content array in `tailwind.config.ts`:

```typescript
content: [
  // ... other paths
  './.storybook/**/*.{js,ts,jsx,tsx}',
],
```

3. Create a dedicated PostCSS configuration for Storybook in `.storybook/postcss.config.mjs`:

```javascript
module.exports = {
  plugins: {
    'postcss-nested': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

These changes ensure that Tailwind CSS styles are properly applied in Storybook components.

### Regression Testing

Before making any changes to the configuration:

1. Run `npm run build` to verify the build process works
2. Run tests with `npm test -- src/config-tests`
3. Check the StyleTest component in Storybook and on the `/dev/style-test` page

## Component Style Conversion

As part of the Tailwind CSS implementation, we've also converted inline styles to Tailwind classes in the WorldCreationWizard components. For details on this conversion and styling guidelines, see:

- [WorldCreationWizard Tailwind Conversion Guide](/src/components/WorldCreationWizard/TAILWIND_CONVERSION.md)
- [WizardClassNames.ts Utility](/src/components/WorldCreationWizard/WizardClassNames.ts) - Common class patterns for wizard components

## Further Resources

- [Tailwind CSS v4 Documentation](https://v4.tailwindcss.com/docs)
- [Next.js CSS Configuration](https://nextjs.org/docs/app/building-your-application/styling)
- [PostCSS Documentation](https://postcss.org/)
