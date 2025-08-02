# Icon Usage Guide

## Overview

This guide establishes standards for icon usage throughout the Narraitor application. All icons should use the lucide-react library to ensure consistency, accessibility, and themeable integration with our design system.

## Icon Library Standards

### Primary Icon System: lucide-react

**Why lucide-react:**
- **Accessibility**: Proper React components provide better screen reader support than emojis
- **Consistency**: Vector-based icons that scale perfectly at all sizes
- **Performance**: Tree-shaking friendly imports reduce bundle size
- **Theming**: Icons inherit CSS colors and respect dark/light mode themes
- **Maintenance**: Single source of truth for all icon usage

### Installation & Import

lucide-react is already installed as a project dependency. Import icons as needed:

```tsx
import { Home, Globe, Star, Plus, Settings } from 'lucide-react'
```

## Sizing Conventions

### Standard Size Classes

Follow these established sizing patterns based on context:

#### **Badge Icons: `w-3 h-3` (12px)**
For compact badge and tag elements where space is limited:

```tsx
<Badge 
  icon={<Star className="w-3 h-3 text-white" />} 
  variant="warning"
>
  Known Figure
</Badge>
```

#### **General UI Icons: `w-4 h-4` (16px)**
For buttons, status indicators, and general interface elements:

```tsx
<Button size="icon">
  <Settings className="w-4 h-4" />
</Button>

// Status indicators
<CheckCircle className="w-4 h-4 text-green-600" />
```

#### **Prominent UI Icons: `w-5 h-5` (20px)**
For larger interface elements and section headers:

```tsx
<button className="flex items-center gap-2">
  <Globe className="w-5 h-5" />
  World Settings
</button>
```

#### **Dialog Icons: `w-8 h-8` (32px)**
For achievement dialogs and prominent modal content:

```tsx
<AchievementDialog 
  icon={<Trophy className="w-8 h-8" />}
  title="Achievement Unlocked!"
/>
```

## Semantic Usage Guidelines

### Navigation Icons

Established patterns for navigation and breadcrumb elements:

```tsx
// Breadcrumb navigation
<Home className="w-4 h-4" />     // Root/home navigation
<Globe className="w-4 h-4" />    // World-specific pages  
<User className="w-4 h-4" />     // Character-related pages
```

### Action Icons

Icons for common user actions and interactions:

```tsx
<Plus className="w-3 h-3" />      // Creation actions
<Star className="w-3 h-3" />      // Favorites/known items
<Settings className="w-4 h-4" />  // Configuration
<Trash className="w-4 h-4" />     // Deletion actions
```

### Status Icons

System status and health indicators:

```tsx
<CheckCircle className="w-4 h-4 text-green-600" />     // Success/healthy
<AlertTriangle className="w-4 h-4 text-yellow-600" />  // Warning/degraded
<XCircle className="w-4 h-4 text-red-600" />           // Error/unavailable
<RotateCcw className="w-4 h-4 text-blue-600 animate-spin" /> // Loading/recovering
```

### Game Mechanics Icons

Icons specific to gameplay and narrative elements:

```tsx
<Scale className="w-4 h-4" />       // Lawful alignment choices
<Flame className="w-4 h-4" />       // Chaotic alignment choices  
<ChevronRight className="w-4 h-4" /> // Selected choice indicator
<Trophy className="w-8 h-8" />       // Achievements and rewards
```

### World & Character Icons

Icons for world and character categorization:

```tsx
<Globe className="w-3 h-3" />     // "Set Within" world type
<Sparkles className="w-3 h-3" />  // "Inspired By" world type  
<Zap className="w-3 h-3" />       // "Original" world type
```

## Color and Theming

### Badge Icons
Always use explicit white text for visibility on colored backgrounds:

```tsx
<Badge 
  icon={<Star className="w-3 h-3 text-white" />}
  variant="warning"
>
  Known Figure
</Badge>
```

### Status Icons
Use semantic color classes that align with the status meaning:

```tsx
// Success states
<CheckCircle className="w-4 h-4 text-green-600" />

// Warning states  
<AlertTriangle className="w-4 h-4 text-yellow-600" />

// Error states
<XCircle className="w-4 h-4 text-red-600" />

// Loading states
<RotateCcw className="w-4 h-4 text-blue-600 animate-spin" />
```

### Neutral Icons
Use default text colors for icons without specific semantic meaning:

```tsx
<Settings className="w-4 h-4" />  // Inherits text color
<Home className="w-4 h-4 text-gray-600" />  // Explicit neutral color
```

## Accessibility Guidelines

### Screen Reader Support

Icons should be properly labeled for assistive technologies:

```tsx
// For decorative icons, use aria-hidden
<span aria-hidden="true">
  <Star className="w-3 h-3" />
</span>

// For meaningful icons, provide proper labeling
<span aria-label="Storage status: healthy">
  <CheckCircle className="w-4 h-4 text-green-600" />
</span>

// In interactive elements, ensure proper labeling
<button aria-label="Open settings">
  <Settings className="w-4 h-4" />
</button>
```

### Focus and Interaction

Ensure icons in interactive elements have proper focus states:

