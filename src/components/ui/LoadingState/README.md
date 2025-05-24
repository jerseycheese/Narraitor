# LoadingState Component

A unified loading state component system for consistent loading indicators across the Narraitor application.

## Usage

Replace existing loading implementations with the appropriate LoadingState variant:

### Before (various implementations):
```tsx
// Spinner pattern
<div className="flex items-center justify-center p-8">
  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent">
    <span className="sr-only">Loading...</span>
  </div>
  <p className="mt-2 text-gray-600">Loading...</p>
</div>

// Pulse pattern
<div className="animate-pulse">
  <h2 className="text-2xl font-semibold text-gray-600 mb-2">Loading Worlds</h2>
  <p className="text-gray-500">Please wait while we load your worlds...</p>
</div>
```

### After (using LoadingState):
```tsx
import { LoadingSpinner, LoadingPulse } from '@/components/ui/LoadingState';

// Spinner pattern
<LoadingSpinner message="Loading..." />

// Pulse pattern
<LoadingPulse message="Loading your worlds..." skeletonLines={3} />
```

## Variants

- **Spinner**: Classic spinning circle indicator
- **Dots**: Three animated dots for processing states
- **Skeleton**: Placeholder lines for content loading
- **Pulse**: Animated placeholder with optional avatar

## Common Use Cases

```tsx
// World loading
<LoadingPulse message="Loading your worlds..." skeletonLines={3} />

// Narrative generation
<LoadingSpinner size="lg" message="Generating narrative..." />

// AI analysis
<LoadingDots message="Analyzing world description..." />

// Button loading state
<button disabled>
  <LoadingSpinner size="sm" inline message="Saving..." />
</button>

// Inline loading
<p>Processing <LoadingDots size="sm" inline /></p>
```

## Props

- `variant`: 'spinner' | 'pulse' | 'dots' | 'skeleton' (default: 'spinner')
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `message`: Optional loading message
- `centered`: Center in container (default: true)
- `inline`: Display inline (default: false)
- `skeletonLines`: Number of skeleton lines (default: 3)
- `showAvatar`: Show avatar in pulse variant (default: false)