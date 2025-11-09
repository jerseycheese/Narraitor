# Character Creation Auto-Save System

Auto-save keeps users from losing character creation progress when they close their browser or navigate away.

## The Problem

Character creation takes time - attributes, skills, background info across multiple steps. Browser crash or accidental back button meant losing all that work.

Auto-save quietly saves progress and offers to restore it when users return.

Here's what it does:

- Saves character data automatically every 300ms when something changes (debounced so it doesn't spam localStorage)
- Works across browser sessions - close the browser, open it tomorrow, data's still there
- Shows a recovery dialog when saved data is found, with a preview of what was saved
- Warns users if they've already started entering new data that would get overwritten
- Little save indicator shows when data is being saved
- Upgraded from sessionStorage to localStorage so it survives browser restarts

## How It's Built

There are basically two pieces that work together:

### useCharacterCreationAutoSave Hook

The hook provides the core auto-save functionality with localStorage persistence:

```typescript
const {
  data,
  setData,
  clearAutoSave,
  hasRecoveryData,
  recoveryPreview,
  hasCurrentData,
  saveStatus
} = useCharacterCreationAutoSave(worldId);
```

**State Management:**
- `data`: Current character creation state with save metadata
- `hasRecoveryData`: Boolean indicating if saved data was found
- `recoveryPreview`: Analyzed preview data for user decision
- `hasCurrentData`: Whether current form has meaningful data that would be overwritten
- `saveStatus`: Visual feedback ('idle' | 'saving' | 'saved')

**Data Flow:**
1. Hook loads existing data from localStorage on mount
2. `setData()` calls trigger debounced save operations
3. Save operations include timestamp metadata
4. Recovery state is analyzed and preview data generated

### RecoveryNotification Component

The component handles user choice when recovery data is available:

```typescript
<RecoveryNotification
  isVisible={showRecoveryDialog}
  lastSaved={recoveryPreview?.lastSaved}
  recoveryData={recoveryPreview}
  hasCurrentData={hasCurrentData}
  onRecover={() => {
    // Keep existing data, dismiss dialog
    setShowRecoveryDialog(false);
  }}
  onDismiss={() => {
    // Clear saved data, start fresh
    clearAutoSave();
    setShowRecoveryDialog(false);
  }}
/>
```

**User Experience:**
- Modal dialog with clear recovery vs. fresh start options
- Data preview showing character name, progress step, allocated points
- Warning when current form data would be overwritten
- Keyboard navigation and accessibility support
- Auto-focus on primary action button

## Implementation Details

### Data Structure

The system persists the complete character creation state:

```typescript
interface CharacterCreationState {
  currentStep: number;
  worldId: EntityID;
  characterData: unknown; // Complete character data structure
  validation: unknown;    // Step validation states
  pointPools: unknown;    // Point pool allocation state
  lastSaved?: string;     // ISO timestamp
}
```

### Storage Strategy

**localStorage vs sessionStorage:**
- Initially used sessionStorage (tab-scoped persistence)
- Migrated to localStorage for cross-session persistence
- Hook automatically handles migration from old sessionStorage data
- Data cleaned up when character creation completes

**Storage Key Pattern:**
```typescript
const saveKey = `character-creation-${worldId}`;
```

This ensures data isolation between different worlds and prevents conflicts.

### Debounced Saving

Auto-save uses 300ms debouncing to prevent excessive localStorage writes:

```typescript
import { getTimestamp } from '@/lib/utils';

// Clear existing timeout on new data changes
if (saveTimeoutRef.current) {
  clearTimeout(saveTimeoutRef.current);
}

// Debounce the save operation
saveTimeoutRef.current = setTimeout(() => {
  const dataWithTimestamp = { 
    ...data, 
    lastSaved: getTimestamp() 
  };
  localStorage.setItem(saveKey, JSON.stringify(dataWithTimestamp));
  setSaveStatus('saved');
}, 300);
```

### Recovery Data Analysis

The system analyzes saved data to generate meaningful previews:

```typescript
function analyzeRecoveryData(data: CharacterCreationState): RecoveryDataPreview {
  const preview: RecoveryDataPreview = {
    currentStep: data.currentStep,
    lastSaved: data.lastSaved,
  };

  // Extract character name
  if (characterData.name) {
    preview.name = characterData.name;
  }

  // Analyze attribute allocation
  if (characterData.attributes?.length > 0) {
    preview.hasAttributes = true;
    preview.totalAttributePoints = calculateTotalPoints(attributes);
  }

  // Count selected skills
  if (characterData.skills?.length > 0) {
    const selected = characterData.skills.filter(skill => skill.isSelected);
    preview.hasSkills = selected.length > 0;
    preview.selectedSkillCount = selected.length;
  }

  // Check background completion
  if (characterData.background) {
    preview.hasBackground = hasBackgroundContent(characterData.background);
  }

  return preview;
}
```

## Integration Pattern

### Basic Integration

In the CharacterCreationWizard component:

```typescript
export const CharacterCreationWizard: React.FC<Props> = ({ worldId }) => {
  // Auto-save integration
  const { 
    data, 
    setData, 
    clearAutoSave, 
    hasRecoveryData, 
    recoveryPreview, 
    hasCurrentData, 
    saveStatus 
  } = useCharacterCreationAutoSave(worldId);
  
  // Recovery dialog state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  // Show dialog when recovery data detected
  React.useEffect(() => {
    if (hasRecoveryData) {
      setShowRecoveryDialog(true);
    }
  }, [hasRecoveryData]);

  // Initialize character data from auto-save or defaults
  const initialCharacterData = useMemo(() => {
    if (data?.characterData) {
      return { ...data.characterData, worldId };
    }
    return createDefaultCharacterData(worldId, world);
  }, [data, worldId, world]);

  // Update auto-save when wizard data changes
  const handleWizardDataChange = useCallback((newData) => {
    setData({
      currentStep: wizard.currentStepIndex,
      worldId,
      characterData: newData,
      validation: wizard.validation,
      pointPools: poolsState
    });
  }, [setData, worldId]);

  // Clear auto-save on completion
  const handleComplete = useCallback((finalData) => {
    createCharacter(finalData);
    clearAutoSave(); // Clear saved data
    router.push('/characters');
  }, [createCharacter, clearAutoSave, router]);
};
```

### Save Status Indicator

Display visual feedback for save operations:

```typescript
<SaveIndicator status={saveStatus} />
```

The SaveIndicator component shows:
- 'idle': No indication
- 'saving': Spinner with "Saving..." text
- 'saved': Checkmark with "Saved" text (briefly)

## Testing Strategy

### Hook Testing

The hook includes comprehensive test coverage:

```typescript
describe('useCharacterCreationAutoSave', () => {
  test('automatically saves data after 300ms delay', async () => {
    const { result } = renderHook(() => useCharacterCreationAutoSave('world-1'));
    
    act(() => {
      result.current.setData(mockCharacterData);
    });

    // Should not save immediately
    expect(localStorage.getItem('character-creation-world-1')).toBeNull();
    
    // Should save after debounce delay
    await waitFor(() => {
      expect(localStorage.getItem('character-creation-world-1')).toBeTruthy();
    }, { timeout: 500 });
  });

  test('detects recovery data on mount', () => {
    localStorage.setItem('character-creation-world-1', JSON.stringify(mockSavedData));
    
    const { result } = renderHook(() => useCharacterCreationAutoSave('world-1'));
    
    expect(result.current.hasRecoveryData).toBe(true);
    expect(result.current.recoveryPreview).toBeDefined();
  });
});
```

### Component Testing

Recovery notification testing focuses on user interactions:

```typescript
describe('RecoveryNotification', () => {
  test('calls onRecover when recover button clicked', () => {
    const mockOnRecover = jest.fn();
    render(<RecoveryNotification {...props} onRecover={mockOnRecover} />);
    
    fireEvent.click(screen.getByRole('button', { name: /recover progress/i }));
    expect(mockOnRecover).toHaveBeenCalledTimes(1);
  });
});
```

## Error Handling

The system includes robust error handling:

### Storage Errors
```typescript
try {
  localStorage.setItem(saveKey, JSON.stringify(dataWithTimestamp));
  setSaveStatus('saved');
} catch (error) {
  console.error('[AutoSave] Failed to save character creation data', error);
  setSaveStatus('idle');
  // Could show user notification about save failure
}
```

### Data Corruption
```typescript
try {
  const parsed = JSON.parse(saved);
  setDataInternal(parsed);
} catch (e) {
  console.error('[AutoSave] Failed to restore character creation data', e);
  // Keep recovery data true since data exists, even if corrupted
  setHasRecoveryData(true);
  setRecoveryPreview(undefined); // Can't preview corrupted data
}
```

## Performance Considerations

**Debouncing Benefits:**
- Prevents excessive localStorage writes during rapid form interactions
- Reduces browser storage quota usage
- Maintains responsive UI during typing/interaction

**Memory Management:**
- Timeouts properly cleaned up on component unmount
- localStorage data cleared on successful character creation
- Data isolation prevents cross-world contamination

**Bundle Size:**
- Hook and component are tree-shakeable
- No external dependencies beyond core React hooks
- Minimal runtime overhead

## Migration Notes

When upgrading from sessionStorage to localStorage persistence:

1. **Backward Compatibility**: Hook automatically detects and migrates sessionStorage data
2. **Data Cleanup**: Old sessionStorage entries are removed after migration
3. **API Compatibility**: No changes to component integration required
4. **User Experience**: Users see recovery dialog after browser restarts (new behavior)

## Best Practices

### For Developers

1. **Always Clear on Success**: Call `clearAutoSave()` when character creation completes successfully
2. **Handle Recovery State**: Show recovery dialog when `hasRecoveryData` is true
3. **Provide Save Feedback**: Use `saveStatus` for visual feedback
4. **Test Edge Cases**: Verify behavior with corrupted data, missing world data, etc.

### For Users

1. **Recovery Dialog**: Always appears when saved data exists - choose "Recover" to continue or "Start Fresh" to begin again
2. **Save Indication**: Look for save status indicator to confirm data is being preserved
3. **Data Persistence**: Progress survives browser restarts, tab closures, and navigation

## Troubleshooting

### Common Issues

**Recovery dialog not appearing:**
- Check if `hasRecoveryData` is true
- Verify localStorage key format: `character-creation-${worldId}`
- Ensure component properly shows dialog when `hasRecoveryData` changes

**Save status stuck on "saving":**
- Check browser console for localStorage quota errors
- Verify data isn't too large for localStorage
- Check for JSON serialization errors in character data

**Data not persisting:**
- Confirm `setData()` is being called with complete state
- Check if `clearAutoSave()` is being called prematurely
- Verify localStorage is available (not in private browsing)

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
// In development, log save operations
console.log('[AutoSave] Saving data:', { worldId, dataSize: JSON.stringify(data).length });
```

The system logs errors for common failure scenarios and provides context for debugging.
