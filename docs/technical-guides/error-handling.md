# Error Handling Guide

This guide outlines the error handling patterns used in the Narraitor project.

## Overview

The error handling system provides user-friendly error messages for technical failures, particularly in AI service interactions.

## Core Components

### userFriendlyErrors

Maps technical errors to user-friendly messages.

```typescript
import { getUserFriendlyError } from '@/lib/ai/userFriendlyErrors';

const userFriendlyError = getUserFriendlyError(error);
```

### ErrorMessage Component

Displays error messages with optional retry functionality.

```typescript
import ErrorMessage from '@/lib/components/ErrorMessage';

<ErrorMessage 
  error={error}
  onRetry={handleRetry}
  onDismiss={() => setError(null)}
/>
```

## Error Types

### Retryable Errors
- **Network errors**: Connection issues
- **Timeout errors**: Request timeouts
- **Rate limit errors**: Too many requests

### Non-Retryable Errors
- **Authentication errors**: Invalid API key
- **Invalid request errors**: Malformed requests

## Implementation Pattern

### In Components Using AI Service

```typescript
function MyAIComponent() {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  
  const generateContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiPromptProcessor.processAndSend(templateId, variables);
      // Handle success
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = () => {
    generateContent();
  };
  
  return (
    <div>
      <ErrorMessage 
        error={error}
        onRetry={handleRetry}
        onDismiss={() => setError(null)}
      />
      {/* Rest of component */}
    </div>
  );
}
```

## Error Mapping

Technical errors are automatically mapped to user-friendly messages:

| Technical Error | User Message | Retryable |
|----------------|--------------|-----------|
| Network error | Connection Problem | Yes |
| Request timeout | Request Timed Out | Yes |
| 429 rate limit | Too Many Requests | Yes |
| 401 unauthorized | Authentication Error | No |
| Unknown error | Something Went Wrong | Depends |

## Styling

Error messages use consistent styling:
- Red color scheme for visibility
- Clear hierarchy with title and message
- Action buttons with appropriate hover states
- Responsive design for all screen sizes

## Testing

### Unit Tests
```typescript
import { getUserFriendlyError } from '@/lib/ai/userFriendlyErrors';

test('should map network error to user-friendly message', () => {
  const error = new Error('Network error');
  const result = getUserFriendlyError(error);
  expect(result.title).toBe('Connection Problem');
});
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import ErrorMessage from '@/lib/components/ErrorMessage';

test('should render error message', () => {
  const error = new Error('Network error');
  render(<ErrorMessage error={error} onDismiss={jest.fn()} />);
  expect(screen.getByText('Connection Problem')).toBeInTheDocument();
});
```

## Best Practices

1. **Always provide error context**: Show users what went wrong and possible actions
2. **Use appropriate error types**: Map errors correctly for better UX
3. **Handle loading states**: Show loading indicators during retries
4. **Clear errors on success**: Remove error messages when operations succeed
5. **Test error scenarios**: Include error handling in your test coverage

## Future Considerations

- Add error logging for debugging
- Implement error analytics
- Consider toast notifications for non-blocking errors
- Add multi-language support for error messages
