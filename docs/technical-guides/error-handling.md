---
title: Error Handling
tags: [errors, patterns, ui]
created: 2025-05-13
updated: 2025-06-26
---

# Error Handling

User-friendly error handling patterns for technical failures.

## Core Pattern

```typescript
// Component error handling
const [error, setError] = useState<Error | null>(null);
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    await performAction();
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Unknown error'));
  } finally {
    setLoading(false);
  }
};

// Error display
<ErrorMessage 
  error={error}
  onRetry={handleAction}
  onDismiss={() => setError(null)}
/>
```

## Error Types

**Retryable**: Network errors, timeouts, rate limits
**Non-Retryable**: Authentication errors, invalid requests

## Error Mapping

| Error Type | User Message | Retryable |
|------------|--------------|-----------|
| Network | Connection Problem | Yes |
| Timeout | Request Timed Out | Yes |
| Rate Limit | Too Many Requests | Yes |
| Auth | Authentication Error | No |

## Best Practices

- Provide clear error context and actions
- Handle loading states during retries
- Clear errors on successful operations
- Test error scenarios in components
