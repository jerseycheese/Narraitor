# Onboarding Intro on Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show the existing introduction wizard on the home dashboard for first‑time users and make the Help/Tutorial menu available on mobile.

**Architecture:** Keep all onboarding logic in the existing `GuidedFirstTimeExperience` + `tutorialProgress` flow. The dashboard only swaps its first‑time branch to render that component, and the mobile nav simply renders the existing `TutorialMenu` component.

**Tech Stack:** Next.js App Router, React, Jest/Testing Library, Zustand

### Task 1: Render GuidedFirstTimeExperience on first‑time dashboard

**Files:**
- Modify: `src/components/Dashboard/__tests__/DashboardHome.test.tsx`
- Modify: `src/components/Dashboard/DashboardHome.tsx`

**Step 1: Write the failing test**

```tsx
// at top-level, add a component mock for GuidedFirstTimeExperience
jest.mock('@/components/GuidedFirstTimeExperience', () => ({
  GuidedFirstTimeExperience: () => (
    <div data-testid="guided-first-time-experience">Guided</div>
  ),
}));

// in the first-time user test
it('shows GuidedFirstTimeExperience for new users', () => {
  render(<DashboardHome />);
  expect(screen.getByTestId('guided-first-time-experience')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="DashboardHome"`
Expected: FAIL with “Unable to find an element by: [data-testid="guided-first-time-experience"]”.

**Step 3: Write minimal implementation**

```tsx
// in DashboardHome first-time branch
return <GuidedFirstTimeExperience />;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="DashboardHome"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Dashboard/DashboardHome.tsx src/components/Dashboard/__tests__/DashboardHome.test.tsx
git commit -m "feat(onboarding): show intro wizard on dashboard" -m "Relates to #399"
```

### Task 2: Expose tutorial menu in mobile navigation

**Files:**
- Create: `src/components/Navigation/__tests__/MobileNavigationMenu.test.tsx`
- Modify: `src/components/Navigation/MobileNavigationMenu.tsx`

**Step 1: Write the failing test**

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MobileNavigationMenu } from '../MobileNavigationMenu';

jest.mock('next/navigation', () => ({
  usePathname: () => '/worlds',
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({ worlds: {}, currentWorldId: null, setCurrentWorld: jest.fn() }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({ characters: {} }),
}));

jest.mock('@/components/Navigation/TutorialMenu', () => ({
  TutorialMenu: () => <div data-testid="tutorial-menu">Tutorials</div>,
}));

it('shows tutorial menu when mobile menu is open', () => {
  render(
    <MobileNavigationMenu
      isOpen={true}
      onClose={jest.fn()}
      onNavigate={jest.fn()}
    />
  );

  expect(screen.getByTestId('tutorial-menu')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="MobileNavigationMenu"`
Expected: FAIL because tutorial menu is not rendered yet.

**Step 3: Write minimal implementation**

```tsx
// import TutorialMenu
import { TutorialMenu } from './TutorialMenu';

// render it in the mobile header, alongside the close button
<div className="flex items-center gap-2">
  <TutorialMenu />
  <Button ...>...</Button>
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="MobileNavigationMenu"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Navigation/MobileNavigationMenu.tsx src/components/Navigation/__tests__/MobileNavigationMenu.test.tsx
git commit -m "feat(navigation): add tutorial menu to mobile nav" -m "Relates to #399"
```
