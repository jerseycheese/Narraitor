# Character Creation Auto-Save API Reference

If you're working with the auto-save system, this covers the main hook and component APIs. The implementation is pretty straightforward - here's how to use it.

## Hook: `useCharacterCreationAutoSave`

```typescript
function useCharacterCreationAutoSave(worldId: EntityID): UseCharacterCreationAutoSaveReturn
```

Just pass it the `worldId` for the world where the character is being created. The hook uses this to namespace the localStorage key so characters for different worlds don't interfere with each other.

What you get back:

```typescript
interface UseCharacterCreationAutoSaveReturn {
  data: CharacterCreationState | undefined;
  setData: (newData: CharacterCreationState | undefined) => void;
  clearAutoSave: () => void;
  hasRecoveryData: boolean;
  recoveryPreview: RecoveryDataPreview | undefined;
  hasCurrentData: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
}
```

#### Return Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `CharacterCreationState \| undefined` | Current character creation data with save metadata |
| `setData` | `(newData: CharacterCreationState \| undefined) => void` | Function to update character data (triggers auto-save) |
| `clearAutoSave` | `() => void` | Function to clear all auto-save data and reset state |
| `hasRecoveryData` | `boolean` | Whether recovery data was detected on mount |
| `recoveryPreview` | `RecoveryDataPreview \| undefined` | Analyzed preview data for recovery dialog |
| `hasCurrentData` | `boolean` | Whether current form has meaningful data that would be overwritten |
| `saveStatus` | `'idle' \| 'saving' \| 'saved'` | Current save operation status for UI feedback |

### Type Definitions

#### `CharacterCreationState`

```typescript
interface CharacterCreationState {
  /** Current wizard step index */
  currentStep: number;
  /** World ID for the character being created */
  worldId: EntityID;
  /** Character data being created */
  characterData: unknown;
  /** Validation state for each step */
  validation: unknown;
  /** Point pool allocation state */
  pointPools: unknown;
  /** ISO timestamp of last save operation */
  lastSaved?: string;
}
```

#### `RecoveryDataPreview`

```typescript
interface RecoveryDataPreview {
  name?: string;
  currentStep?: number;
  lastSaved?: string;
  hasAttributes?: boolean;
  hasSkills?: boolean;
  hasBackground?: boolean;
  selectedSkillCount?: number;
  totalAttributePoints?: number;
}
```

### Usage Examples

#### Basic Usage

```typescript
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';

function CharacterCreationWizard({ worldId }) {
  const { 
    data, 
    setData, 
    clearAutoSave, 
    hasRecoveryData, 
    saveStatus 
  } = useCharacterCreationAutoSave(worldId);

  // Update character data (automatically saves after 300ms)
  const handleDataChange = (newCharacterData) => {
    setData({
      currentStep: wizard.currentStepIndex,
      worldId,
      characterData: newCharacterData,
      validation: wizard.validation,
      pointPools: poolsState
    });
  };

  // Clear save data when character creation completes
  const handleComplete = (finalData) => {
    createCharacter(finalData);
    clearAutoSave();
    router.push('/characters');
  };
}
```

#### With Recovery Dialog

```typescript
function CharacterCreationWizard({ worldId }) {
  const { 
    hasRecoveryData, 
    recoveryPreview, 
    hasCurrentData,
    clearAutoSave 
  } = useCharacterCreationAutoSave(worldId);
  
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  useEffect(() => {
    if (hasRecoveryData) {
      setShowRecoveryDialog(true);
    }
  }, [hasRecoveryData]);

  return (
    <>
      <CharacterCreationForm />
      <RecoveryNotification
        isVisible={showRecoveryDialog}
        lastSaved={recoveryPreview?.lastSaved}
        recoveryData={recoveryPreview}
        hasCurrentData={hasCurrentData}
        onRecover={() => setShowRecoveryDialog(false)}
        onDismiss={() => {
          clearAutoSave();
          setShowRecoveryDialog(false);
        }}
      />
    </>
  );
}
```

## Component: `RecoveryNotification`

```typescript
function RecoveryNotification(props: RecoveryNotificationProps): JSX.Element | null
```

### Props

```typescript
interface RecoveryNotificationProps {
  isVisible: boolean;
  lastSaved?: string;
  recoveryData?: RecoveryData;
  hasCurrentData?: boolean;
  onRecover: () => void;
  onDismiss: () => void;
}
```

