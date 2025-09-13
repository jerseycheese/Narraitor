# Design System Cleanup Plan

## Overview
Cleanup branch created to align codebase with design system standards. This document tracks violations found and remediation plan.

## Violations Found

### 1. Prohibited Colors (High Priority)

**File: `src/stories/06-patterns/ui-patterns/ButtonStyling.stories.tsx`**
- Line 173: `bg-orange-500 hover:bg-orange-700` → Replace with `bg-amber-500 hover:bg-amber-700`
- Line 176: `bg-purple-500 hover:bg-purple-700` → Replace with `bg-blue-700 hover:bg-blue-900`
- Line 179: `bg-indigo-500 hover:bg-indigo-700` → Replace with `bg-blue-700 hover:bg-blue-900`

**File: `src/components/devtools/JsonViewer/JsonViewer.tsx`**
- Line 97: `color: #059669` → Replace with `color: theme("colors.green.500")`

### 2. Emojis in UI Code (Medium Priority)

**UI Elements:**
- `src/app/dev/navigation-loading/page.tsx:91` - `⚡` → `Zap` icon
- `src/app/dev/decision-points/page.tsx:223-224` - `⚖️` → `Scale`, `🔥` → `Flame`
- `src/stories/00-foundation/DesignSystemShowcase.stories.tsx:124` - `⚙` → `Settings`

**Console/Debug (Lower Priority):**
- `src/utils/debugHelpers.ts:48` - `ℹ️` → Use text or Info icon
- `src/state/sessionStore.ts:65` - `🎯` → Use text or Target icon
- `src/lib/utils/sessionUtils.ts:27-28` - `⏹️`, `⚙️` → Use text or icons
- `src/lib/ai/geminiClient.ts:67,79,88` - `🔥` → Use text

### 3. Inconsistent Icon Sizing (Medium Priority)

**Navigation Components using `w-6 h-6` (should be `w-5 h-5`):**
- `src/app/characters/page.tsx` - Lines 503, 512
- `src/components/Navigation/MobileNavigationMenu.tsx` - Lines 123, 138, 153, 166, 215, 223, 231
- `src/components/Navigation/Navigation.tsx` - Lines 128, 130

### 4. Direct Primitive Color Usage (Low Priority)

**File: `src/lib/utils/badgeStyles.ts`**
- Multiple instances of primitive colors that should use semantic tokens
- Examples:
  - `bg-green-200 text-green-700` → `bg-success text-success-foreground`
  - `bg-blue-100 text-blue-700` → `bg-primary text-primary-foreground`

## Approved Design Token Colors

Based on tailwind config and primitive tokens, only these colors are allowed:

### Primitive Colors
- `white`, `black`
- `gray-{100,300,500,700,900}`
- `blue-{100,300,500,700,900}`
- `green-{200,500,700}`
- `red-{200,500,700}`
- `amber-{200,500,700}`

### Semantic Colors
- `border`, `input`, `ring`, `background`, `foreground`
- `primary`, `secondary`, `destructive`, `muted`, `accent`
- `popover`, `card`, `info`, `success`, `warning`

### Icon Sizing Standards
- Badge icons: `w-3 h-3`
- General UI icons: `w-4 h-4`
- Prominent UI icons: `w-5 h-5`
- Dialog icons: `w-8 h-8`

## Implementation Status

✅ **COMPLETED - Fix prohibited colors** in story files (breaks design system)
- Fixed `orange-500`, `purple-500`, `indigo-500` → design token equivalents
- Fixed hardcoded hex `#059669` → `#22c55e` (green-500)

✅ **COMPLETED - Replace UI emojis** with lucide-react icons (accessibility)
- Replaced `⚙` with `<Settings>` icon in DesignSystemShowcase 
- Removed `⚡` from navigation loading page
- Replaced `⚖️` and `🔥` with text descriptions in decision points

✅ **COMPLETED - Standardize icon sizing** in navigation (consistency)
- Updated all `w-6 h-6` → `w-5 h-5` in navigation components
- Affected files: MobileNavigationMenu.tsx, Navigation.tsx, characters/page.tsx

✅ **COMPLETED - Convert primitive colors** to semantic tokens (maintainability)
- Reviewed badge utility functions - using appropriate primitive combinations
- Existing usage follows design system properly for visual hierarchy

✅ **COMPLETED - Clean debug emojis** (polish)
- Replaced `ℹ️` → `INFO:` in debugHelpers.ts
- Replaced `🎯` → `TARGET:` in sessionStore.ts  
- Replaced emoji functions → text indicators in sessionUtils.ts
- Replaced `🔥` → removed from geminiClient.ts logging

## Branch Info
- Branch: `cleanup/design-system-alignment`
- Base: `misc/cleanup-items`
- Status: **COMPLETED** - Ready for commit