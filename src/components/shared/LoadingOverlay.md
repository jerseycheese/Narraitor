# LoadingOverlay Component

## Overview
LoadingOverlay provides a full-screen modal overlay with loading indicators for navigation transitions and long-running operations.

## Features
- **Accessibility**: Full ARIA support with focus trapping and screen reader announcements
- **Keyboard Navigation**: Escape key cancellation and tab navigation management
- **Configurable**: Multiple loading variants, custom messages, and optional cancel functionality
- **Responsive**: Adapts to different screen sizes and themes

## Props
```typescript
interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Loading indicator variant */
  variant?: LoadingVariant;
  /** Loading message to display */
  message?: string;
  /** Optional cancel callback - shows cancel button if provided */
  onCancel?: () => void;
  /** Additional CSS classes for the overlay */
  className?: string;
}
```

## Usage

### Basic Loading
```tsx
import { LoadingOverlay } from '@/components/shared';

<LoadingOverlay
  isVisible={isLoading}
  message="Loading page..."
/>
```

### With Cancel Option
```tsx
<LoadingOverlay
  isVisible={isLoading}
  message="Generating world..."
  onCancel={() => setIsLoading(false)}
  variant="dots"
/>
```

### Navigation Loading
Used automatically by the navigation loading system:
```tsx
const { navigateWithLoading } = useNavigationLoading();

// This will show LoadingOverlay automatically
navigateWithLoading('/world/123', 'Loading world...');
```

## Accessibility Features
- **Focus Trap**: Keeps keyboard focus within the overlay
- **ARIA Labels**: Proper dialog labeling and live regions
- **Screen Reader Support**: Loading state announcements
- **Keyboard Controls**: Escape key cancellation

## Integration with Navigation System
LoadingOverlay is automatically used by:
- `NavigationLoadingProvider` for app-wide loading states
- `useNavigationLoading` hook for programmatic navigation
- Navigation component for standard navigation buttons

## Storybook
View all variants and states in Storybook:
```bash
npm run storybook
# Navigate to Components > Shared > LoadingOverlay
```