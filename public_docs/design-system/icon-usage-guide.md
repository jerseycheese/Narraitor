# Icon Usage Guide

## Overview

Icons should be consistent, accessible, and professional throughout the app. That means no emojis as icons - we use lucide-react for everything. This guide covers how to pick the right icon, size it properly, and make it accessible.

> **Note on the code examples below.** Tailwind was removed in the design-system migration (`#1097`), so the `className="w-4 h-4"` / `text-*-500` sizing-and-color classes shown here no longer apply. Size a lucide icon with the `size` prop (e.g. `<Star size={12} />`) and let color come from `currentColor` / a CSS class that sets `color: var(--token)`. The examples have been updated to the `size` prop; treat any leftover color utilities as "set this via CSS instead."

## Icon Library Standards

### Primary Icon System: lucide-react

We chose lucide-react because it solves all the problems emojis create:

- **Accessibility**: Proper React components work with screen readers
- **Consistency**: Vector icons look the same on every device
- **Performance**: Tree-shaking means we only load the icons we use
- **Theming**: Icons inherit colors and work with dark mode
- **Maintenance**: One library, one style, no surprises

### Installation & Import

lucide-react is already installed as a project dependency. Import icons as needed:

```tsx
import { Home, Globe, Star, Plus, Settings } from 'lucide-react'
```

## Sizing Conventions

### Standard Size Classes

Don't guess at icon sizes - we have established patterns for different contexts:

#### **Badge Icons: `w-3 h-3` (12px)**
For compact badge and tag elements where space is limited:

```tsx
<Badge
  icon={<Star size={12} />}
  variant="warning"
>
  Known Figure
</Badge>
```

#### **General UI Icons: `w-4 h-4` (16px)**
For buttons, status indicators, and general interface elements:

```tsx
<Button size="icon">
  <Settings size={16} />
</Button>

// Status indicators
<CheckCircle size={16} />
```

#### **Prominent UI Icons: `w-5 h-5` (20px)**
For larger interface elements and section headers:

```tsx
<Button variant="ghost">
  <Globe size={20} />
  World Settings
</Button>
```

#### **Dialog Icons: 32px**
For prominent modal content:

```tsx
<Trophy size={32} />
```

## Semantic Usage Guidelines

### Navigation Icons

Established patterns for navigation and breadcrumb elements:

```tsx
// Breadcrumb navigation
<Home size={16} />     // Root/home navigation
<Globe size={16} />    // World-specific pages
<User size={16} />     // Character-related pages
```

### Action Icons

Icons for common user actions and interactions:

```tsx
<Plus size={12} />      // Creation actions
<Star size={12} />      // Favorites/known items
<Settings size={16} />  // Configuration
<Trash size={16} />     // Deletion actions
```

### Status Icons

System status and health indicators:

```tsx
<CheckCircle size={16} />     // Success/healthy
<AlertTriangle size={16} />  // Warning/degraded
<XCircle size={16} />           // Error/unavailable
<RotateCcw size={16} /> // Loading/recovering
```

### Game Mechanics Icons

Icons specific to gameplay and narrative elements:

```tsx
<Scale size={16} />       // Lawful alignment choices
<Flame size={16} />       // Chaotic alignment choices
<ChevronRight size={16} /> // Selected choice indicator
<Trophy size={32} />       // Achievements and rewards
```

### World & Character Icons

Icons for world and character categorization:

```tsx
<Globe size={12} />     // "Set Within" world type
<Sparkles size={12} />  // "Inspired By" world type
<Zap size={12} />       // "Original" world type
```

## Color and Theming

### Badge Icons
Always use explicit white text for visibility on colored backgrounds:

```tsx
<Badge
  icon={<Star size={12} />}
  variant="warning"
>
  Known Figure
</Badge>
```

### Status Icons
Use semantic color classes that align with the status meaning:

```tsx
// Success states
<CheckCircle size={16} />

// Warning states
<AlertTriangle size={16} />

// Error states
<XCircle size={16} />

// Loading states
<RotateCcw size={16} />
```

### Neutral Icons
Use default text colors for icons without specific semantic meaning:

```tsx
<Settings size={16} />  // Inherits text color
<Home size={16} />  // Explicit neutral color
```

## Accessibility Guidelines

### Screen Reader Support

Icons should be properly labeled for assistive technologies:

```tsx
// For decorative icons, use aria-hidden
<span aria-hidden="true">
  <Star size={12} />
</span>

// For meaningful icons, provide proper labeling
<span aria-label="Storage status: healthy">
  <CheckCircle size={16} />
</span>

// In interactive elements, ensure proper labeling
<button aria-label="Open settings">
  <Settings size={16} />
</button>
```

### Focus and Interaction

Ensure icons in interactive elements have proper focus states:

Focus styling comes from the component classes rather than utilities, so reach for `Button` with
`size="icon"` instead of hand-rolling a focus ring:

```tsx
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings size={16} />
</Button>
```

### Color Accessibility

Ensure sufficient contrast and don't rely solely on color:

```tsx
// Good: icon shape plus text convey meaning, color is reinforcement
<span>
  <CheckCircle size={16} color="var(--color-success)" />
  Success
</span>

// Avoid: color alone conveys meaning
<span style={{ color: 'var(--color-success)' }}>Success</span>
```

