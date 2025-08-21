# Auto-Save Types Reference

## Core Interfaces

### CharacterCreationState
Character creation auto-save data structure.

```typescript
interface CharacterCreationState {
  /** Current wizard step index (0-based) */
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

**Usage:**
```typescript
const saveData: CharacterCreationState = {
  currentStep: 2,
  worldId: 'world-123',
  characterData: {
    name: 'Gandalf',
    attributes: [{ id: 'wisdom', value: 18 }]
  },
  validation: { 0: { valid: true, errors: [] } },
  pointPools: { attributePoints: 15, skillPoints: 8 },
  lastSaved: '2024-01-15T14:30:00.000Z'
};
```

## Hook Return Types

### useCharacterCreationAutoSave Return Type

```typescript
interface UseCharacterCreationAutoSaveReturn {
  /** Current character creation data with save metadata */
  data: CharacterCreationState | undefined;
  
  /** Function to update character data (triggers auto-save) */
  setData: (newData: CharacterCreationState | undefined) => void;
  
  /** @deprecated Legacy field blur handler - auto-save is now automatic */
  handleFieldBlur: () => void;
  
  /** Function to clear all auto-save data */
  clearAutoSave: () => void;
  
  /** Whether recovery data was detected on mount */
  hasRecoveryData: boolean;
  
  /** Current save status: 'idle' | 'saving' | 'saved' */
  saveStatus: SaveStatus;
}
```

**Example:**
```typescript
const {
  data,              // CharacterCreationState | undefined
  setData,           // (data: CharacterCreationState | undefined) => void
  clearAutoSave,     // () => void
  hasRecoveryData,   // boolean
  saveStatus         // 'idle' | 'saving' | 'saved'
} = useCharacterCreationAutoSave('world-123');
```

## Component Props

### RecoveryNotificationProps
Props for the recovery dialog component.

```typescript
interface RecoveryNotificationProps {
  /** Whether the recovery dialog should be visible */
  isVisible: boolean;
  
  /** ISO timestamp of when the data was last saved */
  lastSaved?: string;
  
  /** Callback when user chooses to recover the data */
  onRecover: () => void;
  
  /** Callback when user chooses to dismiss the recovery data */
  onDismiss: () => void;
}
```

**Example:**
```typescript
<RecoveryNotification
  isVisible={showDialog}
  lastSaved="2024-01-15T14:30:00.000Z"
  onRecover={() => {
    // Keep existing data
    setShowDialog(false);
  }}
  onDismiss={() => {
    // Clear data and start fresh
    clearAutoSave();
    setShowDialog(false);
  }}
/>
```

### SaveIndicatorProps
Props for the save status indicator component.

```typescript
interface SaveIndicatorProps {
  /** Current save operation status */
  status: SaveStatus;
  
  /** ISO timestamp of last successful save */
  lastSaveTime?: string | null;
  
  /** Error message to display when status is 'error' */
  errorMessage?: string | null;
  
  /** Total number of saves performed (for statistics) */
  totalSaves?: number;
  
  /** Callback for manual save trigger */
  onManualSave?: (reason: SaveTriggerReason) => void;
  
  /** Callback for retrying failed save operations */
  onRetryError?: () => void;
  
  /** Whether the error state allows retry attempts */
  retryable?: boolean;
  
  /** Additional CSS classes to apply */
  className?: string;
  
  /** Whether to show compact version without detailed info */
  compact?: boolean;
}
```

**Example:**
```typescript
<SaveIndicator
  status="saved"
  lastSaveTime="2024-01-15T14:30:00.000Z"
  totalSaves={3}
  compact={true}
  className="mr-4"
/>
```

## Utility Types

### SaveStatus
Current status of save operations.

```typescript
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
```

**Status Meanings:**
- `'idle'`: Ready to save, no current operation
- `'saving'`: Save operation in progress  
- `'saved'`: Last save operation completed successfully
- `'error'`: Save operation failed

### SaveTriggerReason
Reason for triggering a save operation.

```typescript
type SaveTriggerReason = 
  | 'manual'        // User clicked save button
  | 'auto'          // Automatic save after data change
  | 'navigation'    // Save before navigation
  | 'interval'      // Periodic auto-save
  | 'blur'          // Field lost focus
  | 'completion';   // Wizard step completed
```

**Usage:**
```typescript
const handleManualSave = () => {
  onManualSave?.('manual');
};

const handleStepComplete = () => {
  triggerSave('completion');
};
```

### EntityID
Unique identifier type used throughout the system.

```typescript
type EntityID = string;
```

**Examples:**
```typescript
const worldId: EntityID = 'world-abc123';
const characterId: EntityID = 'char-def456';
const attributeId: EntityID = 'attr-ghi789';
```

## Character Creation Data Types

### CharacterCreationData
Complete character data structure for creation wizard.

```typescript
interface CharacterCreationData {
  /** World ID for the character being created */
  worldId: EntityID;
  
