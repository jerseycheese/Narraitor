# Navigation State Persistence System

## Overview

The Navigation State Persistence system provides seamless user experience by maintaining navigation context across browser sessions, page refreshes, and tab closures. This system ensures users return to where they left off without losing their navigation history or preferences.

## Architecture

### Multi-Layer Storage Strategy

The system uses three storage mechanisms for different types of data:

1. **IndexedDB** (via Zustand persistence) - Long-term navigation history and preferences
2. **sessionStorage** - Current session path and breadcrumbs  
3. **localStorage** - Cross-session flow state and user preferences

### Core Components

```
NavigationPersistenceProvider
├── NavigationStore (Zustand)
├── useNavigationPersistence Hook
├── RecentPagesDropdown Component
└── Storage Helpers (session/local)
```

## Implementation Details

### Navigation Store (`src/state/navigationStore.ts`)

The central state management using Zustand with persistence middleware:

```typescript
interface NavigationState {
  // Current state
  currentPath: string | null;
  previousPath: string | null;
  
  // History and preferences
  history: NavigationHistoryEntry[];
  preferences: NavigationPreferences;
  
  // Session state
  breadcrumbs: string[];
  modals: Record<string, boolean>;
  currentFlowStep: FlowStep | null;
  isHydrated: boolean;
}
```

**Key Features:**
- Automatic path tracking with history management
- Configurable history limits via preferences
- Modal state management (auto-close on reload)
- Breadcrumb persistence across refreshes
- Flow state tracking for multi-step processes

### Storage Helpers

**Session Storage Helpers:**
```typescript
// Current path for immediate restoration
sessionStorageHelpers.setCurrentPath(path);
sessionStorageHelpers.getCurrentPath();

// Breadcrumb trail for navigation context
sessionStorageHelpers.setBreadcrumbs(breadcrumbs);
sessionStorageHelpers.getBreadcrumbs();
```

**Local Storage Helpers:**
```typescript
// Flow state for cross-session continuity
localStorageHelpers.setFlowState(flowState);
localStorageHelpers.getFlowState();
```

### Navigation Persistence Provider

Wraps the entire application to provide navigation state management:

```tsx
<NavigationLoadingProvider>
  <NavigationPersistenceProvider>
    <App />
  </NavigationPersistenceProvider>
</NavigationLoadingProvider>
```

**Responsibilities:**
- Initialize navigation state on app startup
- Hydrate state from storage layers
- Handle loading states during initialization
- Provide navigation context to child components

### Recent Pages Dropdown

Interactive component showing navigation history:

**Features:**
- Displays recent pages with timestamps
- Quick navigation to previously visited pages
- Remove items from history
- Responsive design with scrollable list
- Automatic filtering of current page

**Usage:**
```tsx
<RecentPagesDropdown />
```

The component automatically integrates with the navigation store and shows/hides based on user preferences.

## Usage Guide

### Basic Integration

The system is automatically integrated into the application. No manual setup required for basic functionality.

### Accessing Navigation State

```tsx
import { useNavigationStore } from '@/state/navigationStore';

function MyComponent() {
  const { 
    currentPath, 
    history, 
    preferences,
    setCurrentPath 
  } = useNavigationStore();
  
  // Use navigation state...
}
```

### Using Navigation Persistence Hook

```tsx
import { useNavigationPersistence } from '@/hooks/useNavigationPersistence';

function MyComponent() {
  const { 
    currentPath,
    isHydrated,
    navigateWithPersistence,
    preferences 
  } = useNavigationPersistence();
  
  // Navigate with automatic state persistence
  const handleNavigation = () => {
    navigateWithPersistence('/target-path');
  };
}
```

### Managing Modal States

```tsx
import { useNavigationStore } from '@/state/navigationStore';

function MyModal() {
  const { setModalState, closeAllModals } = useNavigationStore();
  
  // Register modal state
  useEffect(() => {
    setModalState('myModal', true);
    return () => setModalState('myModal', false);
  }, []);
}
```

### Customizing Preferences

```tsx
import { useNavigationStore } from '@/state/navigationStore';

function NavigationSettings() {
  const { preferences, updatePreferences } = useNavigationStore();
  
  const handlePreferenceChange = () => {
    updatePreferences({
      showRecentPages: true,
      maxRecentPages: 15,
      sidebarCollapsed: false
    });
  };
}
```

