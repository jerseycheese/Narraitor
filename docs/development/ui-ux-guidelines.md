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

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order through the interface
- Skip links for navigation
- Keyboard shortcuts for common actions

### Screen Reader Support
- Semantic HTML structure with proper headings and landmarks
- ARIA labels, roles, and properties for complex interactions
- Meaningful alt text for images and icons
- Live region announcements for dynamic content
- Descriptive `aria-expanded`, `aria-controls`, and `aria-labelledby` attributes
- Proper form labeling and error associations

### Visual Accessibility
- Minimum contrast ratio of 4.5:1 for text
- Focus indicators visible in all themes
- No reliance on color alone for information
- Resizable text without breaking layouts

## Game Session Interface

The game session interface follows specific guidelines:

### Narrative Display
The approach to displaying narrative content is all about readability and immersion. The text needs to be easy on the eyes for long reading sessions, and the formatting should enhance the storytelling, not distract from it.

- **Typography**: The typography needs to be clear and legible, with options for users to adjust the size to their comfort.
- **Spacing**: Paragraphs should have enough space between them to be distinct, but not so much that it breaks the flow of reading.
- **Dialogue**: Speech should be clearly distinguished from descriptive text, whether through indentation, italics, or other thematic styling.
- **Theming**: The overall presentation should adapt to the world's theme, but the core readability principles must always be maintained.

#### Text Formatting Guidelines
To keep the narrative content consistent and accessible, the system follows a few key rules for text presentation.

- **Paragraphs**: Paragraphs are separated by a double line break in the source text, which translates to a vertical spacing of at least `1.5rem`. The maximum width is constrained to `56rem` (896px) to ensure comfortable line lengths.
- **Emphasis**: The system uses semantic HTML tags for emphasis. Italic text is wrapped in `<em>` tags, and bold text is wrapped in `<strong>` tags. This ensures that screen readers and other assistive technologies can correctly interpret the meaning.
- **Accessibility**: All formatted text is designed to meet WCAG 2.1 AA contrast standards, and it remains readable at 200% zoom.

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

### User Perception Optimizations
- Implement skeleton screens for loading states
- Use fade transitions for smoother content changes
- Prioritize above-the-fold content rendering
- Implement optimistic UI updates
- Provide immediate feedback for user actions

### Virtualization
- Virtualize large lists (journal entries, character lists)
- Load images progressively or lazily
- Defer non-critical UI elements
- Use pagination for large datasets
- Apply efficient rendering for long content

### Rendering Optimization
- Use memoized components for complex UI elements
- Implement efficient context window management
- Apply batch processing for list operations
- Implement lazy loading for historical content
- Use performance monitoring during development

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
