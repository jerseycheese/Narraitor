# Shared Components

## SkipLinks

Accessibility navigation component that provides skip links for screen readers and keyboard users.

### Features
- "Skip to main content" link for WCAG 2.1 AA compliance
- Visually hidden by default, visible when focused
- Proper focus management and keyboard navigation
- Automatic scroll to target content

### Usage
```tsx
import { SkipLinks } from '@/components/shared/SkipLinks';

// Place at the very beginning of your layout
<SkipLinks />
```

The component automatically targets the `#main-content` element in the page layout.