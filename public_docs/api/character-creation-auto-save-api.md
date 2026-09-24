# Character Creation Auto-Save API Reference

If you're working with the auto-save system, this covers the main hook and component APIs. The implementation is pretty straightforward - here's how to use it.

## Hook: `useDraftAutoSave`

Character creation shares its auto-save mechanics with world creation through one generic
hook, `useDraftAutoSave` (`src/hooks/useDraftAutoSave.ts`). Character creation configures it
with the functions in `src/components/CharacterCreationWizard/utils/characterDraft.ts`:

```typescript
function useDraftAutoSave<TDraft, TPreview>(options: UseDraftAutoSaveOptions<TDraft, TPreview>): UseDraftAutoSaveResult<TDraft, TPreview>
```

```typescript
const { data, setData, clearAutoSave, hasRecoveryData, recoveryPreview, hasCurrentData, saveStatus } =
  useDraftAutoSave<CharacterCreationDraft, CharacterDraftRecoveryPreview>({
    storageKey: getCharacterDraftStorageKey(worldId),
    analyzeRecovery: analyzeCharacterDraftRecovery,
    hasCurrentData: hasCharacterDraftData,
    isValidDraft: isValidCharacterDraft,
  });
```

`getCharacterDraftStorageKey(worldId)` namespaces the localStorage key so characters for
different worlds don't interfere with each other. `isValidCharacterDraft` is what makes a
corrupt saved draft safe to discard instead of crashing the load — see Data Corruption below.

What you get back:

```typescript
interface UseDraftAutoSaveResult<TDraft, TPreview> {
  data: TDraft | undefined;
  setData: (newData: TDraft | undefined) => void;
  clearAutoSave: () => void;
  dismissRecovery: () => void;
  hasRecoveryData: boolean;
  recoveryPreview: TPreview | undefined;
  hasCurrentData: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  isLoaded: boolean;
}
```

#### Return Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TDraft \| undefined` | Current character creation data with save metadata |
| `setData` | `(newData: TDraft \| undefined) => void` | Function to update character data (triggers auto-save) |
| `clearAutoSave` | `() => void` | Function to clear all auto-save data and reset state |
| `dismissRecovery` | `() => void` | Function to hide the recovery prompt without clearing the saved draft |
| `hasRecoveryData` | `boolean` | Whether recovery data was detected on mount |
| `recoveryPreview` | `TPreview \| undefined` | Analyzed preview data for recovery dialog |
| `hasCurrentData` | `boolean` | Whether current form has meaningful data that would be overwritten |
| `saveStatus` | `'idle' \| 'saving' \| 'saved'` | Current save operation status for UI feedback |
| `isLoaded` | `boolean` | Whether the initial restore-from-localStorage pass has finished |

### Type Definitions

#### `CharacterCreationDraft`

```typescript
interface CharacterCreationDraft {
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

#### `CharacterDraftRecoveryPreview`

```typescript
interface CharacterDraftRecoveryPreview {
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
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import {
  getCharacterDraftStorageKey,
  isValidCharacterDraft,
  analyzeCharacterDraftRecovery,
  hasCharacterDraftData,
} from './utils/characterDraft';

function CharacterCreationWizard({ worldId }) {
  const { 
    data, 
    setData, 
    clearAutoSave, 
    hasRecoveryData, 
    saveStatus 
  } = useDraftAutoSave({
    storageKey: getCharacterDraftStorageKey(worldId),
    analyzeRecovery: analyzeCharacterDraftRecovery,
    hasCurrentData: hasCharacterDraftData,
    isValidDraft: isValidCharacterDraft,
  });

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
  } = useDraftAutoSave({
    storageKey: getCharacterDraftStorageKey(worldId),
    analyzeRecovery: analyzeCharacterDraftRecovery,
    hasCurrentData: hasCharacterDraftData,
    isValidDraft: isValidCharacterDraft,
  });
  
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

A saved draft that fails to parse, or that parses but fails `isValidCharacterDraft`'s shape
check, is discarded outright rather than offered for recovery or surfaced as an error:

```typescript
try {
  const parsed: unknown = JSON.parse(saved);
  if (!isValidDraft(parsed)) {
    throw new Error('Saved draft does not match the expected shape');
  }
  // Use parsed data
} catch (error) {
  logger.error('Discarding corrupt draft', storageKey, error);
  localStorage.removeItem(storageKey);
  setHasRecoveryData(false);
  setRecoveryPreview(undefined);
  setDataInternal(undefined);
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

localStorage only. `useDraftAutoSave`, configured with `getCharacterDraftStorageKey`, reads
and writes a single per-world key and never touches sessionStorage.

## Testing Considerations

### Mock Implementation

For testing, mock the hook return values:

```typescript
jest.mock('@/hooks/useDraftAutoSave', () => ({
  useDraftAutoSave: jest.fn(() => ({
    data: mockCharacterData,
    setData: jest.fn(),
    clearAutoSave: jest.fn(),
    dismissRecovery: jest.fn(),
    hasRecoveryData: false,
    recoveryPreview: undefined,
    hasCurrentData: false,
    saveStatus: 'idle',
    isLoaded: true
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