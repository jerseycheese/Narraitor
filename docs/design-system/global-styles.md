# Narraitor Global Styles

This document explains the global styling system implemented for the Narraitor application. The system provides a wireframe-like foundation for MVP development while setting up an extensible structure for future theming.

## CSS Architecture

The global styles use Tailwind CSS v4 as a foundation and are organized into several key sections:

1. **CSS Variables**: Core variables for colors, typography, spacing, and design elements
2. **Base Styles**: Default styling for HTML elements
3. **Component Classes**: Minimal reusable component styles
4. **Utility Classes**: Essential utility helpers

## CSS Variables

### Colors
- `--color-background`: Page background (#ffffff)
- `--color-foreground`: Text color (#171717)
- `--color-primary`: Primary action color (#2563eb)
- `--color-secondary`: Secondary accent color (#4f46e5)
- `--color-accent`: Highlighting color (#f97316)
- `--color-muted`: Subtle text color (#6b7280)
- `--color-border`: Border color (#e5e7eb)

### Typography
- `--font-sans`: Sans-serif font stack
- `--font-serif`: Serif font stack
- `--font-mono`: Monospace font stack

### Spacing
- `--space-1` through `--space-16`: Consistent spacing scale

### Design Elements
- `--radius-sm`, `--radius-md`, `--radius-lg`: Border radius values
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`: Box shadow values

## Using CSS Variables in Components

Our CSS variables can be used directly in JSX component styles or in CSS files. Here are some examples:

### Style Guidelines

**Important: No Inline Styles**
- Always use Tailwind CSS utility classes for styling
- Never use inline styles (style prop) in components
- If Tailwind doesn't provide what you need, create a custom CSS class
- This ensures consistency and maintainability across the codebase

### In Tailwind Classes

```tsx
// Example of using Tailwind classes - PREFERRED approach
const CustomButton = ({ children }) => {
  return (
    <button className="bg-blue-600 px-4 py-2 rounded-md text-white hover:bg-blue-700">
      {children}
    </button>
  );
};
```

### In CSS/SCSS Files

```css
/* Example of using CSS variables in a component CSS file */
.customCard {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.customCard:hover {
  box-shadow: var(--shadow-lg);
}
```

### With Tailwind CSS

Always use Tailwind classes for styling - no inline styles:

```tsx
// Example using only Tailwind classes
const InfoPanel = ({ title, children }) => {
  return (
    <div className="p-4 mb-4 rounded-md bg-purple-600 text-white">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
};
```

If you need to use CSS variables, create a custom CSS class instead of using inline styles.

## Semantic HTML

The global styles are designed to work with semantic HTML elements, improving accessibility and SEO. Key semantic elements include:

- `<main>`: Primary content area
- `<header>`: Introductory content
- `<footer>`: Footer content
- `<section>`: Standalone sections
- `<article>`: Self-contained compositions
- `<nav>`: Navigation sections
- Proper heading hierarchy (`<h1>` through `<h6>`)

## Custom Components

A minimal set of component classes is included:

- `.card`: Card container with border and shadow
- `.form-group`: Form field container
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`: Button variants

Example usage:

```tsx
const CardExample = () => {
  return (
    <div className="card">
      <h2>Card Title</h2>
      <p>Card content goes here.</p>
      <button className="btn btn-primary">Primary Action</button>
      <button className="btn btn-secondary">Secondary Action</button>
    </div>
  );
};
```

## Utility Classes

Essential utility classes for common needs:

- `.text-balanced`: Balanced text wrapping
- `.visually-hidden`: Hide content visually but keep it accessible to screen readers
- `.focus-visible`: Enhanced focus styling for accessibility

Example usage:

```tsx
// Example of using utility classes
const AccessibleComponent = () => {
  return (
    <div>
      <span className="visually-hidden">This text is only visible to screen readers</span>
      <p className="text-balanced">This text will have balanced wrapping for better readability</p>
      <button className="focus-visible">This button has enhanced focus styling</button>
    </div>
  );
};
```

## Future Theming

The CSS variable structure provides a foundation for future theming. To implement theming in the future:

1. Create theme CSS files with custom variable values
2. Apply theme classes to the root element
3. Define theme variable values within the appropriate selectors

## Testing and Development

The global styles can be viewed and tested through the `GlobalStylesDemo` component in Storybook, which demonstrates all styled elements.