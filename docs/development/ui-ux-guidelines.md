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

Accessibility isn't optional or a nice-to-have. It's about making sure everyone can use the app, regardless of how they interact with it. Screen readers, keyboard-only navigation, and visual accommodations should all work without extra effort.

### Keyboard Navigation

Everything needs to work without a mouse. Tab through the interface in a logical order, use skip links to jump past repetitive navigation, and make sure there are keyboard shortcuts for common actions. If someone can't click a button with their mouse, they should be able to hit it with Enter or Space.

### Screen Reader Support

Use semantic HTML - proper headings, landmarks, and structure - so screen readers can navigate the page. Add ARIA labels and roles for complex interactions that HTML alone doesn't cover well. Every image and icon needs meaningful alt text (not "image" or "icon"). Dynamic content changes need live region announcements so screen reader users know something updated.

Forms need proper labeling with clear error associations. If a field has an error, the screen reader should tell you what's wrong, not just "invalid."

### Visual Accessibility

Text contrast needs to meet 4.5:1 minimum ratio. Focus indicators should be visible in all themes - people need to see where they are when tabbing. Don't rely on color alone to convey information (like red/green for success/failure). Text should resize without breaking layouts, up to 200% zoom at least.

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

Performance is about perception as much as actual speed. Users tolerate loading times better when they know something's happening and the interface feels responsive.

### Make Loading Feel Fast

Use skeleton screens instead of spinners when you can - seeing the layout load makes it feel faster than a blank screen with a spinner. Fade transitions between content changes feel smoother than instant swaps. Render above-the-fold content first, defer the stuff below the scroll.

Optimistic UI updates make the app feel instant. When someone clicks "save character," update the UI immediately and only show an error if it actually fails. Most operations succeed, so waiting for confirmation every time makes everything feel sluggish.

### Handle Large Lists Efficiently

Virtualize large lists like journal entries or character rosters. Rendering 1000 items when the user can see 10 is wasteful. Load images progressively or lazily - don't block the initial render waiting for profile pictures. Defer non-critical UI elements and use pagination when it makes sense.

### Optimize Rendering

Memoize complex components so they don't re-render unnecessarily. Batch list operations instead of updating one item at a time. Lazy load historical content - old journal entries don't need to load until someone scrolls to them.

Use performance monitoring during development to catch issues early. React DevTools Profiler shows you which components are re-rendering too often.

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
