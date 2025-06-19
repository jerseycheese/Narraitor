---
title: "App Router Migration"
type: architecture
category: migration
tags: [nextjs, app-router, migration]
created: 2025-05-14
updated: 2025-06-08
---

# App Router Migration

## Overview

The Narraitor application has been fully migrated from Next.js Pages Router to App Router to leverage modern React features and improved performance capabilities. As of May 16, 2025, the migration is complete with all Pages Router code removed.

## Migration Summary

### Why App Router?

- **React Server Components**: Better performance with server-side rendering by default
- **Nested Layouts**: Improved code organization and shared UI components
- **Built-in Loading States**: Native loading.tsx support
- **Error Boundaries**: Simplified error handling with error.tsx
- **Metadata API**: Enhanced SEO capabilities
- **Improved Routing**: More intuitive file-based routing with better TypeScript support

### What Changed

#### Directory Structure

**Before (Pages Router - Now Removed):**
```
pages/
├── _app.tsx
├── index.tsx
├── test.tsx
├── simple-test.tsx
└── dev/
    ├── index.tsx
    ├── world-list-screen/
    └── test-nested/
```

**After (App Router - Current Structure):**
```
src/app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page
├── error.tsx           # Error boundary
├── loading.tsx         # Loading state
├── test/page.tsx
├── simple-test/page.tsx
└── dev/
    ├── page.tsx
    ├── layout.tsx
    ├── world-list-screen/page.tsx
    ├── test-nested/page.tsx
    ├── controls/page.tsx
    └── mocks/page.tsx
```

### Key Differences

1. **Page Components**: Each route now uses a `page.tsx` file in its own directory
2. **Layouts**: Shared layouts use `layout.tsx` files that wrap child routes
3. **Client Components**: Components using hooks or browser APIs must have `'use client'` directive
4. **Metadata**: SEO metadata is now exported from layout/page files
5. **Error Handling**: Dedicated `error.tsx` files for error boundaries
6. **Loading States**: Built-in support with `loading.tsx` files

### Migration Details

#### Root Layout

The root layout (`src/app/layout.tsx`) replaces `pages/_app.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Narraitor",
  description: "A narrative-driven RPG framework using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### Client Components

Components using state, effects, or event handlers need the `'use client'` directive:

```typescript
'use client';

export default function InteractiveComponent() {
  const [state, setState] = useState();
  // Component logic
}
```

#### Test Harness Migration

All test harness pages have been migrated to maintain functionality:
- Preserved window test utilities
- Maintained console debugging tools
- Kept mock component structure

### Configuration Updates

1. **Jest Configuration**: Updated to ignore old directories
2. **TypeScript Configuration**: Path mappings remain unchanged
3. **Build Process**: Now uses App Router optimizations

### Known Issues

1. **CSS/Tailwind**: Temporary issue with Tailwind CSS v4 and PostCSS configuration
   - Currently using inline styles as workaround
   - Separate issue created for resolution

2. **Test Files**: Import paths need updating to reflect new structure

### Benefits Realized

1. **Performance**: Improved with server-side rendering by default
2. **Developer Experience**: Better TypeScript support and error messages
3. **Code Organization**: Cleaner structure with nested layouts
4. **SEO**: Enhanced with metadata API
5. **Error Handling**: Simplified with dedicated error boundaries

### Next Steps

1. Fix Tailwind CSS configuration
2. Update test file imports
3. Optimize for React Server Components

## Migration Completion Record

On May 16, 2025, the migration was completed with the following actions:

1. All Pages Router components removed
2. Directory structure standardized on App Router only
3. Documentation updated to reflect the new architecture
4. Successful build verified with npm run build
5. Migration notes added to the repository

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
