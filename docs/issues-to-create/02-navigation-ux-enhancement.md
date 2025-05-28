---
name: Enhancement
about: Suggest an enhancement to an existing feature
title: "Move 'Current world:' indicator to prominent left position in navigation"
labels: enhancement, ux, quick-win, mvp
assignees: ''
---

## Plain Language Summary
The current world indicator is not prominent enough in the navigation. Moving it to the left side will help players always know which world they're playing in.

## Current Feature
The "Current world:" indicator exists but is not prominently placed in the navigation, making it easy for players to lose track of which world they're in during gameplay.

## Domain
- [ ] World Configuration
- [ ] Character System
- [ ] Decision Tracking System
- [ ] Decision Relevance System
- [ ] Narrative Engine
- [ ] Journal System
- [ ] State Management
- [x] Other: Navigation/UI

## Enhancement Description
Move the "Current world:" indicator to a prominent left-side position in the navigation bar. This should be one of the first elements users see, providing constant context about their current game world. The indicator should:
- Be positioned on the left side of the navigation
- Use clear, readable typography
- Include the world name in a contrasting color
- Remain visible across all game screens
- Be responsive on mobile devices

## Reason for Enhancement
- Players frequently lose track of which world they're in
- Current placement is not prominent enough
- Foundation work for better game context awareness
- Quick UX win that improves overall navigation
- Aligns with standard navigation patterns (context on left, actions on right)

## Possible Implementation
```typescript
// In Navigation component
<nav className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <span className="text-sm text-gray-600">Current world:</span>
    <span className="font-semibold text-lg">{worldName}</span>
  </div>
  {/* Rest of navigation items */}
</nav>
```

Consider using the existing `worldStore` to get current world information and ensure it updates reactively when world changes.

## Alternatives Considered
- Adding world name to page title (doesn't help with in-page context)
- Floating widget (too intrusive)
- Footer placement (not visible enough)
- Right-side placement (conflicts with action buttons)

## Additional Context
- This is a quick win that addresses a specific user pain point
- Estimated implementation time: 1 day
- No new dependencies or architectural changes required
- Follows existing navigation patterns in the application