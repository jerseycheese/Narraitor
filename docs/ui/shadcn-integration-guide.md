# shadcn/ui Integration Guide

## Overview
This guide documents the integration of shadcn/ui component library into the Narraitor project, providing a foundation for accessible, themeable UI components.

## Setup Completed

### 1. Dependencies Installed
```bash
npm install clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-slot
```

### 2. Tailwind Configuration
- Created `tailwind.config.ts` with shadcn/ui compatibility
- Added CSS variables for theming in `src/app/globals.css`
- Maintains compatibility with Tailwind CSS v4

### 3. Utility Functions
- Created `src/lib/utils/cn.ts` for className merging using `clsx` and `tailwind-merge`

### 4. Component Structure
- Established `/src/components/ui/` directory for shadcn/ui components
- Created Button component as proof of concept
- Added Storybook stories following Narraitor naming convention

## Using shadcn/ui Components

### Basic Usage
```tsx
import { Button } from '@/components/ui/button'

function MyComponent() {
  return (
    <div>
      <Button>Click me</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  )
}
```

### Available Button Variants
- `default` - Primary button styling
- `destructive` - For destructive actions
- `outline` - Outlined button
- `secondary` - Secondary styling
- `ghost` - Minimal styling
- `link` - Link-style button

### Available Button Sizes
- `default` - Standard size
- `sm` - Small size
- `lg` - Large size
- `icon` - Icon-only button

## CSS Variables System

### Default Theme Variables
The following CSS variables are available for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

### Dark Mode Support
Dark mode variables are included and can be activated with the `dark` class on the HTML element.

## Testing

### Development Testing
- Test page available at `/dev/shadcn-test`
- Demonstrates all button variants and integration
- Validates CSS variables and styling

### Storybook Integration
- Button stories created at `/src/components/ui/Button.stories.tsx`
- Follows Narraitor naming convention: `Narraitor/UI/Button`
- All variants and states documented

### Regression Testing
- All existing component tests pass
- No breaking changes to existing functionality
- Build process successful with new dependencies

## Migration Strategy

### For Future Components
1. Install component using manual creation (adapted for Tailwind v4)
2. Create Storybook stories following naming convention
3. Test integration with existing styles
4. Document any custom modifications needed

### Existing Components
- Keep existing components as-is initially
- Gradually migrate to shadcn/ui equivalents in separate issues
- Maintain parallel implementations during transition

## File Structure
```
src/
├── components/
│   └── ui/
│       ├── button.tsx        # Button component
│       ├── Button.stories.tsx # Storybook stories
│       └── index.ts          # Exports
├── lib/
│   └── utils/
│       └── cn.ts             # Utility function
└── app/
    ├── globals.css           # CSS variables
    └── dev/
        └── shadcn-test/      # Test page
            └── page.tsx
```

## Troubleshooting

### Build Issues
- Ensure Tailwind CSS v4 compatibility
- Check that all dependencies are installed
- Verify CSS variables are properly defined

### Styling Issues
- Use browser dev tools to inspect CSS variable values
- Check that `cn()` utility is being used for className merging
- Verify Tailwind classes are being generated

### Component Issues
- Check that components are imported from correct path
- Ensure all required props are provided
- Verify TypeScript types are correct

## Related Issues
- **Parent Epic**: #499 (Modern UI Component System)
- **Next Steps**: #501 (Command Palette), #502 (Dialogs), #503 (Form Migration)

## Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)