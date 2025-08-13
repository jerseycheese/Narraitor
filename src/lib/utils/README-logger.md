# Logger Utility

The Logger utility provides debug logging throughout the app. It's basically a wrapper around console methods that adds timestamps, context, and environment-based toggling so you can see what's happening during development without cluttering production.

## Why We Need This

When you're debugging React components or tracking down issues in complex state management, console.log statements get messy fast. You end up with logs from all over the place with no way to tell what component they're coming from or when they happened. The logger fixes this by adding consistent formatting and context.

More importantly, it automatically turns off in production so you don't accidentally ship debug logs to users.

## Basic Usage

Using it is straightforward - create a logger instance with a context name (usually your component or module name), then log messages at different severity levels:

```typescript
import Logger from '@/lib/utils/logger';

// Create a logger for your component
const logger = new Logger('MyComponent');

// Log different types of messages
logger.debug('Debug message', { data: 'value' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

## Severity Levels

There are four levels, each for different situations:

- **debug**: Detailed stuff you only care about when diagnosing problems - component lifecycle, function calls, data flow
- **info**: Important events worth noting - user actions, state changes, successful operations
- **warn**: Something's not quite right but the app can continue - missing optional data, fallback behavior
- **error**: Things that broke and need attention - API failures, validation errors, exceptions

## Environment Setup

The logger is controlled by environment variables. Set `NEXT_PUBLIC_DEBUG_LOGGING=true` in your `.env.local` file to enable logging in development:

```
NEXT_PUBLIC_DEBUG_LOGGING=true
```

In production, logging is automatically disabled regardless of this setting.

## Output Format

All log messages include timestamps and context so you can track what's happening:

```
[14:32:05.123] DEBUG [GameSession] Component rendering
[14:32:05.456] INFO  [SessionStore] Session initialized
[14:32:06.789] WARN  [APIClient] Rate limit approaching
[14:32:07.012] ERROR [CharacterStore] Failed to save character
```

The timestamp shows hours:minutes:seconds.milliseconds, which is helpful for tracking timing issues. In development, the different levels are color-coded too - debug is gray, info is blue, warn is orange, error is red.

## Using in React Components

The typical pattern is to create a logger instance at the component level:

```typescript
const MyComponent: React.FC = () => {
  const logger = React.useMemo(() => new Logger('MyComponent'), []);
  
  useEffect(() => {
    logger.debug('Component mounted');
    return () => {
      logger.debug('Component unmounted');
    };
  }, [logger]);
  
  const handleClick = () => {
    logger.info('Button clicked');
    // ... handle the click
  };
  
  return <div>My Component</div>;
};
```

Using `useMemo` ensures you get the same logger instance across re-renders.

## Using in Zustand Stores

For stores, create the logger outside the store definition:

```typescript
const logger = new Logger('MyStore');

export const myStore = create((set, get) => ({
  items: [],
  
  addItem: (item) => {
    logger.debug('Adding item', item);
    try {
      set(state => ({ items: [...state.items, item] }));
      logger.info('Item added successfully');
    } catch (error) {
      logger.error('Failed to add item', error);
    }
  }
}));
```

## Migration from console.log

If you're replacing existing console statements:

- `console.log` → `logger.info` or `logger.debug` (depending on importance)
- `console.warn` → `logger.warn`
- `console.error` → `logger.error`

For example:

```typescript
// Before
console.log('[GameSession] Session initialized');
console.error('[GameSession] Error:', error);

// After
const logger = new Logger('GameSession');
logger.info('Session initialized');
logger.error('Error:', error);
```

## Best Practices

A few guidelines that make logging more useful:

**Create one logger per component or module**. This helps identify where logs are coming from without having to guess.

**Use appropriate severity levels**. Don't log everything as info - use debug for detailed tracking, info for important events, warn for problems that don't break things, and error for actual failures.

**Include relevant context**. Pass objects, IDs, or other relevant data as additional arguments to help with debugging.

**Don't log sensitive information**. Avoid passwords, API keys, or personal data in logs.

**Use debug for flow tracking**. Log when components mount/unmount, when functions are called, when state changes.

**Use info for user actions**. Log button clicks, form submissions, navigation events.

**Use warn for edge cases**. Log when fallback behavior kicks in, when optional data is missing, when things are unusual but not broken.

**Use error for failures**. Log exceptions, API errors, validation failures - anything that needs investigation.

## Testing

In tests, you can mock the console methods to verify logging behavior:

```typescript
const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

// Enable logging for the test
process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';

const logger = new Logger('TestComponent');
logger.debug('test message');

expect(consoleDebugSpy).toHaveBeenCalledWith(
  expect.stringContaining('[TestComponent]'),
  expect.any(String),
  'test message'
);
```

## Performance

In production, the logger does nothing, so there's no performance impact. In development, the overhead is minimal - just some string formatting and console calls. The main thing to avoid is expensive computations in log arguments:

```typescript
// Avoid this - the JSON.stringify runs even if logging is disabled
logger.debug('Complex data:', JSON.stringify(complexObject));

// Better - pass the object directly
logger.debug('Complex data:', complexObject);
```

The logger will handle formatting for you.