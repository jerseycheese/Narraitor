# Accessibility Reference (WCAG 2.1 AA)

Use this when reviewing UI components.

## Buttons and links
- Provide accessible names (visible text or `aria-label`).
- Avoid generic labels like "click here".
- Icon-only buttons must have `aria-label`.

## Forms
- Associate inputs with `<Label htmlFor>` or `aria-labelledby`.
- Connect errors with `aria-describedby` and set `aria-invalid`.
- Do not rely on placeholder-only labels.

## Dialogs and modals
- Use shadcn/ui Dialog for focus trapping and escape handling.
- Ensure title/description are present.

## Keyboard support
- All interactive elements must be reachable via Tab.
- Custom clickable elements need keyboard handlers or should be replaced with Buttons.

## Images
- Meaningful images need descriptive `alt` text.
- Decorative images should use `alt=""` and `aria-hidden`/`role="presentation"`.

## Headings and landmarks
- Use semantic heading order (no skipping levels).
- Ensure a main landmark exists (`<main id="main-content">`).

## Status updates
- Use `aria-live` regions for async status messages.
- Use `role="status"` for loading announcements.

## Contrast and focus
- Ensure text contrast >= 4.5:1; UI elements >= 3:1.
- Focus indicators must remain visible.

## Helpful locations
- Skip links: `src/components/shared/SkipLinks.tsx`
- Layout main landmark: `src/app/layout.tsx`
