# Auto-Save Implementation Example

This example demonstrates how to implement the character creation auto-save functionality in a wizard component.

## Complete Implementation

```typescript
import React, { useState, useEffect } from 'react';
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';
import { SaveIndicator } from '@/components/ui/SaveIndicator';

interface CharacterCreationWizardProps {
  worldId: string;
}

export function CharacterCreationWizard({ worldId }: CharacterCreationWizardProps) {
  // Auto-save integration
  const {
    data,              // Current saved state
    setData,           // Update function (triggers auto-save)
    clearAutoSave,     // Cleanup function
    hasRecoveryData,   // Recovery detection
    saveStatus         // Save operation status
  } = useCharacterCreationAutoSave(worldId);

  // Recovery dialog state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  
  // Character form state
  const [characterData, setCharacterData] = useState({
    name: '',
    attributes: [],
    skills: [],
    background: ''
  });

  // Show recovery dialog when recovery data is detected
  useEffect(() => {
    if (hasRecoveryData && !showRecoveryDialog) {
      setShowRecoveryDialog(true);
    }
  }, [hasRecoveryData, showRecoveryDialog]);

  // Initialize or restore character data
  useEffect(() => {
    if (data?.characterData) {
      // Restore from auto-save
      setCharacterData(data.characterData);
    }
  }, [data]);

  // Auto-save when character data changes
  useEffect(() => {
    if (characterData.name) { // Only save if there's actual data
      const saveData = {
        currentStep: 0,
        worldId,
        characterData,
        validation: {},
        pointPools: {}
      };
      setData(saveData);
    }
  }, [characterData, worldId, setData]);

  // Recovery dialog handlers
  const handleRecoveryChoice = (choice: 'recover' | 'dismiss') => {
    if (choice === 'dismiss') {
      clearAutoSave();
      // Reset to empty state
      setCharacterData({
        name: '',
        attributes: [],
        skills: [],
        background: ''
      });
    }
    // If 'recover', data is already loaded from auto-save
    setShowRecoveryDialog(false);
  };

  // Character creation completion
  const handleCreateCharacter = () => {
    // Create character logic here...
    
    // Clear auto-save data when done
    clearAutoSave();
    
    // Navigate away
    router.push('/characters');
  };

  return (
    <>
      <div className="character-creation-wizard">
        {/* Save status indicator */}
        <div className="save-status">
          <SaveIndicator
            status={saveStatus}
            lastSaveTime={data?.lastSaved}
            compact={true}
          />
        </div>

        {/* Character creation form */}
        <form>
          <div>
            <label htmlFor="character-name">Character Name:</label>
            <input
              id="character-name"
              value={characterData.name}
              onChange={(e) => setCharacterData(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
            />
          </div>

          <div>
            <label htmlFor="character-background">Background:</label>
            <textarea
              id="character-background"
              value={characterData.background}
              onChange={(e) => setCharacterData(prev => ({ 
                ...prev, 
                background: e.target.value 
              }))}
            />
          </div>

          <button type="button" onClick={handleCreateCharacter}>
            Create Character
          </button>
        </form>
      </div>

      {/* Recovery dialog */}
      <RecoveryNotification
        isVisible={showRecoveryDialog}
        lastSaved={data?.lastSaved}
        onRecover={() => handleRecoveryChoice('recover')}
        onDismiss={() => handleRecoveryChoice('dismiss')}
      />
    </>
  );
}
```

## Key Implementation Points

### 1. Auto-Save Hook Integration

```typescript
// Basic hook usage
const { data, setData, clearAutoSave, hasRecoveryData, saveStatus } = 
  useCharacterCreationAutoSave(worldId);

// The hook automatically:
// - Saves data to localStorage with 300ms debounce
// - Detects existing recovery data on mount
// - Provides save status for UI feedback
// - Manages cleanup when data is no longer needed
```

### 2. Recovery Data Detection

