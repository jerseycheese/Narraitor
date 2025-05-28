TASK ANALYSIS
GitHub Issue: #452 Add icons to breadcrumb segments for visual hierarchy
Labels: enhancement, user-story, priority:low, complexity:small, domain:game-session-ui
Description: Add visual icons to breadcrumb segments to help users quickly identify content types (world, character, home) in the navigation trail.
Priority: Medium (Low complexity with good UX improvement)
Current State: Core breadcrumb navigation exists (#400), ready for icon enhancement

TECHNICAL DESIGN
Data Flow:
- Breadcrumb component determines segment type from href pattern
- Icon component renders based on segment type
- Icons are inline SVGs for performance
- Existing getTestId() function provides type detection logic

Core Changes:
1. Icon Component Creation
   - Location: src/components/Navigation/BreadcrumbIcon.tsx
   - Details: Simple component to render appropriate SVG based on type
   
2. Breadcrumb Component Update
   - Location: src/components/Navigation/Breadcrumbs.tsx
   - Details: Add icon rendering before label text

3. Storybook Stories Update
   - Location: src/components/Navigation/Breadcrumbs.stories.tsx
   - Details: Add story variants showing icons

INTERFACES
```typescript
// BreadcrumbIcon component props
interface BreadcrumbIconProps {
  segmentType: 'home' | 'world' | 'character' | 'generic';
  className?: string;
}

// Updated BreadcrumbsProps (optional icon configuration)
interface BreadcrumbsProps {
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  showIcons?: boolean; // New optional prop
}
```

IMPLEMENTATION STEPS
1. [ ] Define test cases (TDD approach)
   - Test icon rendering for each segment type
   - Test accessibility attributes
   - Test icon visibility toggle
   - Test responsive behavior

2. [ ] Create Storybook stories (following our workflow guide)
   - Default with icons
   - Without icons
   - Different segment types
   - Mobile responsive view

3. [ ] Implement minimum code to pass tests
   - Create BreadcrumbIcon component
   - Update Breadcrumbs to include icons
   - Add accessibility labels

4. [ ] Create test harness pages (/dev/breadcrumb-icons)
   - Interactive testing with navigation
   - Theme switching test
   - Mobile view test

5. [ ] Integration testing
   - Test in actual navigation flows
   - Verify with real world/character data
   - Check performance impact

Existing Utilities to Leverage:
- /src/utils/routeUtils.ts: Already has segment building logic
- /src/lib/utils/classNames.ts: cn() utility for conditional styling
- getTestId() in Breadcrumbs.tsx: Already determines segment types

Files to Modify:
- src/components/Navigation/Breadcrumbs.tsx: Add icon rendering
- src/components/Navigation/Breadcrumbs.stories.tsx: Add icon stories
- src/components/Navigation/__tests__/Breadcrumbs.test.tsx: Update tests

Files to Create:
- src/components/Navigation/BreadcrumbIcon.tsx: Icon component
- src/components/Navigation/__tests__/BreadcrumbIcon.test.tsx: Icon tests
- src/app/dev/breadcrumb-icons/page.tsx: Test harness page

TEST PLAN
1. Unit Tests:
   - Icon renders for home segment
   - Icon renders for world segment  
   - Icon renders for character segment
   - No icon for generic segments
   - Accessibility labels present
   - showIcons prop controls visibility

2. Storybook Stories:
   - Default (with icons)
   - Without icons (showIcons=false)
   - All segment types
   - Mobile view (maxItems=2)
   - Loading states
   - Theme variants

3. Test Harness:
   - Navigate between pages to test icon updates
   - Toggle icons on/off
   - Test theme switching
   - Mobile responsive testing

4. Integration Tests:
   - Icons appear in real navigation flows
   - Performance with multiple breadcrumbs
   - Accessibility with screen readers

SUCCESS CRITERIA
- [x] World segments display a globe icon
- [x] Character segments display a person icon
- [x] Home segment displays a home icon
- [x] Icons are properly sized and aligned with text (16x16px, inline)
- [x] Icons have appropriate aria-labels
- [x] Icons work in light/dark themes
- [x] Mobile view maintains icon visibility
- [x] Stories follow 'Narraitor/Navigation/Breadcrumbs' naming

TECHNICAL NOTES
- Use inline SVGs for icons (no external dependencies)
- Icons should be 16x16px to match text size
- Use currentColor for theme compatibility
- Add 4px spacing between icon and text
- Icons should not increase breadcrumb height
- Consider using existing SVGs from public/ if suitable

OUT OF SCOPE
- Custom icons for different world types
- Animated or interactive icons
- Icon customization by users
- External icon library integration
- Icon tooltips or hover effects

FUTURE TASKS
- [ ] Add icons to other navigation elements
- [ ] Create icon system/library for consistency
- [ ] Consider icon animations on route change
- [ ] Add custom world type icons (post-MVP)