## Configuration

### Navigation Preferences

```typescript
interface NavigationPreferences {
  sidebarCollapsed: boolean;      // Sidebar state persistence
  breadcrumbsEnabled: boolean;    // Show/hide breadcrumbs
  autoNavigateOnSelect: boolean;  // Auto-navigate on selections
  showRecentPages: boolean;       // Enable recent pages dropdown
  maxRecentPages: number;         // Maximum history items (default: 10)
}
```

### Storage Keys

The system uses consistent storage keys:

```typescript
const STORAGE_KEYS = {
  SESSION_PATH: 'narraitor-session-path',
  NAVIGATION_BREADCRUMBS: 'narraitor-navigation-breadcrumbs', 
  FLOW_STATE: 'narraitor-flow-state',
} as const;
```

## Error Handling

### Storage Unavailability

The system gracefully handles storage unavailability:

```typescript
// All storage operations are wrapped in try-catch
try {
  sessionStorage.setItem(key, value);
} catch (error) {
  // Log warning but continue operation
  logger.warn('Storage unavailable:', error);
}
```

### State Corruption

Invalid or corrupted state is handled automatically:

- **IndexedDB**: Zustand persistence middleware handles corruption
- **sessionStorage/localStorage**: Invalid JSON is ignored, defaults used
- **Missing data**: System initializes with sensible defaults

### Network Failures

Navigation persistence works entirely client-side, so network failures don't affect functionality.

## Performance Considerations

### Memory Management

- **History Limit**: Configurable `maxRecentPages` prevents unlimited growth
- **Automatic Cleanup**: Expired entries are removed automatically
- **Debounced Updates**: Storage writes are debounced to prevent excessive I/O

### Storage Efficiency

- **Selective Persistence**: Only essential data persists long-term
- **Session-Specific Data**: Temporary data uses sessionStorage
- **Compressed Storage**: Minimal data structure for efficient storage

### Hydration Performance

- **Progressive Hydration**: App loads immediately, state hydrates asynchronously
- **Fallback Handling**: App functions normally even if hydration fails
- **Loading States**: Smooth loading indicators during initialization

## Testing

### Unit Tests

Comprehensive test suite covering:
- Navigation store functionality (28 tests)
- Navigation persistence hook (13 tests)
- Storage helpers and error handling
- State hydration and initialization

### Manual Testing

Use the provided `MANUAL_TESTING_CHECKLIST.md` for comprehensive testing across:
- Browser refresh scenarios
- Cross-session persistence
- Multiple browser windows
- Storage error conditions
- Performance verification

### Browser Compatibility

Tested and verified on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Common Issues

**Recent Pages Not Showing:**
- Check `preferences.showRecentPages` setting
- Verify localStorage is available
- Clear browser storage and retry

**Navigation State Not Persisting:**
- Check browser privacy settings
- Verify IndexedDB is enabled
- Test in incognito mode to isolate extensions

**Performance Issues:**
- Check `maxRecentPages` setting
- Monitor DevTools for storage errors
- Verify reasonable history size

### Debug Information

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug', 'NavigationStore,NavigationPersistence');
```

Check browser DevTools:
- **Application tab**: Verify storage contents
- **Console**: Look for navigation-related logs
- **Network tab**: Ensure no unexpected requests

## Migration Guide

### From Previous Navigation System

The new system is backward compatible. Existing navigation will continue working with additional persistence features automatically enabled.

### Storage Migration

If upgrading from a previous version:

1. Old navigation state is preserved
2. New persistence features activate gradually
3. No manual migration required

## Future Enhancements

### Planned Features

- **Smart History**: AI-suggested navigation based on usage patterns
- **Cross-Device Sync**: Sync navigation state across devices
- **Advanced Preferences**: More granular control over persistence behavior
- **Analytics Integration**: Track navigation patterns for UX improvements

### Extension Points

The system is designed for extensibility:

```typescript
// Custom storage adapters
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Custom navigation tracking
interface NavigationTracker {
  onNavigate(path: string, context?: any): void;
  onHistoryUpdate(history: NavigationHistoryEntry[]): void;
}
```

## Related Documentation

- [State Management Usage](./state-management-usage.md)
- [Navigation Loading System](./navigation-loading-system.md)  
- [Error Handling Guide](./error-handling.md)
- [Testing Strategy](../tests/navigation-persistence-tests.md)