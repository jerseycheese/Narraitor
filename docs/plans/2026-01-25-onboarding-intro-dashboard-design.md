# Onboarding Introduction on Dashboard Design

## Context
The onboarding intro wizard already exists (`GuidedFirstTimeExperience`), but it only renders inside QuickPlay and a dev route. Issue #399 expects first‑time users to see onboarding on the home page (`/`), which currently renders `DashboardHome`. The Help menu shows an “Introduction” phase that corresponds to the `intro` tutorial state, so the dashboard entry point should use that same flow.

## Goals
- Show the `GuidedFirstTimeExperience` wizard for first‑time users on `/`.
- Ensure the Help/Tutorial menu is reachable on mobile for MVP parity.

## Non‑Goals
- Changing tutorial step content or Joyride tours.
- Changing resume/skip behavior or tutorial state persistence.

## Proposed Approach
1. Replace the first‑time branch in `DashboardHome` with the `GuidedFirstTimeExperience` component. The existing `shouldShowOnboarding()` selector drives the same `intro` phase and already handles skip/completion.
2. Add `TutorialMenu` to the mobile navigation overlay (`MobileNavigationMenu`) so the Help/Tutorial entry point is available on small screens without duplicating logic.

## UX Notes
- The wizard already runs inside `SSRClientOnly` on the home page, so there’s no new SSR risk.
- The mobile menu will display the same Help/Tutorial control as desktop, keeping the reset and progress UI consistent.

## Testing Strategy
- Update `DashboardHome` tests to assert the guided experience is rendered for first‑time users.
- Add a `MobileNavigationMenu` test that ensures the Help/Tutorial control renders when the mobile menu is open.
