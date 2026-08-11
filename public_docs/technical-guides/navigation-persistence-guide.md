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
// Navigation store — this is an App Router codebase, so read the path from
// next/navigation (usePathname), not the Pages Router's router.pathname.
const {
  currentPath,
  history,
  addToHistory,
  setCurrentPath,
} = useNavigationStore();

const pathname = usePathname(); // from 'next/navigation'

// setCurrentPath(path, title?, params?) updates the path and records history;
// addToHistory takes a full NavigationHistoryEntry, not a bare string.
setCurrentPath(pathname);
addToHistory({ path: pathname, timestamp: getTimestamp(), title });

// Recent pages dropdown — its only prop is className. It reads history from the
// store, filters out the current page, and navigates internally via
// navigateWithLoading. The item cap comes from preferences.maxRecentPages.
<RecentPagesDropdown className="recent-pages" />
```

Heads up: `setCurrentPath`/`addToHistory` expose the real store API, but nothing in app navigation calls them today — only the store internals, tests, and the DevTools state panel do. So `RecentPagesDropdown` reads from `history`, but that history isn't actively populated during normal navigation yet. Wire the calls above into a navigation effect if you want live tracking.

## Storage Strategy

Different types of navigation data live in different places:

- **localStorage**: The durable layer. The store uses Zustand's `persist` middleware (default localStorage) under `narraitor-navigation-store`, and `partialize` keeps only `history` and `preferences`. Flow state is stored separately under `narraitor-flow-state`.
- **sessionStorage**: The current path and breadcrumbs, for browser-refresh recovery within a tab (`narraitor-session-path`, `narraitor-navigation-breadcrumbs`). These reset on a new tab.

There's no IndexedDB in the navigation system — history is small (capped at `maxRecentPages`, default 10), so localStorage is plenty.

## Best Practices

Keep the navigation system fast and reliable:

- History is capped at `preferences.maxRecentPages` (default 10) and dedupes by path, so revisiting a page moves it to the top rather than duplicating it
- Read recent pages through `getRecentPages(limit?)` and check prior visits with `hasVisited(path)` rather than poking at `history` directly
- Store minimal data in navigation state - just what you need to reconstruct context
- Handle storage quota limits with fallbacks