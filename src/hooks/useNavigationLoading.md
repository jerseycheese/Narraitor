# useNavigationLoading Hook

## Overview
A React hook that provides programmatic navigation with loading states, integrating with Next.js App Router events and the app-wide loading system.

## Features
- **Router Integration**: Listens to Next.js router events for automatic loading detection
- **Debounced Loading**: Prevents flash of loading states for fast navigation
- **Error Handling**: Graceful fallback when navigation fails
- **Context Integration**: Works with NavigationLoadingProvider for global state

## API

### Returns
```typescript
interface NavigationLoadingHook {
  /** Current loading state */
  isLoading: boolean;
  /** Navigate with loading indicator */
  navigateWithLoading: (url: string, message?: string) => Promise<void>;
  /** Cancel current loading operation */
  cancelLoading: () => void;
  /** Current loading message */
  loadingMessage: string;
}
```

## Usage

### Basic Navigation
```tsx
import { useNavigationLoading } from '@/hooks';

function MyComponent() {
  const { navigateWithLoading, isLoading } = useNavigationLoading();

  const handleNavigate = () => {
    navigateWithLoading('/world/123', 'Loading world...');
  };

  return (
    <button onClick={handleNavigate} disabled={isLoading}>
      Go to World
    </button>
  );
}
```

### With Context Provider
```tsx
import { NavigationLoadingProvider } from '@/components/shared';

function App() {
  return (
    <NavigationLoadingProvider>
      <MyComponent />
    </NavigationLoadingProvider>
  );
}
```

### Advanced Usage
```tsx
function NavigationButton({ url, children }) {
  const { navigateWithLoading, isLoading, cancelLoading } = useNavigationLoading();

  const handleClick = async () => {
    try {
      await navigateWithLoading(url, `Loading ${children}...`);
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={isLoading}>
        {children}
      </button>
      {isLoading && (
        <button onClick={cancelLoading}>Cancel</button>
      )}
    </div>
  );
}
```

## Configuration

### Debounce Settings
The hook includes built-in debouncing to prevent loading flashes:
- **Minimum Duration**: 150ms minimum display time
- **Debounce Delay**: 100ms delay before showing loading

### Error Handling
Navigation failures are handled gracefully:
- Loading state is cleared on error
- Console errors for debugging
- No user-facing error display (handled by error boundaries)

## Integration Points
- **NavigationLoadingProvider**: Global loading state management
- **LoadingOverlay**: Automatic overlay display
- **Navigation Component**: Pre-integrated navigation buttons
- **Next.js Router**: Direct integration with App Router events

## Best Practices
1. **Use descriptive messages**: Help users understand what's loading
2. **Provide cancel options**: For longer operations
3. **Handle errors**: Wrap navigation in try-catch blocks
4. **Avoid nesting**: Don't call navigateWithLoading while already loading

## Testing
The hook is fully tested with mocked router events:
```tsx
// See: src/hooks/__tests__/useNavigationLoading.test.ts
```