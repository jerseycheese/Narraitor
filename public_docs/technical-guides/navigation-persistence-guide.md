---
title: Navigation Persistence
tags: [navigation, persistence, state]
created: 2025-06-26
updated: 2025-06-26
---

# Navigation Persistence

Users hate losing their place when they refresh the browser or come back later. The navigation persistence system keeps track of where they've been and helps them get back to their work quickly.

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

Different types of navigation data need different storage approaches:

- **IndexedDB**: Long-term history that persists across browser restarts
- **sessionStorage**: Current session breadcrumbs that reset on new tabs
- **localStorage**: User preferences that stick around

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

Keep the navigation system fast and reliable:

- Limit history size (last 50 entries) to avoid bloating storage
- Use shallow routing for URL updates to avoid full page reloads
- Store minimal data in navigation state - just what you need to reconstruct context
- Handle storage quota limits gracefully with fallbacks