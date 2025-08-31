# Design Token System Implementation Plan

## Current State Analysis

The app currently uses:
- A mix of hardcoded Tailwind colors (blue-600, gray-700, etc.) throughout components
- Some CSS variables for shadcn/ui theming but inconsistently applied
- Special ending screen colors defined with hex values (#f59e0b, #8b5cf6, etc.)
- No centralized color token system

## Proposed Color Scheme

Based on best practices for modern design token architecture with genre-neutral defaults:

**Three-tier token architecture:**
1. **Primitive Tokens** - Raw color values
2. **Semantic Tokens** - Contextual meaning (primary, secondary, success, etc.)
3. **Component Tokens** - Component-specific values

## Implementation Steps

### 1. Create Design Token Structure (src/lib/design-tokens/)
- tokens/primitives.ts - Base color palette
- tokens/semantic.ts - Semantic color mappings  
- tokens/components.ts - Component-specific tokens
- index.ts - Main export file

### 2. Define Color Palette

**Core UI Colors (Genre-Neutral):**
- **Primary**: Professional blue for trust/reliability
- **Secondary**: Neutral gray for secondary actions
- **Muted**: Light grays for subtle UI elements
- **Success**: Standard green for positive outcomes
- **Warning**: Standard amber for caution
- **Danger**: Standard red for errors/destruction
- **Info**: Standard blue for informational content
- **Neutral**: Comprehensive gray scale for UI elements
- **Surface colors**: Background variations for cards, sections

**Special Context Colors (Genre-Specific, Limited Use):**
- Ending tones (triumphant, bittersweet, mysterious, tragic, hopeful)
- Lore category colors (characters, locations, events, rules)
- Portrait theme palettes

### 3. Update Tailwind Configuration
- Extend theme with custom color tokens
- Map CSS variables to Tailwind utilities
- Ensure compatibility with existing shadcn/ui components

### 4. Create Storybook Documentation
- Design Tokens story showing all color swatches
- Interactive color palette viewer
- Usage guidelines and examples
- Dark/light theme switcher

### 5. Migrate Components
- Replace hardcoded colors with design tokens
- Update button.tsx to use tokens
- Update all components using direct color values
- Ensure all Tailwind classes use token-based colors

### 6. Update CSS Variables
- Consolidate globals.css variables
- Create consistent light/dark theme definitions
- Remove duplicate variable definitions

### 7. Testing & Verification
- Verify all components render correctly
- Check dark mode compatibility
- Ensure WCAG accessibility standards (4.5:1 contrast ratio)
- Test in Storybook isolation

## Benefits

- **Consistency**: Single source of truth for colors
- **Maintainability**: Easy to update themes globally
- **Scalability**: Simple to add new themes or color modes
- **Documentation**: Clear visual reference in Storybook
- **Type Safety**: TypeScript interfaces for all tokens
- **Accessibility**: Built-in contrast checking

## Research Sources

### Best Practices (2024)
- Centralized token definition in dedicated files
- CSS Variables integration for runtime theming
- Theme Provider patterns for React applications
- TypeScript for better developer experience
- Platform-agnostic token formats

### App-Specific Considerations
- Dark mode optimized for reading sessions
- 20% lower saturation for dark themes to reduce eye strain
- Avoid pure white/black for better accessibility
- WCAG contrast ratios: 4.5:1 for normal text, 3:1 for large text
- Genre-neutral core colors with contextual colors for storytelling features

### Token Architecture Standards
- **Primitive → Semantic → Component** hierarchy
- Alias system for meaningful relationships
- Context-aware naming conventions
- Hide primitive tokens from direct use in components