#### Props Details

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isVisible` | `boolean` | Yes | Controls modal dialog visibility |
| `lastSaved` | `string` | No | ISO timestamp of when data was last saved |
| `recoveryData` | `RecoveryData` | No | Analyzed recovery data for preview display |
| `hasCurrentData` | `boolean` | No | Whether current form has data that would be overwritten |
| `onRecover` | `() => void` | Yes | Callback when user chooses to recover data |
| `onDismiss` | `() => void` | Yes | Callback when user chooses to start fresh |

### Type Definitions

#### `RecoveryData`

```typescript
interface RecoveryData {
  /** Character name from saved data */
  name?: string;
  /** Current wizard step index (0-based) */
  currentStep?: number;
  /** ISO timestamp of when data was last saved */
  lastSaved?: string;
  /** Whether character has allocated attribute points */
  hasAttributes?: boolean;
  /** Whether character has selected skills */
  hasSkills?: boolean;
  /** Whether character has completed background information */
  hasBackground?: boolean;
  /** Number of skills selected by the character */
  selectedSkillCount?: number;
  /** Total attribute points allocated across all attributes */
  totalAttributePoints?: number;
}
```

### Usage Examples

#### Basic Recovery Dialog

```typescript
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(true);
  
  const recoveryData = {
    name: 'John Smith',
    currentStep: 2,
    hasAttributes: true,
    totalAttributePoints: 25,
    hasSkills: true,
    selectedSkillCount: 3
  };

  return (
    <RecoveryNotification
      isVisible={showDialog}
      lastSaved="2024-01-15T14:30:00.000Z"
      recoveryData={recoveryData}
      hasCurrentData={false}
      onRecover={() => {
        console.log('Recovering data');
        setShowDialog(false);
      }}
      onDismiss={() => {
        console.log('Starting fresh');
        setShowDialog(false);
      }}
    />
  );
}
```

## Storage Implementation

### Storage Keys

The system uses localStorage with keys in the format:
```
character-creation-${worldId}
```

### Data Persistence

- **Storage Type**: localStorage (cross-session persistence)
- **Debounce Delay**: 300ms to prevent excessive writes
- **Cleanup**: Data automatically cleared on successful character creation
- **Migration**: Automatically migrates from legacy sessionStorage

### Data Structure

Saved data includes timestamp metadata:

```typescript
const savedData = {
  currentStep: number,
  worldId: EntityID,
  characterData: unknown,
  validation: unknown,
  pointPools: unknown,
  lastSaved: string // ISO timestamp added automatically
};
```

## Error Handling

### Storage Errors

localStorage errors are caught and fail silently, without notifying the player:

```typescript
try {
  localStorage.setItem(saveKey, JSON.stringify(data));
  setSaveStatus('saved');
} catch (error) {
  console.error('[AutoSave] Failed to save', error);
  setSaveStatus('idle');
  // No user notification - fails silently
}
```

### Data Corruption

Corrupted save data keeps the recovery flag set but clears the preview, instead of crashing the load:

```typescript
try {
  const parsed = JSON.parse(saved);
  // Use parsed data
} catch (e) {
  console.error('[AutoSave] Failed to restore', e);
  // Keep recovery flag true but clear preview data
  setHasRecoveryData(true);
  setRecoveryPreview(undefined);
}
```

## Performance Characteristics

- **Save Debouncing**: 300ms delay prevents excessive localStorage writes
- **Bundle Size**: Minimal - no external dependencies
- **Memory Usage**: Proper cleanup of timeouts and refs
- **Rendering**: RecoveryNotification only renders when visible

## Browser Compatibility

- **localStorage**: IE8+, all modern browsers
- **JSON.parse/stringify**: IE8+, all modern browsers  
- **React Hooks**: React 16.8+

## Storage

localStorage only. `useCharacterCreationAutoSave` reads and writes a single per-world key and
never touches sessionStorage.

## Testing Considerations

### Mock Implementation

For testing, mock the hook return values:

```typescript
jest.mock('@/hooks/useCharacterCreationAutoSave', () => ({
  useCharacterCreationAutoSave: jest.fn(() => ({
    data: mockCharacterData,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    hasRecoveryData: false,
    recoveryPreview: undefined,
    hasCurrentData: false,
    saveStatus: 'idle'
  }))
}));
```

### localStorage Testing

For integration tests, mock localStorage:

```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```