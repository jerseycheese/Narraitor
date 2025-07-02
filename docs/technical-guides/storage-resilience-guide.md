# Storage Resilience System

## Overview

The storage resilience system provides robust, fault-tolerant data persistence for Narraitor using IndexedDB with comprehensive fallback mechanisms. It ensures gameplay continuity even when browser storage fails.

## Architecture

### Core Components

- **ResilientStorageMiddleware**: Main orchestrator with retry logic and fallback mechanisms
- **IndexedDBAdapter**: Low-level IndexedDB interface with graceful error handling
- **useStorageStatus**: React hook for monitoring storage health
- **storageNotifications**: User notification system for storage events
- **storageHelpers**: Utility functions for storage operations and error handling

### Key Features

- **Exponential Backoff Retry**: Automatic retry with increasing delays for transient failures
- **Memory Fallback**: Seamless fallback to in-memory storage when IndexedDB fails
- **Automatic Recovery**: Detects storage recovery and syncs memory data back to IndexedDB
- **Health Monitoring**: Periodic checks with automatic recovery attempts
- **User Notifications**: Context-aware notifications for storage issues

## Usage

### Basic Integration

```typescript
import { createIndexedDBStorage } from '@/state/persistence';
import { persist } from 'zustand/middleware';

// Configure store with resilient persistence
const useStore = create(
  persist(
    (set, get) => ({
      // Your store state
    }),
    {
      name: 'my-store',
      storage: createIndexedDBStorage(),
    }
  )
);
```

### Storage Health Monitoring

```typescript
import { useStorageStatus } from '@/hooks/useStorageStatus';

function StorageStatusComponent() {
  const { status, error, lastSuccessfulSync, checkHealth, isLoading } = useStorageStatus();
  
  if (status === StorageStatus.UNAVAILABLE) {
    return <StorageUnavailableWarning error={error} />;
  }
  
  return <StorageHealthIndicator status={status} lastSync={lastSuccessfulSync} />;
}
```

### Manual Health Checks

```typescript
const { checkHealth } = useStorageStatus();

// Trigger manual health check
await checkHealth();
```

## Error Handling

### Error Types

- **QuotaExceededError**: Storage quota full (recoverable)
- **SecurityError**: Private browsing or security restrictions (non-recoverable)
- **NetworkError**: Connection issues (recoverable)
- **DataError**: Corrupted data (recoverable with reset)

### Recovery Behavior

1. **Immediate Retry**: Up to 3 attempts with exponential backoff
2. **Fallback Mode**: Switch to memory-only storage if persistent storage fails
3. **Health Monitoring**: Periodic checks every 30 seconds for recovery
4. **Data Sync**: Automatic sync from memory to storage when recovery detected

## Configuration

### ResilientStorageMiddleware Options

```typescript
const config: ResilientStorageConfig = {
  retryAttempts: 3,        // Number of retry attempts
  baseDelay: 1000,         // Base delay in milliseconds
  maxDelay: 8000,          // Maximum delay cap
  onStatusChange: (status, error) => {
    // Handle status changes
  }
};
```

### Health Monitoring

```typescript
// Start health monitoring with custom interval
storage.startHealthMonitoring(30000); // Check every 30 seconds

// Stop monitoring
storage.stopHealthMonitoring();
```

## Testing Storage Resilience

### Simulate Storage Failures

```typescript
// Force storage unavailable for testing
Object.defineProperty(window, 'indexedDB', {
  value: undefined,
  writable: true
});
```

### Test Recovery Scenarios

```typescript
// Test quota exceeded
await storage.setItem('large-key', 'x'.repeat(10000000));

// Test security error in private browsing
// (Manual testing required)
```

## Best Practices

### State Management

- Always use the provided `createIndexedDBStorage()` for Zustand persistence
- Don't bypass the resilient storage system for critical data
- Handle storage unavailable scenarios in your UI

### Error Handling

- Don't assume storage operations will always succeed
- Provide meaningful UI feedback for storage issues
- Allow users to continue using the app even when storage fails

### Performance

- The system automatically handles retry delays - don't add additional delays
- Memory fallback is fast but limited - don't store large amounts of data
- Health monitoring has minimal overhead but can be adjusted if needed

### User Experience

- Use the notification system to inform users about storage status
- Provide clear actions for recoverable errors (e.g., free up space)
- Don't block the UI during storage operations

## Monitoring and Debugging

### Status Monitoring

```typescript
const storage = await getResilientStorageInstance();

// Get current status
const status = storage.getStorageStatus();
const lastError = storage.getLastError();
const lastSync = storage.getLastSuccessfulSync();
```

### Debug Information

- Storage status changes are logged to console
- Failed operations include retry attempt information
- Recovery operations log sync details

### Common Issues

1. **QuotaExceededError**: Browser storage full
   - Solution: Clear browser data or implement data cleanup
   
2. **SecurityError**: Private browsing mode
   - Solution: Inform user about limitations, continue with memory-only

3. **NetworkError**: Connection issues
   - Solution: Wait for connection restoration, automatic retry

## Implementation Details

### Storage Status Lifecycle

1. **HEALTHY**: Normal operation with IndexedDB
2. **DEGRADED**: Intermittent issues but still functional
3. **UNAVAILABLE**: Storage failed, running in memory-only mode
4. **RECOVERING**: Attempting to restore storage and sync data

### Data Persistence Flow

1. **Write Operation**: Store in memory first, then attempt IndexedDB
2. **Read Operation**: Try IndexedDB first, fallback to memory
3. **Recovery**: Sync all memory data back to IndexedDB when available

### Error Recovery Strategy

1. **Immediate Retry**: Exponential backoff for transient issues
2. **Graceful Degradation**: Continue with memory storage
3. **Background Recovery**: Periodic health checks
4. **Data Synchronization**: Restore full persistence when possible

This system ensures that users can continue playing even when browser storage fails, while automatically recovering and syncing data when storage becomes available again.