```tsx
<button className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
  <Settings className="w-4 h-4" />
</button>
```

### Color Accessibility

Ensure sufficient contrast and don't rely solely on color:

```tsx
// Good: Color + icon shape convey meaning
<div className="flex items-center gap-2">
  <CheckCircle className="w-4 h-4 text-green-600" />
  <span>Success</span>
</div>

// Avoid: Color alone conveys meaning
<div className="text-green-600">Success</div>
```

## Implementation Examples

### Badge Component Integration

The Badge component properly supports icon props:

```tsx
import { Badge } from '@/components/ui/badge'
import { Star, Plus, Globe } from 'lucide-react'

// Character type badges
<Badge 
  icon={<Star className="w-3 h-3 text-white" />}
  variant="warning"
>
  Known Figure
</Badge>

<Badge 
  icon={<Plus className="w-3 h-3 text-white" />}
  variant="default"
>
  Original
</Badge>

// World type badges
<Badge 
  icon={<Globe className="w-3 h-3 text-white" />}
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

### Status Indicators

Displaying system and component status:

```tsx
import { CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'

const StorageStatusIcon = ({ status }) => {
  const iconClass = "w-4 h-4"
  
  switch (status) {
    case 'healthy':
      return <CheckCircle className={`${iconClass} text-green-600`} />
    case 'degraded':
      return <AlertTriangle className={`${iconClass} text-yellow-600`} />
    case 'unavailable':
      return <XCircle className={`${iconClass} text-red-600`} />
    case 'recovering':
      return <RotateCcw className={`${iconClass} text-blue-600 animate-spin`} />
    default:
      return <HelpCircle className={`${iconClass} text-gray-600`} />
  }
}
```

## Migration from Emojis

### Why Migrate from Emojis

Emojis have several limitations in professional applications:
- **Inconsistent rendering** across different operating systems and browsers
- **Poor accessibility** for screen readers and assistive technologies
- **Limited theming** support: can't change colors or respond to dark mode
- **Scaling issues** at different sizes
- **Professional appearance** concerns in business applications

### Migration Process

When replacing emoji icons:

1. **Identify the semantic meaning** of the emoji
2. **Find appropriate lucide-react icon** that conveys the same meaning
3. **Apply proper sizing** based on context (badge, button, dialog, etc.)
4. **Add appropriate colors** following our semantic color guidelines
5. **Test accessibility** with screen readers

### Common Emoji to Icon Mappings

```tsx
// Achievements and success
'🏆' → <Trophy className="w-8 h-8" />
'⭐' → <Star className="w-3 h-3 text-white" />
'✅' → <CheckCircle className="w-4 h-4 text-green-600" />

// Actions and creation
'➕' → <Plus className="w-3 h-3 text-white" />
'⚙️' → <Settings className="w-4 h-4" />
'🗑️' → <Trash className="w-4 h-4" />

// World and location types  
'🌍' → <Globe className="w-3 h-3 text-white" />
'✨' → <Sparkles className="w-3 h-3 text-white" />
'⚡' → <Zap className="w-3 h-3 text-white" />

// Status and alerts
'⚠️' → <AlertTriangle className="w-4 h-4 text-yellow-600" />
'❌' → <XCircle className="w-4 h-4 text-red-600" />
'🔄' → <RotateCcw className="w-4 h-4 text-blue-600 animate-spin" />

// Alignment and choices
'⚖️' → <Scale className="w-4 h-4" />
'🔥' → <Flame className="w-4 h-4" />
'➤' → <ChevronRight className="w-4 h-4" />
```

## Best Practices

### Do's

✅ **Use consistent sizing** based on context and component type  
✅ **Import only needed icons** to maintain tree-shaking benefits  
✅ **Apply semantic colors** that match the icon's meaning  
✅ **Provide proper accessibility** labeling for meaningful icons  
✅ **Follow established patterns** documented in this guide  

### Don'ts

❌ **Don't use emojis** for interface icons: use lucide-react instead  
❌ **Don't use arbitrary sizes** - stick to the established sizing scale  
❌ **Don't rely on color alone** to convey meaning  
❌ **Don't forget accessibility** - always consider screen reader users  
❌ **Don't mix icon libraries** - maintain consistency with lucide-react  

## Component Integration

### Badge Component

The Badge component is designed to work seamlessly with lucide-react icons:

```tsx
// The icon prop accepts React.ReactNode
<Badge 
  icon={<Star className="w-3 h-3 text-white" />}
  variant="warning"
>
  Badge Text
</Badge>
```

### Integration with Other Components

Most components should accept icons as React nodes:

```tsx
// Achievement dialogs
<AchievementDialog 
  icon={<Trophy className="w-8 h-8" />}
  // other props...
/>

// Custom components should follow this pattern
interface MyComponentProps {
  icon?: React.ReactNode
  children: React.ReactNode
}
```

## Related Documentation

- [shadcn/ui Integration Guide](../ui/shadcn-integration-guide.md) - Component library integration
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

*This guide reflects the current established patterns in the Narraitor codebase. All examples are taken from working components and represent tested, production-ready implementations.*