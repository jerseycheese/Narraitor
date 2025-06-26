---
title: Navigation State Persistence Guide
tags: [navigation, persistence, state, user-experience]
created: 2025-06-26
updated: 2025-06-26
---

# Navigation State Persistence Guide

Maintain navigation context across browser sessions and page refreshes.

## Quick Start

### Using Navigation Store
```typescript
import { useNavigationStore } from '@/state/navigationStore';

const {
  currentPath,
  previousPath,
  history,
  addToHistory,
  setCurrentPath
} = useNavigationStore();

// Track navigation
useEffect(() => {
  addToHistory(router.pathname);
  setCurrentPath(router.pathname);
}, [router.pathname]);
```

### Recent Pages Dropdown
```typescript
import { RecentPagesDropdown } from '@/components/Navigation/RecentPagesDropdown';

<RecentPagesDropdown 
  onPageSelect={(path) => router.push(path)}
  maxItems={5}
/>
```

## Storage Strategy

### Multi-Layer Storage
- **IndexedDB**: Long-term history and preferences (via Zustand persistence)
- **sessionStorage**: Current session breadcrumbs and flow state
- **localStorage**: Cross-session user preferences

### Navigation Store
```typescript
interface NavigationState {
  currentPath: string | null;
  previousPath: string | null;
  history: NavigationHistoryEntry[];
  preferences: UserNavigationPreferences;
  
  // Actions
  addToHistory: (path: string, metadata?: any) => void;
  setCurrentPath: (path: string) => void;
  clearHistory: () => void;
  goBack: () => void;
}

interface NavigationHistoryEntry {
  path: string;
  title: string;
  timestamp: string;
  metadata?: {
    worldId?: string;
    sessionId?: string;
    characterId?: string;
  };
}
```

## Core Components

### useNavigationPersistence Hook
```typescript
const useNavigationPersistence = () => {
  const router = useRouter();
  const { addToHistory, setCurrentPath } = useNavigationStore();

  useEffect(() => {
    // Persist current route
    addToHistory(router.pathname, {
      worldId: getCurrentWorldId(),
      timestamp: new Date().toISOString()
    });
    
    setCurrentPath(router.pathname);
  }, [router.pathname]);

  return {
    goBack: () => router.back(),
    goToPage: (path: string) => router.push(path)
  };
};
```

### NavigationProvider
```typescript
const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  
  useEffect(() => {
    // Restore navigation state on app load
    const restoreNavigationState = async () => {
      const savedState = await loadNavigationState();
      if (savedState?.lastPath && savedState.lastPath !== router.pathname) {
        // Optional: redirect to last known path
        console.log('Last known path:', savedState.lastPath);
      }
    };
    
    restoreNavigationState();
  }, []);

  return <>{children}</>;
};
```

## Persistence Utilities

### Session Storage
```typescript
// Current session breadcrumbs
const saveBreadcrumbs = (breadcrumbs: Breadcrumb[]) => {
  sessionStorage.setItem('navigation-breadcrumbs', JSON.stringify(breadcrumbs));
};

const loadBreadcrumbs = (): Breadcrumb[] => {
  const saved = sessionStorage.getItem('navigation-breadcrumbs');
  return saved ? JSON.parse(saved) : [];
};
```

### Local Storage
```typescript
// Cross-session preferences
const saveNavigationPreferences = (prefs: NavigationPreferences) => {
  localStorage.setItem('navigation-preferences', JSON.stringify(prefs));
};

const loadNavigationPreferences = (): NavigationPreferences => {
  const saved = localStorage.getItem('navigation-preferences');
  return saved ? JSON.parse(saved) : defaultPreferences;
};
```

## Flow State Management

### Game Flow Persistence
```typescript
interface GameFlowState {
  currentStep: string;
  completedSteps: string[];
  flowData: Record<string, any>;
}

const useGameFlowPersistence = (flowId: string) => {
  const [flowState, setFlowState] = useState<GameFlowState | null>(null);

  useEffect(() => {
    // Load flow state
    const saved = localStorage.getItem(`flow-${flowId}`);
    if (saved) {
      setFlowState(JSON.parse(saved));
    }
  }, [flowId]);

  const saveFlowState = (state: GameFlowState) => {
    localStorage.setItem(`flow-${flowId}`, JSON.stringify(state));
    setFlowState(state);
  };

  return { flowState, saveFlowState };
};
```

