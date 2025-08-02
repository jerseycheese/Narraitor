# Storage Resilience System

The Storage Resilience System provides robust data persistence for Narraitor, ensuring gameplay continues seamlessly even when browser storage fails.

## Overview

This system implements automatic retry logic, memory fallback, and recovery detection to handle common storage failures like:
- Storage quota exceeded
- Private browsing mode restrictions
- Network connectivity issues
- Browser security policies
- Temporary storage unavailability

## Core Components

### ResilientStorageMiddleware (`src/lib/storage/resilientStorage.ts`)

The main resilience engine that provides:

```typescript
// Automatic retry with exponential backoff
await resilientStorage.setItem(key, value);

// Health monitoring and recovery detection  
resilientStorage.startHealthMonitoring();
await resilientStorage.checkStorageHealth();

// Status tracking
const status = resilientStorage.getStorageStatus(); // HEALTHY | DEGRADED | UNAVAILABLE | RECOVERING
const error = resilientStorage.getLastError();
```

**Key Features:**
- **Retry Logic**: 3 attempts with exponential backoff (100ms, 200ms, 400ms)
- **Memory Fallback**: Seamless fallback to in-memory storage
- **Recovery Detection**: Automatic sync when storage becomes available
- **Health Monitoring**: Periodic checks every 30 seconds

### useStorageStatus Hook (`src/hooks/useStorageStatus.ts`)

React hook for monitoring storage health:

```typescript
const { status, error, lastSuccessfulSync, checkHealth, isLoading } = useStorageStatus();

// Manual health check
await checkHealth();
```

**Returns:**
- `status`: Current storage status enum
- `error`: Last storage error with user-friendly messages
- `lastSuccessfulSync`: Timestamp of last successful operation
- `checkHealth`: Manual health check function
- `isLoading`: Loading state during health checks

### StorageStatus Component (`src/components/shared/StorageStatus.tsx`)

User interface for storage status display:

```typescript
// Floating notification (only appears when issues detected)
<StorageStatus variant="floating" />

// Inline status display (always visible)
<StorageStatus variant="inline" />
```

**Features:**
- **Floating Mode**: Appears only during storage issues
- **Inline Mode**: Always visible status indicator
- **User Actions**: Retry button for recoverable errors
- **Dismissible**: Users can dismiss floating notifications
- **Accessible**: Proper ARIA attributes and keyboard support

## Usage Examples

### Basic Setup

```typescript
import { ResilientStorageMiddleware } from '@/lib/storage/resilientStorage';

const storage = new ResilientStorageMiddleware({
  onStatusChange: (status, error) => {
    console.log('Storage status changed:', status, error);
  },
  retryAttempts: 3,
  baseDelay: 100
});

await storage.setItem('key', 'value');
const value = await storage.getItem('key');
```

### React Integration

```typescript
import { useStorageStatus } from '@/hooks/useStorageStatus';
import { StorageStatus } from '@/components/shared/StorageStatus';

function MyComponent() {
  const { status, error } = useStorageStatus();
  
  return (
    <div>
      <h1>My App</h1>
      {/* Floating notification for storage issues */}
      <StorageStatus variant="floating" />
      
      {/* Inline status in settings */}
      <StorageStatus variant="inline" />
    </div>
  );
}
```

## Storage Status Types

| Status | Description | User Impact |
|--------|-------------|-------------|
| `HEALTHY` | Storage working normally | None: data saved automatically |
| `DEGRADED` | Intermittent issues detected | Some operations may be slower |
| `UNAVAILABLE` | Storage completely unavailable | Memory-only mode active |
| `RECOVERING` | Syncing data back to storage | Brief delay during recovery |

## Error Handling

The system provides user-friendly error messages:

```typescript
interface StorageError {
  userMessage: string;        // "Storage quota exceeded. Please free up space."
  technicalMessage: string;   // "QuotaExceededError"
  isRecoverable: boolean;     // true if retry might work
  shouldNotify: boolean;      // true if user should be informed
}
```

**Common Error Scenarios:**
- **Quota Exceeded**: User needs to free up browser storage
- **Private Browsing**: Storage unavailable, memory-only mode active
- **Security Restrictions**: Browser blocking storage access
- **Network Issues**: Temporary connectivity problems

## Memory Fallback Behavior

When storage fails:

1. **Immediate Fallback**: Data stored in memory Map
2. **Continued Functionality**: App works normally
3. **Recovery Detection**: System monitors for storage availability
4. **Automatic Sync**: Memory data synced back when storage recovers
5. **User Notification**: Clear status indicators shown

**Important**: Memory data is lost on page refresh/close. Users are warned about this.

## Testing

Comprehensive test coverage includes:

- **Retry Logic**: Exponential backoff and failure handling
- **Memory Fallback**: Seamless operation during storage failures
- **Recovery Detection**: Automatic sync when storage returns
- **UI Components**: All variants and user interactions
- **Error Scenarios**: Quota exceeded, security errors, etc.

Run storage resilience tests:
```bash
npm test -- --testPathPattern="storageResilience|StorageStatus|useStorageStatus"
```

## Configuration

The system can be configured for different environments:

```typescript
// Production configuration
const storage = new ResilientStorageMiddleware({
  retryAttempts: 3,
  baseDelay: 100,
  healthCheckInterval: 30000, // 30 seconds
  onStatusChange: (status, error) => {
    // Send to analytics/monitoring
  }
});

// Development configuration  
const storage = new ResilientStorageMiddleware({
  retryAttempts: 1,
  baseDelay: 50,
  healthCheckInterval: 5000, // 5 seconds for faster feedback
  onStatusChange: (status, error) => {
    console.log('Storage status:', status, error);
  }
});
```

## Best Practices

1. **Monitor Status**: Always show storage status in user interface
2. **Graceful Degradation**: Ensure app works in memory-only mode
3. **User Communication**: Provide clear, actionable error messages
4. **Recovery Handling**: Allow users to trigger manual health checks
5. **Data Loss Prevention**: Warn users about memory-only mode limitations

## Troubleshooting

**Q: Storage keeps failing with quota errors**
A: User needs to clear browser data or the app needs storage optimization

**Q: Recovery not working after storage becomes available**
A: Try manual health check via UI or wait for next automatic check

**Q: Memory-only mode performance issues**
A: Large datasets in memory may impact performance: consider data pruning

**Q: Status not updating in UI**
A: Ensure useStorageStatus hook is used and component is properly mounted

## Integration Points

The storage resilience system integrates with:

- **Zustand Stores**: All state persistence uses resilient middleware
- **IndexedDB**: Primary storage with automatic fallback
- **Error Reporting**: Structured error information for monitoring
- **User Interface**: Visual feedback through StorageStatus component
- **Health Monitoring**: Periodic background checks and manual triggers