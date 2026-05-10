# shadcn/ui Integration Guide

## Overview
The shadcn/ui integration gives us a solid foundation of accessible, well-designed components that work great with Tailwind CSS. Instead of building everything from scratch, we get professional components that just work.

> **Scope note**: This guide covers the shadcn/ui setup itself — dependencies, the `cn()` utility, button/badge usage. The CSS variables that shadcn components consume are now defined per-theme under `[data-theme="ds1"]`, `[data-theme="ds2"]`, and `[data-theme="ds3"]` selectors rather than a single `:root` block. The CSS Variables section below shows the original single-theme structure and is kept for historical reference; for the current per-theme token surface, see [design-tokens.md](./design-tokens.md) and [ADR-011](../architecture/ADR-011-three-design-systems.md).

## Setup Completed

### 1. Dependencies Installed
```bash
npm install clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-slot
```

### 2. Tailwind Configuration
- Created `tailwind.config.ts` with shadcn/ui compatibility
- Added CSS variables for theming in `src/app/globals.css`
- Uses Tailwind CSS v3 for Storybook compatibility

### 3. Utility Functions
- Created `src/lib/utils/classNames.ts` for className merging using `clsx` and `tailwind-merge`

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

### Icon Integration with Components

The shadcn/ui components play nicely with our lucide-react icon standards:

#### Button with Icons
```tsx
import { Settings, Plus, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Icon-only buttons
<Button size="icon">
  <Settings className="w-4 h-4" />
</Button>

// Buttons with text and icons
<Button className="flex items-center gap-2">
  <Plus className="w-4 h-4" />
  Create New
</Button>

// Destructive actions
<Button variant="destructive" className="flex items-center gap-2">
  <Trash className="w-4 h-4" />
  Delete
</Button>
```

#### Badge with Icons
The Badge component includes built-in icon support:

```tsx
import { Star, Globe, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

<Badge 
  icon={<Star className="w-3 h-3 text-white" />}
  variant="warning"
>
  Known Figure
</Badge>

<Badge 
  icon={<Globe className="w-3 h-3 text-white" />}
  variant="info"
>
  Set in Middle Earth
</Badge>
```

#### Icon Sizing Standards
Follow Narraitor's established icon sizing patterns:
- **Badge icons**: `w-3 h-3` for compact spaces
- **Button icons**: `w-4 h-4` for general UI elements
- **Dialog icons**: `w-8 h-8` for prominent displays

See the [Icon Usage Guide](../design-system/icon-usage-guide.md) for complete standards.

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
Dark mode is fully supported across all three design systems. Each theme file (`ds1.css`, `ds2.css`, `ds3.css`) defines a complete dark-mode override under `[data-theme="ds1"].dark` (and so on). The `ThemeProvider` toggles a `dark` class on `<html>`; no changes needed at the component level.

## Testing

### Development Testing
- Test page available at `/dev/shadcn-test`
- Demonstrates all button variants and integration
- Validates CSS variables and styling

### Storybook Integration
- Button stories created at `src/stories/01-atoms/buttons/Button.stories.tsx`
- Follows Narraitor naming convention: `Narraitor/UI/Button`
- All variants and states documented

### Regression Testing
- All existing component tests pass
- No breaking changes to existing functionality
- Build process successful with new dependencies

## Migration Strategy

### For Future Components
When adding new shadcn/ui components:

1. Install component using manual creation (adapted for Tailwind v3)
2. Create Storybook stories following naming convention
3. Test integration with existing styles
4. Document any custom modifications needed

### Existing Components
We're not throwing away what works:

- Keep existing components as-is initially
- Gradually migrate to shadcn/ui equivalents in separate issues
- Maintain parallel implementations during transition

## File Structure
```
src/
├── components/
│   └── ui/
│       ├── button.tsx        # Button component
│       └── index.ts          # Exports
├── stories/
│   └── 01-atoms/
│       └── buttons/
│           └── Button.stories.tsx # Storybook stories
├── lib/
│   └── utils/
│       └── classNames.ts     # Utility function
└── app/
    ├── globals.css           # CSS variables
    └── dev/
        └── shadcn-test/      # Test page
            └── page.tsx
```

## Troubleshooting

### Build Issues
Common build problems and fixes:

- Ensure Tailwind CSS v3 compatibility
- Check that all dependencies are installed
- Verify CSS variables are properly defined

### Styling Issues
When components don't look right:

- Use browser dev tools to inspect CSS variable values
- Check that `cn()` utility is being used for className merging
- Verify Tailwind classes are being generated

### Component Issues
When components don't work as expected:

- Check that components are imported from correct path
- Ensure all required props are provided
- Verify TypeScript types are correct

## Related Issues
- **Parent Epic**: #499 (Modern UI Component System)
- **Next Steps**: #501 (Command Palette), #502 (Dialogs), #503 (Form Migration)

## Accessibility
shadcn/ui components come with good accessibility built-in, but there are still rules to follow:

- DialogTitle must be a direct child of DialogContent (not nested in DialogHeader)
- Proper ARIA labeling with aria-labelledby and aria-describedby
- Keyboard navigation support and focus management
- Screen reader compatibility with proper announcements

## Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v3 Documentation](https://v3.tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
