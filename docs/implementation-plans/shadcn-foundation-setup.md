# shadcn/ui Foundation Setup Implementation Plan

**Issue**: #500 - As a developer, I want shadcn/ui integrated so that I can use accessible components  
**Epic**: #499 - Implement shadcn/ui Component Library  
**Priority**: High (MVP)  
**Complexity**: Small (1-2 days)  
**Created**: June 7, 2025

## Executive Summary

This plan outlines the foundation setup for shadcn/ui in the Narraitor project. The scope is intentionally minimal, focusing on establishing patterns and infrastructure that subsequent issues in the epic will build upon. The full component migration is distributed across issues #501-506.

## Objectives

1. Install and configure shadcn/ui CLI
2. Make an informed style decision (Default vs New York)
3. Create world theme extension system
4. Import Button component as proof of concept
5. Document migration patterns for future work

## Technical Architecture

### Theme System Design

```typescript
// World themes extend shadcn's base theme
interface WorldTheme {
  name: string
  colors: {
    primary: string        // HSL values
    primaryForeground: string
    accent: string
    accentForeground: string
  }
}
```

### File Structure

```
src/
├── components/
│   └── ui/              # shadcn components
│       └── button.tsx   # First component
├── lib/
│   ├── themes/
│   │   ├── types.ts     # Theme interfaces
│   │   └── world-themes.ts # World theme definitions
│   └── utils/
│       └── cn.ts        # className merger
└── app/
    └── dev/
        └── style-comparison/ # Style decision tool
```

## Implementation Steps

### Step 1: Install shadcn/ui CLI (30 min)

```bash
npx shadcn@latest init
```

Configuration choices:
- TypeScript: Yes
- Style: Will decide after comparison
- Base color: Neutral
- CSS variables: Yes
- Where is your global CSS? `src/app/globals.css`
- Import alias: `@/` = `src/`

### Step 2: Create Style Comparison Page (1-2 hours)

Create `/src/app/dev/style-comparison/page.tsx`:
- Side-by-side comparison of Default vs New York styles
- Include typical RPG UI elements:
  - Character cards
  - Stat displays
  - Action buttons
  - Form inputs
  - Data tables (mock)

### Step 3: Style Decision & Configuration (30 min)

Based on comparison:
- Document decision rationale
- Configure chosen style
- Update any necessary settings

### Step 4: Theme Extension System (2-3 hours)

1. Create theme type definitions
2. Define world theme colors:
   - Triumphant (amber tones)
   - Bittersweet (violet tones)
   - Mysterious (gray tones)
   - Tragic (red tones)
   - Hopeful (emerald tones)
3. Build theme application utility
4. Test with one complete theme

### Step 5: Button Component Integration (1-2 hours)

```bash
npx shadcn@latest add button
```

1. Create Storybook stories
2. Test all variants
3. Verify theme integration
4. Document patterns observed

### Step 6: Documentation (1 hour)

Create migration guide covering:
- Component import process
- Storybook story patterns
- Theme integration approach
- Testing requirements

## Testing Strategy

### Unit Tests
- Theme application utility
- cn() utility function
- Button renders with all variants

### Storybook Tests
- Button component stories
- Style comparison components
- Theme switcher demonstration

### Integration Tests
- Button works in existing layouts
- No CSS conflicts
- Theme switching works

## Success Criteria

- [ ] shadcn/ui CLI installed and configured
- [ ] Style decision made and documented
- [ ] Theme system supports one world theme
- [ ] Button component fully integrated
- [ ] All tests passing
- [ ] Migration guide completed
- [ ] No regression in existing UI

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CSS conflicts | Start with isolated components |
| Theme complexity | Begin with one theme only |
| Build issues | Test build after each step |
| Style decision paralysis | Time-box to 1 hour |

## Dependencies

- Tailwind CSS v4 (already installed)
- Additional packages to install:
  - `clsx`
  - `tailwind-merge`
  - `@radix-ui/react-slot` (for Button)

## Next Steps

After this foundation is complete, the following issues can proceed in parallel:
- #503: Form component migration
- #502: Dialog components
- #504: Toast notifications
- #505: Smooth scrolling

Issues #501 (Command Palette) and #506 (Data Tables) may want to wait for initial component migration experience.

## Notes

- Keep changes minimal and focused
- Each component migration in other issues should follow patterns established here
- Document any surprises or learnings for the team
- The goal is a solid foundation, not perfection

## References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Narraitor Storybook Workflow](/docs/development/workflows/storybook-workflow.md)
- [Epic #499: Implement shadcn/ui Component Library](https://github.com/jerseycheese/Narraitor/issues/499)
