# Logger Utility Documentation

The Logger utility provides standardized debug logging throughout the Narraitor application with severity levels, environment-based toggling, and formatted console output.

## Overview

The Logger class provides:
- Multiple severity levels (debug, info, warn, error)
- Environment-based automatic toggling
- Formatted timestamps
- Contextual logging (component/module names)
- Colored console output in development
- Zero performance impact in production

## Basic Usage

```typescript
import Logger from '@/lib/utils/logger';

// Create a logger instance with context
const logger = new Logger('MyComponent');

// Log messages at different severity levels
logger.debug('Debug message', { data: 'value' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

## Severity Levels

The logger supports four severity levels:

- **debug**: Detailed information typically only of interest when diagnosing problems
- **info**: Informational messages that highlight progress of the application
- **warn**: Warning messages about potentially harmful situations
- **error**: Error messages about problems that need attention

## Environment Configuration

The logger is controlled by environment variables:

- `NEXT_PUBLIC_DEBUG_LOGGING`: Set to `'true'` to enable logging in development
- `NODE_ENV`: Logging is automatically disabled in production

Example `.env.local`:
```
NEXT_PUBLIC_DEBUG_LOGGING=true
```

## Features

### Timestamp Formatting
All log messages include precise timestamps in HH:MM:SS.mmm format:
```
[14:32:05.123] DEBUG [GameSession] Component rendering
```

### Context Tracking
Each logger instance includes context to identify the source:
```typescript
const logger = new Logger('SessionStore');
logger.info('Session initialized'); // [14:32:05.123] INFO  [SessionStore] Session initialized
```

### Color Coding
In development, log levels are color-coded for better visibility:
- DEBUG: Gray
- INFO: Blue
- WARN: Orange
- ERROR: Red

### Production Safety
Logging is automatically disabled in production to prevent console spam and potential performance impacts.

## Integration Examples

### React Component
```typescript
const MyComponent: React.FC = () => {
  const logger = React.useMemo(() => new Logger('MyComponent'), []);
  
  useEffect(() => {
    logger.debug('Component mounted');
    return () => {
      logger.debug('Component unmounted');
    };
  }, [logger]);
  
  return <div>My Component</div>;
};
```

### Zustand Store
```typescript
const logger = new Logger('MyStore');

export const myStore = create((set, get) => ({
  doSomething: () => {
    logger.debug('Starting operation');
    try {
      // ... operation logic
      logger.info('Operation completed');
    } catch (error) {
      logger.error('Operation failed', error);
    }
  }
}));
```

## Best Practices

1. **Create one logger per component/module**: This helps identify the source of logs
2. **Use appropriate severity levels**: Choose the right level for your message
3. **Include contextual data**: Pass relevant objects/values as additional arguments
4. **Don't log sensitive information**: Avoid logging passwords, tokens, or PII
5. **Use debug for flow tracking**: Track component lifecycle and function calls
6. **Use info for important state changes**: Log significant application events
7. **Use warn for recoverable issues**: Log problems that don't prevent operation
8. **Use error for failures**: Log errors that need investigation

## Migration Guide

To migrate from `console.log` statements:

1. Import the Logger class
2. Create a logger instance with appropriate context
3. Replace console methods:
   - `console.log` → `logger.info` or `logger.debug`
   - `console.warn` → `logger.warn`
   - `console.error` → `logger.error`

Example migration:
```typescript
// Before
console.log('[GameSession] Session initialized');
console.error('[GameSession] Error:', error);

// After
const logger = new Logger('GameSession');
logger.info('Session initialized');
logger.error('Error:', error);
```

## API Reference

### Constructor
```typescript
new Logger(context: string)
```
- `context`: A string identifying the source of logs (component/module name)

### Methods
```typescript
logger.debug(...args: any[]): void
logger.info(...args: any[]): void
logger.warn(...args: any[]): void
logger.error(...args: any[]): void
```
- All methods accept any number of arguments
- Arguments are passed through to the console methods

## Testing

The logger is designed to be easily testable. In your tests:

```typescript
// Mock console methods
const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

// Enable logging for tests
process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';

// Test logger behavior
const logger = new Logger('TestComponent');
logger.debug('test message');

expect(consoleDebugSpy).toHaveBeenCalledWith(
  expect.stringContaining('[TestComponent]'),
  expect.any(String),
  'test message'
);
```