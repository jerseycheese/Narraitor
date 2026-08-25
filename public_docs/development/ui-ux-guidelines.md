---
title: UI/UX Guidelines
aliases: [User Interface Guidelines, Design Guidelines]
tags: [narraitor, design, ui, ux, guidelines]
created: 2025-04-29
updated: 2025-06-15
---

# UI/UX Guidelines

UI approach: the interface adapts to each fictional world while staying accessible and responsive. Balance thematic consistency with usability.

## Design Philosophy

**One Design System** - The app ships one design system, DS3 ("Mechanical Manuscript") — aged paper, drafting ink, dot-grid aesthetic. [ADR-011](../architecture/ADR-011-three-design-systems.md) explains why the app originally shipped three user-chosen systems (DS1/DS2/DS3); [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md) explains why that later collapsed back to one.

**Responsive & Accessible** - Works on all screen sizes with keyboard navigation, screen reader support, and proper contrast. Mobile-first approach because touch interactions are often simpler to design for.

**Progressive Disclosure** - Don't overwhelm users with everything at once. Show what's needed for the current task, with clear paths to more complex functionality when needed.

**Intuitive Flow** - Users should understand what to do next without reading documentation. Good design guides behavior through visual hierarchy and familiar patterns.

## Design System

DS3 ("Mechanical Manuscript") is the app's single design system, providing a complete set of CSS custom properties for light and dark mode. There's no design-system picker anymore — users switch light/dark/system color mode via the Appearance control in the navigation bar (see [ADR-013](../architecture/ADR-013-collapse-to-single-design-system-ds3.md)).

### DS3 — "Mechanical Manuscript"
Aged paper, drafting ink, dot grid aesthetic. Textured and literary.
- **Fonts**: Newsreader (narrative), Fira Code (system), DM Sans (interface)
- **Accent**: Steel Blue `rgb(91 122 140)`
- **Radius**: `--radius-md: 6px` — tight and compact
- **Background**: Dot grid (24x24px)

### Theme Implementation
- `ThemeProvider` React context manages color scheme; design system is fixed to DS3
- CSS tokens are `:root`-scoped in `ds3.css` (the `data-theme="ds3"` attribute on `<html>` remains as a marker only, #1546)
- `.dark` class on `<html>` toggles dark mode overrides
- Components consume tokens via `var(--token-name)` — no theme-specific logic in components
- FOUC prevention script applies the stored color-scheme preference before React hydrates
- Color-scheme preference persists in `localStorage` (`narraitor-color-scheme`)

See [design-tokens.md](../design-system/design-tokens.md) for the full token reference and [global-styles.md](../design-system/global-styles.md) for the `useTheme()` API.

## Component Design

### Action Groups & Buttons
To maintain consistent spacing and unified flexbox behavior across all design systems:
- **Action Groups**: Never use raw floating `<Button>` clusters for toolbars or card footers. Always wrap buttons in the `<ActionButtonGroup>` or `<CardActionGroup>` components.
- **Layout Attributes**: Use `layout="horizontal"` or `layout="vertical"` and `gap="sm" | "md" | "lg"` props on action groups to rely on standard design system space tokens instead of ad-hoc padding/margins.
- **Flexible Primary Actions**: For buttons that should fill available width (like "Play" or "Save"), pass `flex: true` to the action definition. This uses a standardized `flex: 1 1 0%` CSS rule without requiring custom classes.
- **Page-Level Actions**: Place primary page actions (like "Create World" or "Generate Character") inside the `actions` prop of the `<PageLayout>` component. This ensures they align to the top-right of the page header consistently.
- **Segmented Controls**: For view toggles (like grid vs. table), wrap buttons in a `.view-mode-toggle` container and set the buttons to `size="icon"`.

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
1. Add new tokens to `src/lib/theme/themes/ds3.css` (or `_shared-tokens.css` if the value is scheme-independent) — cover both the light `:root` and `:root.dark` blocks. ADR-013 deleted `ds1.css` and `ds2.css`; there's one design system now.
2. Consume tokens in component CSS via `var(--token-name)`
3. Style components with semantic CSS classes that consume design tokens via `var(--token)` — there are no Tailwind utility classes (Tailwind was removed in the design-system migration)
4. Test in both color schemes — light and dark are the whole matrix
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
- Failures leave the player somewhere they can act from

### Empty States
- Helpful guidance when lists are empty
- Clear calls to action
- Context-appropriate illustrations or icons
- Informative messaging for users

## Related Documents
- [[technical-approach|Technical Approach]]
- [[feature-development-workflow|Feature Development Workflow]]
- [[testing-workflow|Testing Workflow]]
