---
name: Improve Navigation & User Flow (MVP)
about: Streamline the world → character → game flow with better navigation and clearer CTAs
title: "Improve Navigation & User Flow"
labels: enhancement, priority:high, complexity:medium, domain:game-session-ui
assignees: ''
---

## Plain Language Summary
Simplify how users navigate from selecting a world to creating a character to starting a game, making the flow obvious and intuitive without "hunting around" to understand what to do next.

## Current Feature
Navigation exists but requires users to figure out the concept and flow on their own. The path from landing page → world selection → character creation → game start involves too many separate pages with unclear next steps.

## Domain
- [ ] World Configuration
- [ ] Character System
- [ ] Decision Tracking System
- [ ] Decision Relevance System
- [ ] Narrative Engine
- [ ] Journal System
- [ ] State Management
- [x] Other: Game Session UI & Navigation

## Enhancement Description
Create a streamlined navigation experience that guides users through the world → character → game flow with:
- Unified game start wizard that combines all steps
- Context-aware breadcrumbs showing current location
- Clear "Next Step" call-to-action buttons at each stage
- Quick Play functionality to resume last session
- Visual progress indicators throughout the flow

## Reason for Enhancement
- Addresses direct user feedback about confusing flow
- Reduces friction for new users
- Enables faster game resumption for returning players
- Creates a more professional and polished experience
- Prevents users from getting lost or abandoning the app

## Possible Implementation

### 1. Quick Play Functionality
- Add "Continue Last Game" button to home page
- Implement "Quick Start" using last world/character
- Store last session info in sessionStore
- Enable game resumption in 2 clicks or less

### 2. Unified GameStartWizard Component
```typescript
// Location: /src/components/GameStartWizard/
interface GameStartFlow {
  currentStep: 'world' | 'character' | 'ready';
  selectedWorldId: string | null;
  selectedCharacterId: string | null;
  canSkipToPlay: boolean; // If user has saved session
}
```
- Step 1: World selection/creation
- Step 2: Character selection/creation  
- Step 3: Ready to play summary
- Persistent progress indicator throughout

### 3. Enhanced Navigation Breadcrumbs
```typescript
// Location: /src/components/shared/Navigation/Breadcrumb.tsx
interface NavigationContext {
  currentPath: string[];
  nextAction: {
    label: string;
    href: string;
    isEnabled: boolean;
  } | null;
  previousAction: {
    label: string;
    href: string;
  } | null;
}
```
- Show: Home > World Name > Character Name > Playing
- Make each segment clickable
- Add visual indicators for current step

### 4. Contextual CTAs on Each Page
- **Worlds page**: "Select World to Continue" or "Create World"
- **World detail**: "Create/Select Character" (prominent button)
- **Character page**: "Start Playing" (prominent button)
- **Add**: "What's Next?" help tooltips

### 5. Implementation Steps (TDD Approach)
1. [x] Define test cases
   - Test navigation flow state management
   - Test breadcrumb generation
   - Test quick play logic
   - Test CTA visibility rules

2. [ ] Create Storybook stories
   - GameStartWizard component stories
   - Enhanced breadcrumb stories
   - QuickPlay button variants
   - Navigation state stories

3. [ ] Implement Quick Play functionality
4. [ ] Create unified GameStartWizard component
5. [ ] Enhance navigation breadcrumbs
6. [ ] Add contextual CTAs to each page
7. [ ] Create test harness pages (/dev/navigation-flow)
8. [ ] Integration testing

### Files to Create:
- `/src/components/GameStartWizard/`: Unified start flow
- `/src/components/shared/Navigation/Breadcrumb.tsx`: Context breadcrumb
- `/src/components/QuickPlay/`: Quick play button component
- `/src/lib/hooks/useNavigationContext.ts`: Navigation state hook
- `/src/app/dev/navigation-flow/page.tsx`: Test harness

### Files to Modify:
- `/src/app/page.tsx`: Add quick play options
- `/src/app/worlds/page.tsx`: Add clearer CTAs
- `/src/app/world/[id]/page.tsx`: Add "Create Character" CTA
- `/src/app/characters/page.tsx`: Add "Start Playing" CTA
- `/src/components/shared/Navigation`: Add breadcrumb component

## Alternatives Considered
1. **Complex onboarding tutorial** - Too heavy for MVP, might overwhelm users
2. **Single-page application** - Would require major architectural changes
3. **Floating help system** - Adds complexity without solving core navigation issues
4. **Forced linear flow** - Too restrictive for returning users

## Additional Context
This enhancement directly addresses user feedback about the current navigation being confusing. The solution balances simplicity for new users with efficiency for returning players.

### Technical Notes:
- Leverage existing wizard component patterns for consistency
- Use sessionStore's saved session functionality
- Maintain responsive design across all breakpoints
- Ensure keyboard navigation works properly
- Add loading states for async operations

### Test Plan:
1. **Unit Tests**: Navigation state, breadcrumb generation, quick play logic
2. **Storybook Stories**: All component states and variations
3. **Test Harness**: Simulate various user flows and edge cases
4. **Integration Tests**: Complete user journeys

### Success Criteria:
- [ ] New users understand the flow without confusion
- [ ] Returning users can resume in 2 clicks or less
- [ ] Each page clearly indicates the next step
- [ ] Breadcrumbs provide clear navigation context
- [ ] No "hunting around" to figure out what to do
- [ ] All stories follow 'Narraitor/Navigation/[Component]' naming

### Out of Scope:
- Changing core game mechanics
- Modifying AI generation logic
- Redesigning visual theme
- Adding new features beyond navigation
- Complex onboarding tutorials

### Future Enhancements:
- Interactive onboarding tutorial
- Keyboard shortcuts for navigation
- Navigation preferences (skip steps)
- Mobile-optimized navigation
- Breadcrumb customization options
