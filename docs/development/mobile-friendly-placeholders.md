# Mobile-Friendly Placeholder Text Guidelines

## Overview
Long placeholder text in **text input fields** can get cut off on mobile devices, creating a poor user experience. This document outlines our standardized approach to handling responsive placeholder text.

**Note**: This guideline applies specifically to `<input type="text">` fields. Textareas (`<textarea>`) can handle longer placeholder text because they wrap text and have more visual space.

## The Problem
Placeholder text longer than ~25 characters often gets cut off on mobile devices (especially on phones with 375px width), showing ellipsis (`...`) that can confuse users in **text input fields**.

**Examples of problematic placeholders in text inputs:**
- `"E.g., Hogwarts Adventures, Galaxy Far Far Away, Middle-earth Chronicles..."` (75 chars)
- `"e.g., Aragorn, Princess Leia, Sherlock Holmes..."` (52 chars)
- `"e.g., Star Wars, Victorian London, Ancient Rome, 1960s New York"` (66 chars)

## Solution: Responsive Placeholder System

### 1. Responsive Placeholder Utility
Location: `/src/lib/utils/responsivePlaceholder.ts`

```typescript
import { getResponsivePlaceholder, RESPONSIVE_PLACEHOLDERS } from '@/lib/utils/responsivePlaceholder';

// Usage in components
placeholder={getResponsivePlaceholder(RESPONSIVE_PLACEHOLDERS.worldConcept)}
```

### 2. Predefined Responsive Placeholders
The utility includes common placeholder patterns:

```typescript
RESPONSIVE_PLACEHOLDERS = {
  worldConcept: {
    desktop: "E.g., The world of Harry Potter, Star Wars galaxy, Middle-earth from LOTR...",
    mobile: "E.g., Harry Potter world..."
  },
  characterAppearance: {
    desktop: "Describe your character's appearance (e.g., tall and muscular, silver hair, blue eyes)",
    mobile: "e.g., tall, silver hair..."
  },
  // ... more patterns
}
```

### 3. Implementation Strategy
Currently, we use the mobile version for all devices to ensure compatibility across all screen sizes. This approach:
- ✅ Prevents text cutoff on any device
- ✅ Maintains clear guidance for users
- ✅ Simplifies implementation
- ✅ Future-proofs for unknown device sizes

## Guidelines for Text Input Placeholders

### 1. Length Guidelines
- **Mobile-safe**: ≤ 20 characters (ideal)
- **Caution zone**: 21-30 characters (test on mobile)
- **Problematic**: > 30 characters (needs responsive treatment)

### 2. Content Guidelines
**Good mobile placeholders for text inputs:**
- `"e.g., Aragorn..."`
- `"Enter name..."`
- `"e.g., Neo-Tokyo..."`

**Avoid in text input placeholders:**
- Multiple examples separated by commas
- Long instructional text
- Complex explanations with parentheses

### 3. Pattern Recognition
Update these patterns when found in text inputs:
- `"e.g., item1, item2, item3..."` → `"e.g., item1..."`
- `"Enter X, Y, or Z"` → `"e.g., X..."`
- Long fictional universe lists → Single example

## Implementation Checklist

When adding new text input fields:

1. **Check placeholder length** - Count characters
2. **Test on mobile** - Use browser DevTools mobile view (375px width)
3. **Use responsive utility** if > 25 characters for text inputs
4. **Add to RESPONSIVE_PLACEHOLDERS** if reusable
5. **Document in stories** - Show mobile behavior in Storybook

**Note**: This checklist applies only to `<input type="text">` fields, not textareas.

## Testing Mobile Placeholders

### Browser DevTools Testing
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set to iPhone SE (375px width) - smallest common size
4. Test placeholder visibility and truncation

### Storybook Testing
1. Use Storybook viewport addon
2. Test in Mobile view (375px)
3. Verify placeholder text is fully visible
4. Check that examples are still meaningful when shortened

## Migration Strategy

For existing components with long placeholders:

1. **Identify**: Search for `placeholder=` with > 25 characters
2. **Assess**: Determine if commonly reused or one-off
3. **Add to utility**: If reusable, add to `RESPONSIVE_PLACEHOLDERS`
4. **Update component**: Import and use `getResponsivePlaceholder()`
5. **Test**: Verify in Storybook mobile view
6. **Document**: Update component stories if needed

## Common Patterns Updated

### World Creation
- World concept: `"E.g., Harry Potter world..."`
- World name: `"E.g., Neo-Tokyo..."`
- World theme: `"e.g., Star Wars..."`

### Character Creation
- Appearance: `"e.g., tall, silver hair..."`
- Background: `"Describe background..."`
- Personality: `"Describe personality..."`

### Portrait Generation
- Appearance: `"e.g., silver hair..."`
- Setting: `"e.g., forest setting..."`

## Benefits

1. **Better UX**: No cut-off text on any device
2. **Consistency**: Standardized approach across app
3. **Maintainability**: Centralized placeholder management
4. **Future-proof**: Easy to enhance with real responsive detection
5. **Developer-friendly**: Clear patterns and reusable utilities

## Future Enhancements

The current system could be enhanced with:
- Real-time screen size detection
- Breakpoint-specific placeholder text
- Dynamic truncation with smart ellipsis placement
- A11y improvements for screen readers