# Navigation Loading System

## Overview
The Navigation Loading System provides comprehensive loading states and user feedback during navigation transitions, ensuring users always know when the application is processing their requests.

## Architecture

### Core Components
1. **NavigationLoadingProvider** - Global state management
2. **LoadingOverlay** - Visual loading indicator
3. **useNavigationLoading** - Navigation hook with loading
4. **Navigation Component** - Pre-integrated navigation

### Flow Diagram
```
User Action → useNavigationLoading → NavigationLoadingProvider → LoadingOverlay
     ↓              ↓                       ↓                    ↓
Navigation     Router Events        Global State         Visual Feedback
```

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
- **Minimum Duration**: 150ms to prevent flashing
- **Debounce Delay**: 100ms before showing loading
- **Smart Timing**: Only shows for operations that need it

### Accessibility
- **Focus Trapping**: Keeps keyboard focus in loading modal
- **ARIA Support**: Screen reader announcements
- **Keyboard Controls**: Escape key cancellation

### Error Handling
- **Automatic Cleanup**: 30-second safety timeout
- **Graceful Degradation**: Continues navigation even if loading fails
- **Error Boundaries**: Integration with Next.js error handling

### Router Integration
- **Next.js App Router**: Direct integration with router events
- **Route Changes**: Automatic detection of navigation start/end
- **Client-Side Navigation**: Works with all Next.js navigation methods

## Usage Patterns

### Standard Navigation
```tsx
const { navigateWithLoading } = useNavigationLoading();

// Basic navigation
navigateWithLoading('/world/123');

// With custom message
navigateWithLoading('/world/123', 'Loading world details...');
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
1. **Stuck Loading**: Check for unmatched startLoading/stopLoading calls
2. **No Loading Display**: Ensure NavigationLoadingProvider is at app root
3. **Flash of Loading**: Adjust debounce timing for your use case

### Debug Tools
```tsx
// Development-only logging
if (process.env.NODE_ENV === 'development') {
  console.log('Navigation loading state:', isLoading);
}
```

### Testing Page
Visit `/dev/navigation-loading` to test all loading states and scenarios.

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