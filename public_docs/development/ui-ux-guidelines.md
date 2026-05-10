---
title: UI/UX Guidelines
aliases: [User Interface Guidelines, Design Guidelines]
tags: [narraitor, design, ui, ux, guidelines]
created: 2025-04-29
updated: 2025-06-15
---

# UI/UX Guidelines

UI approach: create immersive experiences that adapt to different fictional worlds while staying accessible and responsive. Balance thematic consistency with usability.

## Design Philosophy

**World-Adaptive Design** - The UI should feel appropriate to the fictional setting. A noir detective world gets different typography and colors than a space opera setting. But the underlying structure and usability patterns stay consistent.

**Responsive & Accessible** - Works on all screen sizes with keyboard navigation, screen reader support, and proper contrast. Mobile-first approach because touch interactions are often simpler to design for.

**Progressive Disclosure** - Don't overwhelm users with everything at once. Show what's needed for the current task, with clear paths to more complex functionality when needed.

**Intuitive Flow** - Users should understand what to do next without reading documentation. Good design guides behavior through visual hierarchy and familiar patterns.

## Design Systems

Three design systems ship with the app, each providing a complete set of CSS custom properties for light and dark mode. Users switch between them via the theme picker in the navigation bar.

### DS1 — "The Drafting Table"
Sharp lines, archival ink, graph paper grid. Technical and precise.
- **Fonts**: Lora (narrative), IBM Plex Mono (system), IBM Plex Sans (interface)
- **Accent**: Archival Ink Blue `rgb(49 46 129)`
- **Radius**: `0.5rem` — square and deliberate
- **Background**: Mechanical drafting grid (72x72px)

### DS2 — "Warm Earth"
Organic earth tones, soft forms, breathing space. Welcoming and grounded.
- **Fonts**: Crimson Pro (narrative), JetBrains Mono (system), Manrope (interface)
- **Accent**: Sage Green `rgb(124 139 111)`
- **Radius**: `0.75rem` — soft and rounded
- **Background**: Clean solid (no pattern)

### DS3 — "Mechanical Manuscript"
Aged paper, drafting ink, dot grid aesthetic. Textured and literary.
- **Fonts**: Newsreader (narrative), Fira Code (system), DM Sans (interface)
- **Accent**: Steel Blue `rgb(91 122 140)`
- **Radius**: `0.375rem` — tight and compact
- **Background**: Dot grid (24x24px)

### Theme Implementation
- `ThemeProvider` React context manages the active design system and color scheme
- `data-theme` attribute on `<html>` selects which CSS token set is active
- `.dark` class on `<html>` toggles dark mode overrides
- Components consume tokens via `var(--token-name)` — no theme-specific logic in components
- FOUC prevention script applies stored preferences before React hydrates
- Preferences persist in `localStorage` (`narraitor-theme`, `narraitor-color-scheme`)

See [design-tokens.md](../design-system/design-tokens.md) for the full token reference and [global-styles.md](../design-system/global-styles.md) for the `useTheme()` API.

## Component Design

### Interactive Elements
- **Buttons**: Clear states (default, hover, active, disabled) with proper ARIA attributes
- **Inputs**: Consistent styling with clear focus states and proper labeling
- **Selectors**: Accessible dropdown and radio/checkbox inputs with keyboard navigation
- **Cards**: Consistent formatting for content containers using semantic HTML
- **Collapsible Sections**: Proper `aria-expanded` and `aria-controls` for expandable content
- **Alerts & Warnings**: Use `role="alert"` and `aria-live` for dynamic notifications

### Critical UI Patterns
- **Forms**: Consistent layout with inline validation
- **Navigation**: Clear hierarchy and current location indicators
- **Lists**: Virtualized for performance with large datasets
- **Modals**: Focused, accessible dialog patterns
- **Notifications**: Non-intrusive but visible messaging

## Responsive Breakpoints