  /** Character's display name */
  name: string;
  
  /** Character description (legacy field) */
  description: string;
  
  /** Placeholder text for portrait selection */
  portraitPlaceholder: string;
  
  /** Character portrait configuration */
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
  
  /** Character attributes with allocated point values */
  attributes: Array<{
    attributeId: EntityID;
    name: string;
    description?: string;
    value: number;
    minValue: number;
    maxValue: number;
  }>;
  
  /** Character skills with selection and level data */
  skills: Array<{
    skillId: EntityID;
    name: string;
    description?: string;
    level: number;
    attributeIds?: EntityID[];     // Multi-attribute support
    linkedAttributeId?: EntityID;  // Legacy support
    isSelected: boolean;
  }>;
  
  /** Character background and roleplay information */
  background: {
    history: string;
    personality: string;
    physicalDescription?: string;
    goals: string[];
    motivation: string;
    isKnownFigure?: boolean;
    knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
  };
}
```

## Validation Types

### ValidationState
Step-by-step validation results.

```typescript
interface ValidationState {
  [stepIndex: number]: {
    valid: boolean;
    errors: string[];
    touched: boolean;
  };
}
```

**Example:**
```typescript
const validation: ValidationState = {
  0: { valid: true, errors: [], touched: true },
  1: { valid: false, errors: ['Must allocate all attribute points'], touched: true },
  2: { valid: true, errors: [], touched: false }
};
```

### PointPoolState
Point allocation state for attributes and skills.

```typescript
interface PointPoolState {
  attributes?: {
    total: number;
    spent: number;
    remaining: number;
  };
  skills?: {
    total: number;
    spent: number;
    remaining: number;
  };
}
```

**Example:**
```typescript
const pointPools: PointPoolState = {
  attributes: { total: 27, spent: 25, remaining: 2 },
  skills: { total: 15, spent: 12, remaining: 3 }
};
```

## Type Guards

### isCharacterCreationState
Type guard for character creation state validation.

```typescript
function isCharacterCreationState(data: unknown): data is CharacterCreationState {
  return (
    typeof data === 'object' &&
    data !== null &&
    'worldId' in data &&
    'currentStep' in data &&
    typeof (data as any).worldId === 'string' &&
    typeof (data as any).currentStep === 'number'
  );
}
```

**Usage:**
```typescript
const rawData = localStorage.getItem(saveKey);
if (rawData) {
  const parsed = JSON.parse(rawData);
  if (isCharacterCreationState(parsed)) {
    // TypeScript knows parsed is CharacterCreationState
    setData(parsed);
  }
}
```

### isSaveStatus
Type guard for save status validation.

```typescript
function isSaveStatus(status: unknown): status is SaveStatus {
  return typeof status === 'string' && 
         ['idle', 'saving', 'saved', 'error'].includes(status);
}
```

## Error Types

### AutoSaveError
Error information for auto-save failures.

```typescript
interface AutoSaveError {
  /** User-friendly error message */
  userMessage: string;
  
  /** Technical error details */
  technicalMessage: string;
  
  /** Whether the error is recoverable with retry */
  isRecoverable: boolean;
  
  /** Whether the user should be notified */
  shouldNotify: boolean;
  
  /** Error timestamp */
  timestamp: string;
}
```

**Example:**
```typescript
const saveError: AutoSaveError = {
  userMessage: 'Unable to save your progress. Please try again.',
  technicalMessage: 'QuotaExceededError: Storage quota exceeded',
  isRecoverable: true,
  shouldNotify: true,
  timestamp: '2024-01-15T14:30:00.000Z'
};
```

## Usage Examples

### Basic Hook Usage

```typescript
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';

function CharacterForm({ worldId }: { worldId: EntityID }) {
  const { data, setData, clearAutoSave, hasRecoveryData, saveStatus } = 
    useCharacterCreationAutoSave(worldId);

  // Type-safe access to saved data
  const currentStep = data?.currentStep ?? 0;
  const characterName = data?.characterData?.name ?? '';
  
  return (
    <div>
      <p>Current step: {currentStep}</p>
      <p>Save status: {saveStatus}</p>
      {hasRecoveryData && <p>Recovery data available!</p>}
    </div>
  );
}
```

### Complete Integration

```typescript
import { 
  useCharacterCreationAutoSave,
  type CharacterCreationState,
  type SaveStatus 
} from '@/hooks/useCharacterCreationAutoSave';

function CharacterWizard({ worldId }: { worldId: EntityID }) {
  const {
    data,
    setData,
    clearAutoSave,
    hasRecoveryData,
    saveStatus
  }: {
    data: CharacterCreationState | undefined;
    setData: (data: CharacterCreationState | undefined) => void;
    clearAutoSave: () => void;
    hasRecoveryData: boolean;
    saveStatus: SaveStatus;
  } = useCharacterCreationAutoSave(worldId);

  // Full type safety throughout
}