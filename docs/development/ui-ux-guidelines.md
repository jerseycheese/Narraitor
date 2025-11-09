---
title: UI/UX Guidelines
aliases: [User Interface Guidelines, Design Guidelines]
tags: [narraitor, design, ui, ux, guidelines]
created: 2025-04-29
updated: 2025-04-29
---

# UI/UX Guidelines

This the UI approach here is about creating immersive experiences that adapt to different fictional worlds while staying accessible and responsive. The challenge is balancing thematic consistency with usability.

## Design Philosophy

**World-Adaptive Design** - The UI should feel appropriate to the fictional setting. A noir detective world gets different typography and colors than a space opera setting. But the underlying structure and usability patterns stay consistent.

**Responsive & Accessible** - Works on all screen sizes with keyboard navigation, screen reader support, and proper contrast. Mobile-first approach because touch interactions are often simpler to design for.

**Progressive Disclosure** - Don't overwhelm users with everything at once. Show what's needed for the current task, with clear paths to more complex functionality when needed.

**Intuitive Flow** - Users should understand what to do next without reading documentation. Good design guides behavior through visual hierarchy and familiar patterns.

## World Theming

### Theme Components
Each world theme includes:
- Primary and secondary colors
- Typography settings (font family, sizes, weights)
- Background textures or colors
- UI element styling (buttons, cards, inputs)
- Specialized iconography

### Theme Implementation
- Theme context provides current theme settings
- Theme-aware components adapt styling based on context
- Tailwind CSS classes dynamically applied
- CSS variables for theme-specific values

### Default Themes
The application includes these template themes:
1. **Western**: Rustic with serif fonts, earthy colors, and aged paper textures
2. **Sitcom**: Modern with clean sans-serif, bright colors, and minimal styling
3. **Adventure**: Fantasy with decorative fonts, rich colors, and ornate styling

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
Narrative text needs to be readable for long sessions without straining the eyes. The formatting should enhance the story, not get in the way.

Typography stays clear and legible, with options for users to adjust size to their comfort. Paragraphs get enough space between them to feel distinct without breaking the flow of reading. Speech gets distinguished from descriptive text through indentation, italics, or other thematic styling depending on the world. The overall presentation adapts to the world's theme, but readability comes first.

#### Text Formatting Guidelines
The formatting approach keeps things consistent and accessible. Paragraphs are separated by double line breaks in the source text, which translates to vertical spacing of at least `1.5rem`. Maximum width is constrained to `56rem` (896px) to keep line lengths comfortable.

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

### Theme System
1. Define theme interface and default themes
2. Create theme context provider
3. Implement theme-aware component styling
4. Add theme switching capability
5. Persist theme preferences

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
