# Auto-Save Migration Notes

## Overview

The character creation auto-save system has been upgraded from sessionStorage to localStorage to enable cross-browser-session recovery. This migration ensures user progress is preserved even after browser restarts.

## What Changed

### Before: sessionStorage (Temporary)
```typescript
// Old implementation (session-only)
const saveKey = `character-creation-${worldId}`;
sessionStorage.setItem(saveKey, JSON.stringify(characterData));

// Data was lost when:
// - Browser tab closed
// - Browser restarted  
// - New tab opened for same world
```

### After: localStorage (Persistent)
```typescript
// New implementation (persistent)
const saveKey = `character-creation-${worldId}`;
localStorage.setItem(saveKey, JSON.stringify(characterData));

// Data persists through:
// - Browser tab closure
// - Browser restart
// - Multiple tabs/windows
// - Computer restart
```

## Breaking Changes

### 1. Storage Location
- **Before**: `sessionStorage['character-creation-{worldId}']`
- **After**: `localStorage['character-creation-{worldId}']`

### 2. Recovery Behavior
- **Before**: Recovery only within same browser session
- **After**: Recovery across browser sessions and restarts

### 3. Data Lifetime
- **Before**: Cleared when browser tab closed
- **After**: Persists until explicitly cleared or character created

## Migration Strategy

### Automatic Migration
The system handles migration automatically:

```typescript
// 1. Check for existing localStorage data (new format)
const newData = localStorage.getItem(saveKey);
if (newData) {
  return JSON.parse(newData);
}

// 2. Check for legacy sessionStorage data (old format) 
const legacyData = sessionStorage.getItem(saveKey);
if (legacyData) {
  const parsed = JSON.parse(legacyData);
  
  // Migrate to localStorage
  localStorage.setItem(saveKey, legacyData);
  
  // Clean up old data
  sessionStorage.removeItem(saveKey);
  
  return parsed;
}

// 3. No existing data found
return null;
```

### Manual Migration (If Needed)
For manual data recovery:

```javascript
// Run in browser console to migrate existing session data
Object.keys(sessionStorage).forEach(key => {
  if (key.startsWith('character-creation-')) {
    const data = sessionStorage.getItem(key);
    localStorage.setItem(key, data);
    sessionStorage.removeItem(key);
    console.log(`Migrated: ${key}`);
  }
});
```

## Developer Impact

### No Code Changes Required
Existing components using `useCharacterCreationAutoSave` work unchanged:

```typescript
// This code works exactly the same
const { data, setData, clearAutoSave, hasRecoveryData } = 
  useCharacterCreationAutoSave(worldId);
```

### New Features Available
The migration enables new capabilities:

```typescript
// Recovery data now persists between browser sessions
useEffect(() => {
  if (hasRecoveryData) {
    // This can now trigger after browser restart
    setShowRecoveryDialog(true);
  }
}, [hasRecoveryData]);
```

## Testing Migration

### Test Cases

```typescript
describe('localStorage migration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('loads from localStorage when available', () => {
    localStorage.setItem('character-creation-world-1', JSON.stringify(mockData));
    
    const { data } = renderHook(() => useCharacterCreationAutoSave('world-1'));
    
    expect(data.characterData.name).toBe('Test Character');
  });

  it('migrates from sessionStorage to localStorage', () => {
    sessionStorage.setItem('character-creation-world-1', JSON.stringify(mockData));
    
    const { data } = renderHook(() => useCharacterCreationAutoSave('world-1'));
    
    // Data should be migrated and available
    expect(data.characterData.name).toBe('Test Character');
    
    // Should be moved to localStorage
    expect(localStorage.getItem('character-creation-world-1')).toBeTruthy();
    expect(sessionStorage.getItem('character-creation-world-1')).toBeNull();
  });

  it('handles corrupted legacy data gracefully', () => {
    sessionStorage.setItem('character-creation-world-1', 'invalid-json');
    
    const { data, hasRecoveryData } = renderHook(() => 
      useCharacterCreationAutoSave('world-1')
    );
    
    expect(data).toBeUndefined();
    expect(hasRecoveryData).toBe(false);
  });
});
```

### Manual Testing
1. Create character data in old version (sessionStorage)
2. Upgrade to new version
3. Verify data is automatically migrated to localStorage
4. Restart browser and confirm data persists

## Storage Quota Considerations

### Increased Storage Usage
- **sessionStorage**: Temporary, cleared frequently
- **localStorage**: Persistent, accumulates over time

### Mitigation Strategies
```typescript
// 1. Automatic cleanup on character creation completion
const handleCreateCharacter = () => {
  // Create character...
  clearAutoSave(); // Removes localStorage entry
};

// 2. Cleanup old world data when world is deleted
const deleteWorld = (worldId) => {
  // Delete world...
  localStorage.removeItem(`character-creation-${worldId}`);
};

// 3. Periodic cleanup of orphaned data
const cleanupOrphanedAutoSave = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('character-creation-')) {
      const worldId = key.replace('character-creation-', '');
      if (!worldExists(worldId)) {
        localStorage.removeItem(key);
      }
    }
  });
};
```

## Data Structure Compatibility

### V1 (sessionStorage) Format
```typescript
interface LegacyCharacterCreationState {
  currentStep: number;
  worldId: string;
  characterData: any;
  // Missing: lastSaved timestamp
}
```

### V2 (localStorage) Format
```typescript
interface CharacterCreationState {
  currentStep: number;
  worldId: EntityID;
  characterData: unknown;
  validation: unknown;
  pointPools: unknown;
  lastSaved: string; // New: ISO timestamp
}
```

### Backward Compatibility
```typescript
// Handle both formats during migration
const migrateData = (rawData: any): CharacterCreationState => {
  return {
    ...rawData,
    lastSaved: rawData.lastSaved || new Date().toISOString()
  };
};
```

## Security Considerations

### Data Persistence
- **Before**: Temporary data, lower persistence risk
- **After**: Persistent data, requires proper cleanup

### Privacy Impact
- Auto-save data persists longer
- Character names and details remain in browser
- Important to clear data on character creation completion

### Best Practices
```typescript
// 1. Always clear sensitive data when done
clearAutoSave();

// 2. Don't store sensitive user information
const sanitizedData = {
  ...characterData,
  // Don't save: passwords, personal info, etc.
};

// 3. Provide user control over data
const handleClearAllData = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('character-creation-')) {
      localStorage.removeItem(key);
    }
  });
};
```

## Rollback Plan

If issues arise, temporary rollback to sessionStorage:

```typescript
// Emergency rollback configuration
const USE_SESSION_STORAGE = process.env.NODE_ENV === 'development';

const storage = USE_SESSION_STORAGE ? sessionStorage : localStorage;
const data = storage.getItem(saveKey);
```

## Monitoring

Track migration success:

```typescript
// Analytics tracking
const trackMigration = (success: boolean, method: 'localStorage' | 'sessionStorage') => {
  analytics.track('auto_save_migration', {
    success,
    storage_method: method,
    world_id: worldId
  });
};
```

## Summary

The localStorage migration provides:
- ✅ Cross-session data recovery
- ✅ Improved user experience
- ✅ Automatic migration from old format
- ✅ Backward compatibility
- ✅ No breaking changes to developer API

Key considerations:
- Monitor storage quota usage
- Ensure proper cleanup on completion
- Test migration scenarios thoroughly
- Provide user control over persistent data