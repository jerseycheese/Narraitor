# RecoveryNotification Component

This is the modal dialog that pops up when someone returns to character creation and we find saved data from a previous session. Basically gives users the choice to pick up where they left off or start fresh.

## What It's For

So you've got the auto-save system quietly saving character data in the background. When users come back to character creation later - maybe they closed their browser yesterday, or accidentally navigated away - this component shows up to let them know we found their previous work.

The tricky part is handling conflicts. If they've already started entering new data in the current session, we need to warn them that recovering will overwrite what they've typed. That's where the conflict detection comes in.

What it handles:

- Shows a preview of what was saved (character name, which step they were on, what they'd completed)
- Warns users if they've already started typing new stuff that would get overwritten
- Proper accessibility - ARIA attributes, focus management, all that
- Auto-focuses on the main button so keyboard navigation works
- Formats the "last saved" timestamp nicely (and handles cases where the date is corrupted)

## Props Interface

```typescript
interface RecoveryNotificationProps {
  /** Controls dialog visibility */
  isVisible: boolean;
  /** ISO timestamp of when data was last saved */
  lastSaved?: string;
  /** Analyzed recovery data for preview display */
  recoveryData?: RecoveryData;
  /** Whether current form has data that would be overwritten */
  hasCurrentData?: boolean;
  /** Callback when user chooses to recover data */
  onRecover: () => void;
  /** Callback when user chooses to start fresh */
  onDismiss: () => void;
}

interface RecoveryData {
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

## Usage Examples

### Basic Usage

```typescript
import { RecoveryNotification } from '@/components/shared/RecoveryNotification';

function CharacterCreationWizard() {
  const { hasRecoveryData, recoveryPreview, hasCurrentData } = useCharacterCreationAutoSave(worldId);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  useEffect(() => {
    if (hasRecoveryData) {
      setShowRecoveryDialog(true);
    }
  }, [hasRecoveryData]);

  return (
    <>
      {/* Main character creation UI */}
      <CharacterCreationForm />
      
      {/* Recovery notification */}
      <RecoveryNotification
        isVisible={showRecoveryDialog}
        lastSaved={recoveryPreview?.lastSaved}
        recoveryData={recoveryPreview}
        hasCurrentData={hasCurrentData}
        onRecover={() => {
          // Keep existing auto-saved data
          setShowRecoveryDialog(false);
        }}
        onDismiss={() => {
          // Clear auto-saved data and start fresh
          clearAutoSave();
          setShowRecoveryDialog(false);
        }}
      />
    </>
  );
}
```

### With Error Handling

```typescript
function CharacterCreationWizard() {
  const handleRecover = useCallback(() => {
    try {
      setShowRecoveryDialog(false);
      // Data is already loaded from auto-save hook
      console.log('Recovering previous character data');
    } catch (error) {
      console.error('Failed to recover data:', error);
      // Could show error notification
    }
  }, []);

  const handleStartFresh = useCallback(() => {
    try {
      clearAutoSave();
      setShowRecoveryDialog(false);
      // Reset form to initial state
      resetFormData();
      console.log('Starting fresh character creation');
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  }, [clearAutoSave]);

  return (
    <RecoveryNotification
      isVisible={showRecoveryDialog}
      lastSaved={recoveryPreview?.lastSaved}
      recoveryData={recoveryPreview}
      hasCurrentData={hasCurrentData}
      onRecover={handleRecover}
      onDismiss={handleStartFresh}
    />
  );
}
```

## Component Behavior

### Data Preview Generation

The component intelligently displays preview information based on available recovery data:

```typescript
// Character name display
{recoveryData?.name && (
  <div>Character name: <span>{recoveryData.name}</span></div>
)}

// Progress indication with step names
{recoveryData?.currentStep !== undefined && (
  <div>Progress: <span>{getStepDescription(recoveryData.currentStep)}</span></div>
)}

// Attribute allocation summary
{recoveryData?.hasAttributes && recoveryData?.totalAttributePoints !== undefined && (
  <div>Attribute points allocated: <span>{recoveryData.totalAttributePoints}</span></div>
)}

// Skills selection count
{recoveryData?.hasSkills && recoveryData?.selectedSkillCount !== undefined && (
  <div>Skills selected: <span>{recoveryData.selectedSkillCount}</span></div>
)}

// Background completion status
{recoveryData?.hasBackground && (
  <div>Background: <span>Completed</span></div>
)}
```

### Step Name Resolution

The component maps step indices to user-friendly names:

```typescript
const getStepDescription = (step?: number) => {
  const stepNames = ['Basic Info', 'Attributes', 'Skills', 'Background', 'Portrait'];
  if (step !== undefined && step >= 0 && step < stepNames.length) {
    return `${stepNames[step]} step`;
  }
  return 'Unknown step';
};
```

### Timestamp Formatting

Falls back to no timestamp if the format is invalid:

```typescript
const formattedDate = lastSaved ? formatDateTime(lastSaved) : null;
const validDate = formattedDate && formattedDate !== 'Invalid date' ? formattedDate : null;

// Only show timestamp if valid
{validDate && (
  <p>Last saved: {validDate}</p>
)}
```

## Accessibility Features

### ARIA Attributes

Dialog accessibility is handled by the shared `SimpleModal` wrapper, which owns the overlay, the dialog role and labelling, and focus trapping — the component doesn't hand-roll any of it:

```typescript
<SimpleModal
  isOpen={isVisible}
  onClose={onDismiss}
  title="Character Creation Progress Found"
>
  {/* Dialog content */}
</SimpleModal>
```

### Focus Management

Auto-focuses the primary action when dialog appears:

```typescript
const recoverButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (isVisible && recoverButtonRef.current) {
    recoverButtonRef.current.focus();
  }
}, [isVisible]);