```typescript
// Show recovery dialog when data is detected
useEffect(() => {
  if (hasRecoveryData && !showRecoveryDialog) {
    setShowRecoveryDialog(true);
  }
}, [hasRecoveryData, showRecoveryDialog]);

// Only show once per session to avoid repeated prompts
```

### 3. Data Restoration

```typescript
// Restore character data from auto-save
useEffect(() => {
  if (data?.characterData) {
    setCharacterData(data.characterData);
  }
}, [data]);

// This runs when:
// - Component mounts with existing data
// - User chooses to recover data
```

### 4. Auto-Save Triggering

```typescript
// Auto-save when character data changes
useEffect(() => {
  if (characterData.name) { // Only save meaningful data
    const saveData = {
      currentStep: 0,
      worldId,
      characterData,
      validation: {},
      pointPools: {}
    };
    setData(saveData); // Triggers auto-save after 300ms
  }
}, [characterData, worldId, setData]);
```

### 5. Recovery Dialog Handling

```typescript
const handleRecoveryChoice = (choice: 'recover' | 'dismiss') => {
  if (choice === 'dismiss') {
    clearAutoSave(); // Remove saved data
    // Reset form to empty state
    setCharacterData(initialState);
  }
  // If 'recover', data is already restored
  setShowRecoveryDialog(false);
};
```

### 6. Completion Cleanup

```typescript
const handleCreateCharacter = () => {
  // Character creation logic...
  
  // IMPORTANT: Clear auto-save when done
  clearAutoSave();
  
  // Navigate away
  router.push('/characters');
};
```

## Save Status Display

```typescript
// Minimal save indicator
<SaveIndicator
  status={saveStatus}           // 'idle' | 'saving' | 'saved'
  lastSaveTime={data?.lastSaved}  // ISO timestamp
  compact={true}                // Compact display mode
/>

// Status meanings:
// - 'idle': Ready to save (gray circle)
// - 'saving': Currently saving (spinner)
// - 'saved': Successfully saved (green checkmark + timestamp)
```

## Common Patterns

### Conditional Auto-Save

```typescript
// Only save when there's meaningful data
useEffect(() => {
  const hasData = characterData.name || 
                  characterData.background || 
                  characterData.attributes.length > 0;
  
  if (hasData) {
    setData({ worldId, characterData, /* ... */ });
  }
}, [characterData]);
```

### Form Validation Integration

```typescript
// Include validation state in auto-save
const [validation, setValidation] = useState({});

useEffect(() => {
  setData({
    worldId,
    characterData,
    validation,      // Include validation results
    pointPools: attributePoints
  });
}, [characterData, validation, attributePoints]);
```

### Manual Save Trigger

```typescript
// For forms with explicit save buttons
const handleManualSave = () => {
  setData({
    worldId,
    characterData,
    // Force immediate save by updating timestamp
    lastSaved: new Date().toISOString()
  });
};
```

## Testing Your Implementation

```typescript
// Test recovery dialog appears
const { hasRecoveryData } = useCharacterCreationAutoSave('world-1');
expect(hasRecoveryData).toBe(true);

// Test save status updates
const { saveStatus } = useCharacterCreationAutoSave('world-1');
expect(saveStatus).toBe('saved');

// Test data persistence
localStorage.setItem('character-creation-world-1', JSON.stringify(mockData));
const { data } = useCharacterCreationAutoSave('world-1');
expect(data.characterData.name).toBe('Test Character');
```

## Troubleshooting

**Q: Auto-save not working?**
A: Check that you're calling `setData()` with valid data and that localStorage is available.

**Q: Recovery dialog appears repeatedly?**
A: Ensure you're using the `showRecoveryDialog` state guard in the useEffect.

**Q: Data not persisting between sessions?**
A: Verify you're using localStorage (not sessionStorage) and the save key is consistent.

**Q: Save indicator stuck on "saving"?**
A: Check for errors in browser console - storage might be failing silently.