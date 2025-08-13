# LoadingState Component

You know how loading indicators were all over the place? Some components had spinners, others had pulsing text, some had those skeleton placeholder things. Each one looked different and behaved differently. Users couldn't tell if something was actually loading or if the app was broken.

This component gives you one consistent way to show loading states throughout the app. Pick the variant that makes sense for your context and you're done.

## Usage

Here's how to replace those scattered loading patterns:

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

Each variant works best in different situations:

- **Spinner**: The classic spinning circle - works great for general loading
- **Dots**: Those three bouncing dots that say "something's happening" - perfect for AI processing
- **Skeleton**: Placeholder lines that show where content will appear - great for lists and cards
- **Pulse**: Animated placeholder that can include an avatar - nice for profile-type content

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