return (
  <Button ref={recoverButtonRef} onClick={onRecover}>
    Recover Progress
  </Button>
);
```

### Screen Reader Support

- Clear labeling with `aria-labelledby` and `aria-describedby`
- Proper button roles and accessible names
- Warning indicators for data conflicts
- Close button with screen reader text

## Visual Design

### Layout Structure

```
┌─────────────────────────────────────────────┐
│ [!] Character Creation Progress Found    [×] │
│                                             │
│ Found saved character creation progress     │
│ from a previous session.                    │
│                                             │
│ [!] Warning (if hasCurrentData is true)     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Saved Progress Preview:                 │ │
│ │ • Character name: John Smith            │ │
│ │ • Progress: Attributes step             │ │
│ │ • Attribute points allocated: 25        │ │
│ │ • Skills selected: 3                    │ │
│ │ • Background: Completed                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Last saved: Jan 15, 2024 at 2:30 PM       │
│                                             │
│ [Recover Progress] [Start Fresh]           │
└─────────────────────────────────────────────┘
```

### Responsive Design

- Mobile-friendly button layout, handled by the modal's own CSS rather than utility classes
- Maximum width constraint with proper padding
- Responsive text sizing and spacing

### Visual Indicators

- Amber warning icon for attention-grabbing header
- Gray preview box to distinguish saved data
- Warning emoji and color for conflict situations
- Primary button styling for "Recover Progress"

## Integration Patterns

### With Auto-Save Hook

The component is designed to work seamlessly with `useCharacterCreationAutoSave`:

```typescript
const {
  hasRecoveryData,
  recoveryPreview,
  hasCurrentData,
  clearAutoSave
} = useCharacterCreationAutoSave(worldId);

// Component automatically detects when to show dialog
useEffect(() => {
  if (hasRecoveryData && !hasShownDialog) {
    setShowRecoveryDialog(true);
    setHasShownDialog(true); // Prevent showing multiple times
  }
}, [hasRecoveryData]);
```

### State Management

Typical state management pattern:

```typescript
const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
const [hasShownDialog, setHasShownDialog] = useState(false);

// Reset state when component unmounts or world changes
useEffect(() => {
  return () => {
    setShowRecoveryDialog(false);
    setHasShownDialog(false);
  };
}, [worldId]);
```

## Testing

### Unit Testing

Key test scenarios for the component:

```typescript
describe('RecoveryNotification', () => {
  test('displays recovery data preview correctly', () => {
    const mockRecoveryData = {
      name: 'Test Character',
      currentStep: 2,
      hasAttributes: true,
      totalAttributePoints: 25,
      hasSkills: true,
      selectedSkillCount: 3
    };

    render(
      <RecoveryNotification
        isVisible={true}
        recoveryData={mockRecoveryData}
        onRecover={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Skills step')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('shows conflict warning when hasCurrentData is true', () => {
    render(
      <RecoveryNotification
        isVisible={true}
        hasCurrentData={true}
        onRecover={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByText(/Recovering will replace any current form data/)).toBeInTheDocument();
  });
};
```

### Storybook Stories

Storybook stories:

- `Visible`: Standard dialog with recent save data
- `VisibleWithOldSave`: Dialog with older timestamp
- `VisibleWithoutTimestamp`: Dialog without timestamp data
- Interactive controls for testing different prop combinations

## Performance Considerations

**Rendering Optimization:**
- Component only renders when `isVisible` is true
- Preview data is pre-computed by the auto-save hook
- Minimal re-renders with proper prop handling

**Memory Usage:**
- No memory leaks with proper cleanup of refs
- Event handlers use stable references when possible
- Component unmounts cleanly when not visible

## Common Issues & Solutions

### Dialog Not Appearing

**Problem**: Recovery dialog doesn't show even when data exists
**Solutions**:
- Verify `isVisible` prop is properly controlled
- Check if `hasRecoveryData` is correctly set from the hook
- Ensure component is rendered in the DOM tree

### Focus Issues

**Problem**: Focus not properly managed in dialog
**Solutions**:
- Check if `recoverButtonRef` is properly attached
- Verify `useEffect` dependency array includes `isVisible`
- Test with keyboard navigation and screen readers

### Preview Data Missing

**Problem**: Recovery preview shows no data
**Solutions**:
- Verify recovery data analysis in the auto-save hook
- Check localStorage data format and structure
- Ensure `recoveryData` prop is passed correctly

## Migration Notes

When upgrading or integrating the component:

1. **Props Interface**: Component props may evolve - check TypeScript definitions
2. **CSS Classes**: Styling comes from the design system's semantic CSS classes and the shared `SimpleModal` — there's no Tailwind to configure
3. **Dependencies**: Requires `Button` component from UI system
4. **Accessibility**: Maintains WCAG 2.1 AA compliance requirements