```css
/* Small (mobile) */
@media (min-width: 640px) { ... }

/* Medium (tablet) */
@media (min-width: 768px) { ... }

/* Large (laptop) */
@media (min-width: 1024px) { ... }

/* X-Large (desktop) */
@media (min-width: 1280px) { ... }
```

## Accessibility Requirements

Accessibility isn't optional. Everyone needs to be able to use the app.

### Keyboard Navigation

Everything works without a mouse. Logical tab order, skip links for navigation, keyboard shortcuts for common actions. Buttons respond to Enter or Space.

### Screen Reader Support

Use semantic HTML (headings, landmarks) for navigation. Add ARIA labels for complex interactions. Every image needs real alt text, not "image" or "icon". Dynamic updates need live region announcements.

Forms get proper labels and error associations. Errors say what's wrong, not just "invalid."

### Visual Accessibility

4.5:1 minimum text contrast. Visible focus indicators in all themes. No color-only information (red/green for status). Text resizes to 200% without breaking.

## Game Session Interface

The game session interface follows specific guidelines:

### Narrative Display
Readable for long sessions. Clear typography with size adjustment options. Paragraphs spaced distinctly. Speech distinguished from description. Readability over theme.

#### Text Formatting Guidelines
Paragraphs separated by double line breaks (`1.5rem` spacing minimum). Max width `56rem` for comfortable line lengths.

For emphasis, italic text gets wrapped in `<em>` tags and bold text in `<strong>` tags. This ensures screen readers and assistive tech can interpret the meaning correctly. All formatted text meets WCAG 2.1 AA contrast standards and stays readable at 200% zoom.

### Decision Selection
- Clear, distinguishable options
- Equal visual weight to each option (unless intentionally weighted)
- Clear selection and hover states
- Sufficient spacing between options
- Appropriate feedback for user choices

### Character Information
- Access to relevant character details
- Non-intrusive display of important stats
- Collapsible sections for detailed information
- Visual indicators for character state changes
- Information hierarchy reflects importance

## Performance Guidelines

Performance is about perception. Users tolerate loading when they see progress and the UI feels responsive.

### Make Loading Feel Fast

Skeleton screens beat spinners - seeing layout load feels faster. Fade transitions feel smoother than instant swaps. Render above-the-fold first.

Optimistic updates make things feel instant. Update UI immediately, rollback on error. Waiting for confirmation makes everything sluggish.

### Handle Large Lists

Virtualize lists. Rendering 1000 items when 10 are visible is wasteful. Lazy load images. Defer non-critical UI. Paginate when it makes sense.

### Optimize Rendering

Memoize complex components. Batch list operations. Lazy load historical content.

Use React DevTools Profiler to catch re-render issues.

## Implementation Approach

### Component Development
1. Create base components in Storybook first
2. Implement theme-aware styling
3. Test accessibility with axe or similar tools
4. Verify responsive behavior
5. Integrate into application

### Theme-Aware Development
1. Add new tokens to all 3 theme CSS files (`ds1.css`, `ds2.css`, `ds3.css`) — both light and dark blocks
2. Consume tokens in component CSS via `var(--token-name)`
3. Use semantic Tailwind classes (`bg-primary`, `text-muted-foreground`) for shadcn/ui-integrated components
4. Test across all 6 combinations (3 design systems x 2 color schemes)
5. Verify WCAG contrast in both light and dark mode

## Consistent Design Patterns

### Error States
- Clear visual indication of errors
- Helpful error messages
- Guidance on how to resolve issues
- Consistent error presentation

### Loading States
- Consistent loading indicators
- Appropriate feedback during long operations
- Non-blocking UIs during loading
- Graceful failure handling

### Empty States
- Helpful guidance when lists are empty
- Clear calls to action
- Context-appropriate illustrations or icons
- Informative messaging for users

## Related Documents
- [[technical-approach|Technical Approach]]
- [[feature-development-workflow|Feature Development Workflow]]
- [[testing-workflow|Testing Workflow]]
