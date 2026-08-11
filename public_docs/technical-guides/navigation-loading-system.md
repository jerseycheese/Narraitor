# Navigation Loading System

So this system handles one of those user experience details that really matters: showing loading states during navigation. Without it, users click something and wonder if it worked, especially on slower connections or when there's a lot of data to load.

## How It Works

There are three main pieces: **NavigationLoadingProvider** manages global loading state, **LoadingOverlay** shows the visual indicator, and **useNavigationLoading** provides the hook for components to trigger loading states during navigation.

The flow is pretty straightforward: a user clicks, the hook triggers loading, the provider updates state, the overlay shows, navigation completes, and the loading state clears.

## Implementation

### 1. Provider Setup
```tsx
// app/layout.tsx
import { NavigationLoadingProvider } from '@/components/shared';

export default function RootLayout({ children }) {
  return (
    <NavigationLoadingProvider>
      {children}
    </NavigationLoadingProvider>
  );
}
```

### 2. Navigation with Loading
```tsx
import { useNavigationLoading } from '@/hooks';

function MyComponent() {
  const { navigateWithLoading } = useNavigationLoading();

  return (
    <button onClick={() => navigateWithLoading('/page', 'Loading...')}>
      Navigate
    </button>
  );
}
```

### 3. Pre-integrated Navigation
```tsx
// Navigation buttons automatically include loading states
<Navigation /> // Already has loading states built-in
```

## Features

### Debounced Loading
The system is smart about when to show loading indicators. There's a **minimum duration** of 150ms to prevent flashing, a **debounce delay** of 100ms before showing loading, and **smart timing** that only shows for operations that actually need it. This prevents the jarring experience of seeing a loading spinner flash for 50ms.

### Accessibility
**Focus Trapping** keeps keyboard focus in the loading modal, **ARIA Support** provides screen reader announcements, and **Keyboard Controls** let users hit Escape to cancel. Accessibility was built in from the start, not added as an afterthought.

### Error Handling
There's **automatic cleanup** with a 30-second safety timeout in case something goes wrong, navigation continues even if loading fails, and **error boundaries** integrate with Next.js error handling.

### Router Integration
**Next.js App Router** integration works directly with router events, **route changes** are automatically detected for navigation start/end, and **client-side navigation** works with all Next.js navigation methods. It hooks into the router instead of trying to guess when navigation happens.

## Usage Patterns

### Standard Navigation
```tsx
const { navigateWithLoading } = useNavigationLoading();

// Basic navigation
navigateWithLoading('/worlds/123');

// With custom message
navigateWithLoading('/worlds/123', 'Loading world details...');
```

### Form Submissions
There's no `startLoading`/`stopLoading` pair. Set the state, then clear it:

```tsx
const { setLoadingState, clearLoading, navigateWithLoading } = useNavigationLoadingContext();

const handleSubmit = async (data) => {
  setLoadingState({ isLoading: true, loadingType: 'data', message: 'Saving changes...' });
  try {
    await submitForm(data);
    // Hands off to the redirect overlay. Don't clear here - navigateWithLoading calls
    // router.push and returns immediately, so a clearLoading() in a finally would kill
    // the overlay before the pathname changes. The hook's pathname effect clears it.
    navigateWithLoading('/success', 'Redirecting...');
  } catch (err) {
    clearLoading();
    throw err;
  }
};
```

### Long Operations
```tsx
const { setLoadingState, clearLoading } = useNavigationLoadingContext();

const handleGenerate = async () => {
  setLoadingState({ isLoading: true, loadingType: 'data', message: 'Generating content...' });
  try {
    const result = await generateContent();
    // Process result...
  } finally {
    clearLoading();
  }
};
```

The full surface is `isLoading`, `loadingState`, `setLoadingMessage`, `setLoadingState`,
`clearLoading`, and `navigateWithLoading`. Nothing else.

## Configuration

### Timeout Settings
```typescript
// @/lib/constants/timeouts.ts (imported by NavigationLoadingProvider.tsx)
export const NAV_SAFETY_TIMEOUT_MS = 30000; // 30 seconds

// useNavigationLoading.ts
const DEBOUNCE_DELAY = 150; // ms - wait this long before showing, to avoid a flash on fast connections
const MIN_DISPLAY_DURATION = 800; // ms - once shown, keep it up at least this long
```

### Customization
```tsx
// Custom loading overlay
<LoadingOverlay
  isVisible={isLoading}
  variant="dots"
  message="Custom message..."
  onCancel={handleCancel}
/>
```

## Testing

### Unit Tests
- **Hook Testing**: Mocked router events and state changes
- **Component Testing**: Loading overlay display and interactions
- **Integration Testing**: Full navigation flow testing

### Test Utilities
```tsx
// Mock the navigation loading system
jest.mock('@/hooks/useNavigationLoading', () => ({
  useNavigationLoading: () => ({
    isLoading: false,
    loadingState: { isLoading: false, loadingType: 'page' },
    setLoadingMessage: jest.fn(),
    setLoadingState: jest.fn(),
    clearLoading: jest.fn(),
    navigateWithLoading: jest.fn(),
  })
}));
```

## Performance Considerations

### Debouncing Benefits
- **Prevents Flash**: No loading indicators for fast transitions
- **Smooth UX**: Loading only appears when needed
- **Battery Efficiency**: Reduces unnecessary re-renders

### Memory Management
- **Automatic Cleanup**: Timeouts and event listeners cleaned up
- **Lazy Loading**: Components only render when needed
- **Context Optimization**: Minimal re-renders with context

## Troubleshooting

### Common Issues
**Stuck Loading** usually means a `setLoadingState` with `isLoading: true` and no matching `clearLoading()` - every set needs a clear, ideally in a `finally`.

**No Loading Display** typically means the NavigationLoadingProvider isn't at the app root, so the context isn't available to child components.

**Flash of Loading** means you might need to adjust the debounce timing for your specific use case.

### Debug Tools
```tsx
// Development-only logging
if (process.env.NODE_ENV === 'development') {
  console.log('Navigation loading state:', isLoading);
}
```


## Migration Guide

### From Manual Loading States
```tsx
// Before
const [isLoading, setIsLoading] = useState(false);
const navigate = useRouter().push;

const handleClick = async () => {
  setIsLoading(true);
  await navigate('/page');
  setIsLoading(false);
};

// After
const { navigateWithLoading } = useNavigationLoading();

const handleClick = () => {
  navigateWithLoading('/page', 'Loading...');
};
```

### Integration Checklist
- [ ] Add NavigationLoadingProvider to app layout
- [ ] Replace manual loading states with useNavigationLoading
- [ ] Update navigation buttons to use navigateWithLoading
- [ ] Test loading states across all navigation paths
- [ ] Verify accessibility with screen readers
- [ ] Test on slow network connections

## Related Documentation
- [LoadingOverlay Component](../../src/components/shared/LoadingOverlay.tsx)
- [useNavigationLoading Hook](../../src/hooks/useNavigationLoading.ts)
- [NavigationLoadingProvider](../../src/components/shared/NavigationLoadingProvider.tsx)
- [UI/UX Guidelines](../development/ui-ux-guidelines.md)
