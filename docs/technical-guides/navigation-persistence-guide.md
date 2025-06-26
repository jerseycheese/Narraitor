---
title: Navigation Persistence
tags: [navigation, persistence, state]
created: 2025-06-26
updated: 2025-06-26
---

# Navigation Persistence

Maintain navigation context across browser sessions.

## Core Usage

```typescript
// Navigation store
const {
  currentPath,
  history,
  addToHistory,
  setCurrentPath
} = useNavigationStore();

// Track navigation
useEffect(() => {
  addToHistory(router.pathname);
  setCurrentPath(router.pathname);
}, [router.pathname]);

// Recent pages dropdown
<RecentPagesDropdown 
  onPageSelect={(path) => router.push(path)}
  maxItems={5}
/>
```

## Storage Strategy

- **IndexedDB**: Long-term history (Zustand persistence)
- **sessionStorage**: Current session breadcrumbs
- **localStorage**: User preferences

## URL State Persistence

```typescript
// Persist state in URL query parameters
const useURLState = <T>(key: string, defaultValue: T) => {
  const router = useRouter();
  
  const value = useMemo(() => {
    const param = router.query[key];
    return param ? JSON.parse(param as string) : defaultValue;
  }, [router.query, key, defaultValue]);

  const setValue = useCallback((newValue: T) => {
    const query = { ...router.query, [key]: JSON.stringify(newValue) };
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, key]);

  return [value, setValue] as const;
};
```

## Best Practices

- Limit history size (last 50 entries)
- Use shallow routing for URL updates
- Store minimal data in navigation state
- Handle storage quota limits gracefully