### Wizard State Persistence
```typescript
const useWizardPersistence = (wizardId: string) => {
  const saveWizardStep = (step: number, data: any) => {
    sessionStorage.setItem(`wizard-${wizardId}`, JSON.stringify({
      currentStep: step,
      data,
      timestamp: Date.now()
    }));
  };

  const restoreWizardState = () => {
    const saved = sessionStorage.getItem(`wizard-${wizardId}`);
    if (saved) {
      const { currentStep, data, timestamp } = JSON.parse(saved);
      
      // Only restore if less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        return { currentStep, data };
      }
    }
    return null;
  };

  return { saveWizardStep, restoreWizardState };
};
```

## URL State Management

### Query Parameter Persistence
```typescript
const useURLState = <T>(key: string, defaultValue: T) => {
  const router = useRouter();
  
  const value = useMemo(() => {
    const param = router.query[key];
    if (param) {
      try {
        return JSON.parse(Array.isArray(param) ? param[0] : param);
      } catch {
        return param;
      }
    }
    return defaultValue;
  }, [router.query, key, defaultValue]);

  const setValue = useCallback((newValue: T) => {
    const query = { ...router.query };
    if (newValue === defaultValue) {
      delete query[key];
    } else {
      query[key] = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
    }
    
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, key, defaultValue]);

  return [value, setValue] as const;
};
```

## Recent Pages Component

### RecentPagesDropdown
```typescript
const RecentPagesDropdown = ({ 
  onPageSelect, 
  maxItems = 5 
}: {
  onPageSelect: (path: string) => void;
  maxItems?: number;
}) => {
  const { history } = useNavigationStore();
  
  const recentPages = useMemo(() => {
    return history
      .slice(-maxItems)
      .reverse()
      .filter((entry, index, arr) => 
        arr.findIndex(e => e.path === entry.path) === index
      );
  }, [history, maxItems]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Recent Pages</DropdownMenuTrigger>
      <DropdownMenuContent>
        {recentPages.map((page) => (
          <DropdownMenuItem 
            key={page.path}
            onClick={() => onPageSelect(page.path)}
          >
            {page.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

## Best Practices

### Performance
- Limit history size (keep last 50 entries)
- Use shallow routing for URL state updates
- Debounce frequent navigation state updates
- Clean up old session storage periodically

### User Experience
- Preserve form data during navigation
- Restore scroll position when returning to pages
- Show loading states during navigation
- Provide clear "back" functionality

### Data Management
- Store minimal data in navigation state
- Use IDs instead of full objects when possible
- Implement automatic cleanup of old entries
- Handle storage quota limits gracefully

## Testing

### Mock Navigation Store
```typescript
const mockNavigationStore = {
  currentPath: '/test',
  previousPath: '/home',
  history: [
    { path: '/home', title: 'Home', timestamp: '2025-01-01T00:00:00Z' },
    { path: '/test', title: 'Test', timestamp: '2025-01-01T00:01:00Z' }
  ],
  addToHistory: jest.fn(),
  setCurrentPath: jest.fn()
};

jest.mock('@/state/navigationStore', () => ({
  useNavigationStore: () => mockNavigationStore
}));
```

### Integration Testing
```typescript
test('persists navigation state across page refreshes', async () => {
  render(<App />);
  
  // Navigate to a page
  fireEvent.click(screen.getByText('Character List'));
  
  // Simulate page refresh
  window.location.reload();
  
  // Check that navigation state is restored
  expect(screen.getByText('Character List')).toBeInTheDocument();
});
```

## Related
- `/src/state/navigationStore.ts` - Navigation store implementation
- `/src/components/Navigation/` - Navigation components
- `/src/hooks/useNavigationPersistence.ts` - Custom hook
- State Management Guide