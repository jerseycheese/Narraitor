# NavigationLoadingProvider

## Overview
A React Context Provider that manages app-wide navigation loading states, providing global loading indicators and state management for navigation transitions.

## Features
- **Global State**: Centralized loading state management
- **Safety Timeout**: Automatic loading cleanup after 30 seconds
- **Context Integration**: Works seamlessly with useNavigationLoading hook
- **Overlay Management**: Automatic LoadingOverlay display

## API

### Props
```typescript
interface NavigationLoadingProviderProps {
  children: React.ReactNode;
}
```

### Context Value
```typescript
interface NavigationLoadingContextValue {
  /** Current loading state */
  isLoading: boolean;
  /** Current loading message */
  message: string;
  /** Start loading with message */
  startLoading: (message: string) => void;
  /** Stop loading */
  stopLoading: () => void;
  /** Whether loading can be cancelled */
  canCancel: boolean;
  /** Cancel loading operation */
  cancelLoading: () => void;
}
```

## Usage

### App Setup
```tsx
// app/layout.tsx
import { NavigationLoadingProvider } from '@/components/shared';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NavigationLoadingProvider>
          {children}
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
```

### Using the Context
```tsx
import { useNavigationLoadingContext } from '@/components/shared';

function MyComponent() {
  const { 
    isLoading, 
    message, 
    startLoading, 
    stopLoading 
  } = useNavigationLoadingContext();

  const handleLongOperation = async () => {
    startLoading('Processing data...');
    try {
      await performLongOperation();
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      {isLoading && <p>Loading: {message}</p>}
      <button onClick={handleLongOperation}>
        Start Operation
      </button>
    </div>
  );
}
```

## Features

### Safety Timeout
Automatically clears loading states after 30 seconds to prevent stuck loading:
```typescript
// Automatically clears loading after 30 seconds
const SAFETY_TIMEOUT = 30000;
```

### LoadingOverlay Integration
Automatically displays LoadingOverlay when loading:
```tsx
// Rendered automatically by the provider
<LoadingOverlay
  isVisible={isLoading}
  message={message}
  onCancel={canCancel ? cancelLoading : undefined}
/>
```

### Error Boundaries
Works with Next.js error boundaries for graceful error handling.

## Integration Points
- **useNavigationLoading**: Primary hook for navigation with loading
- **LoadingOverlay**: Automatic overlay display
- **Navigation Component**: Pre-integrated loading states
- **App Layout**: Global provider setup

## Best Practices
1. **Single Provider**: Only use one provider at the app root
2. **Clear Loading**: Always pair startLoading with stopLoading
3. **Safety Timeout**: Rely on built-in timeout for stuck states
4. **Error Handling**: Use try-finally to ensure cleanup

## State Management
The provider manages:
- **Loading State**: Boolean flag for active loading
- **Message**: Current loading message
- **Timeout**: Safety timeout for automatic cleanup
- **Cancel State**: Whether current operation can be cancelled

## Testing
Mock the provider in tests:
```tsx
// Test wrapper
const TestWrapper = ({ children }) => (
  <NavigationLoadingProvider>
    {children}
  </NavigationLoadingProvider>
);
```

## Architecture
```
App Layout
├── NavigationLoadingProvider
│   ├── Context State Management
│   ├── Safety Timeout
│   └── LoadingOverlay
└── Application Components
    └── useNavigationLoadingContext
```