---
title: Error Handling
tags: [errors, patterns, ui]
created: 2025-05-13
updated: 2025-06-26
---

# Error Handling

This error handling focuses on being helpful to users rather than just logging technical details. The pattern is to catch errors, show user-friendly messages, and provide retry options when it makes sense.

## Standard Pattern

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

// Error display. `error` starts null and is reset to null on every retry, so guard it.
{error && (
  <ErrorDisplay
    message={error.message}
    showRetry
    onRetry={handleAction}
    showDismiss
    onDismiss={() => setError(null)}
  />
)}
```

## Error Categories

The distinction between retryable and non-retryable errors matters because it changes what you show the user. If the error is likely temporary (network hiccup, rate limit), give them a retry button. If it's something that won't fix itself (bad auth, malformed request), retrying is pointless and frustrating.

**Retryable errors** happen when external factors cause failures - network issues, timeouts, rate limits. These often resolve on their own, especially network problems that clear up in a few seconds.

**Non-retryable errors** indicate something fundamentally wrong - authentication failures mean invalid credentials, validation errors mean bad data. Retrying won't help until the underlying issue is fixed.

## Common Error Types

Here's how different errors map to user-facing messages and whether retrying makes sense:

| Error Type | What Happened | User Sees | Retry? | Why |
|------------|---------------|-----------|--------|-----|
| Network | Connection failed | "Connection problem. Check your network." | Yes | Often resolves in seconds |
| Timeout | Request took too long | "Request timed out. Try again?" | Yes | Might work on second attempt |
| Rate Limit | Too many requests | "Slow down. Wait a moment." | Yes | Clears after cooldown |
| Auth | Invalid credentials | "Authentication failed. Check login." | No | Needs new credentials |
| Validation | Bad input data | "Invalid data. Check your input." | No | User needs to fix input |

## Best Practices

**Show context, not just errors** - "Network error" is useless. "Couldn't save your character. Check your connection and try again." tells the user what failed and what to do.

**Handle loading states during retries** - When someone clicks retry, disable the button and show a spinner. Otherwise they'll spam click it thinking nothing happened.

**Clear errors on success** - If a retry works, clear the error state. Nothing more confusing than a success notification with an old error still showing.

**Test error scenarios** - Don't just test the happy path. Mock API failures, network issues, and edge cases. Errors are where users need the UI most.