## Implementation Examples

### Badge Component Integration

The Badge component properly supports icon props:

```tsx
import { Badge } from '@/components/ui/badge'
import { Star, Plus, Globe } from 'lucide-react'

// Character type badges
<Badge
  icon={<Star size={12} />}
  variant="warning"
>
  Known Figure
</Badge>

<Badge
  icon={<Plus size={12} />}
  variant="default"
>
  Original
</Badge>

// World type badges
<Badge
  icon={<Globe size={12} />}
  variant="info"
>
  Set in Middle Earth
</Badge>
```

### Button Icons

Icons in button components:

```tsx
import { Button } from '@/components/ui/button'
import { Settings, Plus, Trash } from 'lucide-react'

// Icon-only buttons
<Button size="icon">
  <Settings size={16} />
</Button>

// Buttons with text and icons
<Button className="flex items-center gap-2">
  <Plus size={16} />
  Create New
</Button>

// Destructive actions
<Button variant="destructive" className="flex items-center gap-2">
  <Trash size={16} />
  Delete
</Button>
```

### Status Indicators

Displaying system and component status:

```tsx
import { CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'

// Illustrative, not a component that exists in src/. Colors come from tokens, not utilities.
const StorageStatusIcon = ({ status }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle size={16} color="var(--color-success)" />
    case 'degraded':
      return <AlertTriangle size={16} color="var(--color-warning)" />
    case 'unavailable':
      return <XCircle size={16} color="var(--color-danger)" />
    case 'recovering':
      return <RotateCcw size={16} color="var(--color-info)" />
    default:
      return <HelpCircle className={`${iconClass} text-gray-600`} />
  }
}
```

## Migration from Emojis

### Why Migrate from Emojis

Emojis seem convenient, but they cause real problems in production apps:

- **Inconsistent rendering** - looks different on Mac vs Windows vs mobile
- **Poor accessibility** - screen readers often can't interpret them properly
- **Limited theming** - can't change colors or adapt to dark mode
- **Scaling issues** - look terrible at small or large sizes
- **Professional appearance** - users expect real interface icons, not emojis

### Migration Process

When you find an emoji in the code, here's how to fix it:

1. **Identify the semantic meaning** - what is this emoji actually trying to communicate?
2. **Find appropriate lucide-react icon** that conveys the same meaning
3. **Apply proper sizing** based on context (badge, button, dialog, etc.)
4. **Add appropriate colors** following our semantic color guidelines
5. **Test accessibility** with screen readers

### Common Emoji to Icon Mappings

```tsx
// Achievements and success
'🏆' becomes <Trophy size={32} />
'⭐' becomes <Star size={12} />
'✅' becomes <CheckCircle size={16} />

// Actions and creation
'➕' becomes <Plus size={12} />
'⚙️' becomes <Settings size={16} />
'🗑️' becomes <Trash size={16} />

// World and location types
'🌍' becomes <Globe size={12} />
'✨' becomes <Sparkles size={12} />
'⚡' becomes <Zap size={12} />

// Status and alerts
'⚠️' becomes <AlertTriangle size={16} />
'❌' becomes <XCircle size={16} />
'🔄' becomes <RotateCcw size={16} />

// Alignment and choices
'⚖️' becomes <Scale size={16} />
'🔥' becomes <Flame size={16} />
'➤' becomes <ChevronRight size={16} />
```

## Best Practices

### Do's

- **Use consistent sizing** based on context and component type
- **Import only needed icons** to maintain tree-shaking benefits
- **Apply semantic colors** that match the icon's meaning
- **Provide proper accessibility** labeling for meaningful icons
- **Follow established patterns** documented in this guide

### Don'ts

- **Don't use emojis** for interface icons: use lucide-react instead
- **Don't use arbitrary sizes** - stick to the established sizing scale
- **Don't rely on color alone** to convey meaning
- **Don't forget accessibility** - always consider screen reader users
- **Don't mix icon libraries** - maintain consistency with lucide-react

## Component Integration

### Badge Component

The Badge component is designed to work seamlessly with lucide-react icons:

```tsx
// The icon prop accepts React.ReactNode
<Badge
  icon={<Star size={12} />}
  variant="warning"
>
  Badge Text
</Badge>
```

### Integration with Other Components

Most components should accept icons as React nodes:

```tsx
// Components should follow this pattern
interface MyComponentProps {
  icon?: React.ReactNode
  children: React.ReactNode
}
```

## Related Documentation

- [shadcn/ui Integration Guide](./shadcn-integration-guide.md) - Component library integration
- [UI/UX Guidelines](../development/ui-ux-guidelines.md) - Overall design principles
- [Global Styles](./global-styles.md) - CSS and styling standards

## Future Considerations

### Icon Customization

For future custom icons not available in lucide-react:
1. Create SVG icons following the same sizing patterns
2. Wrap in React components with consistent className APIs
3. Document in this guide with usage examples

### Theme Integration

Icons automatically inherit theme colors through CSS variables. Future theme expansions should:
1. Test icon visibility in all theme variants
2. Ensure sufficient contrast ratios
3. Update semantic color mappings as needed

---

*This guide reflects the established icon patterns in the Narraitor codebase. Some snippets are illustrative rather than lifted from a real component, so check `src/components/` before assuming a named component exists.*