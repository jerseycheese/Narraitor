# Navigation Loading System

So this system handles one of those user experience details that really matters: showing loading states during navigation. Without it, users click something and wonder if it worked, especially on slower connections or when there's a lot of data to load.

## How It Works

There are three main pieces: **NavigationLoadingProvider** manages global loading state, **LoadingOverlay** shows the visual indicator, and **useNavigationLoading** provides the hook for components to trigger loading states during navigation.

The flow is pretty straightforward: User clicks → Hook triggers loading → Provider updates state → Overlay shows → Navigation completes → Loading clears.

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
There's **automatic cleanup** with a 30-second safety timeout in case something goes wrong, **graceful degradation** that continues navigation even if loading fails, and **error boundaries** that integrate with Next.js error handling. Basically, it fails gracefully instead of breaking the user experience.

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
```tsx
const handleSubmit = async (data) => {
  startLoading('Saving changes...');
  try {
    await submitForm(data);
    await navigateWithLoading('/success', 'Redirecting...');
  } finally {
    stopLoading();
  }
};
```

### Long Operations
```tsx
const { startLoading, stopLoading } = useNavigationLoadingContext();

const handleGenerate = async () => {
  startLoading('Generating content...');
  try {
    const result = await generateContent();
    // Process result...
  } finally {
    stopLoading();
  }
};
```

## Configuration

### Timeout Settings
```typescript
// NavigationLoadingProvider.tsx
const SAFETY_TIMEOUT = 30000; // 30 seconds

// useNavigationLoading.ts
const MIN_LOADING_DURATION = 150; // Minimum display time
const LOADING_DEBOUNCE = 100; // Delay before showing
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
    navigateWithLoading: jest.fn(),
    cancelLoading: jest.fn(),
    loadingMessage: ''
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
**Stuck Loading** usually means you have unmatched startLoading/stopLoading calls - every start needs a stop.

**No Loading Display** typically means the NavigationLoadingProvider isn't at the app root, so the context isn't available to child components.

**Flash of Loading** means you might need to adjust the debounce timing for your specific use case.

### Debug Tools
```tsx
// Development-only logging
if (process.env.NODE_ENV === 'development') {
  console.log('Navigation loading state:', isLoading);
}
```

### Testing Page
Visit `/dev/navigation-loading` to test all loading states and scenarios. This is super helpful for debugging timing issues.

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
- [LoadingOverlay Component](../src/components/shared/LoadingOverlay.md)
- [useNavigationLoading Hook](../src/hooks/useNavigationLoading.md)
- [NavigationLoadingProvider](../src/components/shared/NavigationLoadingProvider.md)
- [UI/UX Guidelines](../development/ui-ux-guidelines.md)