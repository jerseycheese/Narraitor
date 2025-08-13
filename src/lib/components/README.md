# Components Library

This directory contains reusable React components for the Narraitor project. These are components that get used across multiple parts of the app, so keeping them in a shared library makes sense.

## ErrorMessage Component

This is the component for displaying user-friendly error messages with optional retry functionality. The main challenge was making technical errors understandable to users without losing the ability to debug when things go wrong.

### Basic Usage

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

### How It Works

The component takes three props:

- `error: Error | null` - The error to display. If null, component renders nothing.
- `onRetry?: () => void` - Optional callback for retry action. Only shown for retryable errors.
- `onDismiss: () => void` - Callback when user dismisses the error.

### Error Mapping

The component automatically maps technical errors to user-friendly messages:

- **Network errors**: "Connection Problem" with retry option
- **Timeout errors**: "Request Timed Out" with retry option  
- **Rate limit errors**: "Too Many Requests" with retry option
- **Authentication errors**: "Authentication Error" without retry
- **Unknown errors**: "Something Went Wrong" with conditional retry

So instead of showing users cryptic error messages like "ERR_NETWORK_TIMEOUT", they see something helpful like "Request Timed Out" with a retry button.

### Styling

The component uses Tailwind CSS classes and follows the project's naming convention:
- `.narraitor-error-container`
- `.narraitor-error-title`
- `.narraitor-error-message`
- `.narraitor-error-actions`
- `.narraitor-error-button`

### Testing

The component includes comprehensive test coverage and Storybook stories for visual testing. The tests cover all the error types and make sure the retry logic works properly.

## Conventions

When adding new components to this library:

- Use TypeScript for everything
- Follow the naming pattern: `ComponentName.tsx`
- Put test files in `__tests__/ComponentName.test.tsx`
- Add Storybook stories in `/src/stories/ComponentName.stories.tsx`
- Use data-testid attributes for testing with kebab-case naming

The idea is to keep these components generic enough that they can be used anywhere in the app, but specific enough that they actually solve real problems we have.