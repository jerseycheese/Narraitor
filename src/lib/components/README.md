# Components Library

This directory contains reusable React components for the Narraitor project.

## Components

### ErrorMessage

A component for displaying user-friendly error messages with optional retry functionality.

#### Usage

```typescript
import ErrorMessage from '@/lib/components/ErrorMessage';

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);
  
  const handleRetry = async () => {
    setError(null);
    // Retry logic here
  };
  
  return (
    <div>
      <ErrorMessage 
        error={error}
        onRetry={handleRetry}
        onDismiss={() => setError(null)}
      />
      {/* Other content */}
    </div>
  );
}
```

#### Props

- `error: Error | null` - The error to display. If null, component renders nothing.
- `onRetry?: () => void` - Optional callback for retry action. Only shown for retryable errors.
- `onDismiss: () => void` - Callback when user dismisses the error.

#### Error Types

The component automatically maps technical errors to user-friendly messages:

- **Network errors**: "Connection Problem" with retry option
- **Timeout errors**: "Request Timed Out" with retry option  
- **Rate limit errors**: "Too Many Requests" with retry option
- **Authentication errors**: "Authentication Error" without retry
- **Unknown errors**: "Something Went Wrong" with conditional retry

#### Styling

The component uses Tailwind CSS classes and follows the project's naming convention:
- `.narraitor-error-container`
- `.narraitor-error-title`
- `.narraitor-error-message`
- `.narraitor-error-actions`
- `.narraitor-error-button`

#### Testing

The component includes comprehensive test coverage and Storybook stories for visual testing.

## Conventions

- All components use TypeScript
- Components follow the naming pattern: `ComponentName.tsx`
- Test files are in `__tests__/ComponentName.test.tsx`
- Storybook stories are in `/src/stories/ComponentName.stories.tsx`
- Use data-testid attributes for testing with kebab-case naming
