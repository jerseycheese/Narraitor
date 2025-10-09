# Dead Code Analysis

**Status**: Complete (Third Pass)
**Date Started**: 2025-10-08
**Date Completed**: 2025-10-08
**Analysis Passes**: 3 comprehensive passes
**Goal**: Identify and document verified dead code for removal

---

## Analysis Scope

Comprehensive analysis of the Narraitor codebase:
- **759 TypeScript files** analyzed in src directory
- **27 utility files** in src/lib/utils
- **23 type definition files** in src/types
- **4 constant files** in src/lib/constants
- All hook files, state files, and component files

---

## Findings

### 1. Unused Constant Exports (1 item, 1 line)

#### `AI_SUPPORTED_GENRES`
- **Location**: `src/lib/constants/genres.ts:97`
- **Code**:
  ```typescript
  export const AI_SUPPORTED_GENRES = GENRES.map(genre => genre.value);
  ```
- **Verification**: Exported but never imported in any file
- **Lines to Remove**: 1 line
- **Notes**: Simple derivation of GENRES array that's not used anywhere

---

### 2. Unused Type Definitions (3 items, 17 lines)

#### `OperationResult<T>`
- **Location**: `src/types/common.types.ts:35-39`
- **Code**:
  ```typescript
  export interface OperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
  }
  ```
- **Verification**: Interface exported but never imported or used
- **Lines to Remove**: 5 lines
- **Notes**: Generic operation result type that was never adopted

#### `PortraitGenerationStatus`
- **Location**: `src/types/character.types.ts:19-23`
- **Code**:
  ```typescript
  export interface PortraitGenerationStatus {
    isGenerating: boolean;
    error: string | null;
    lastAttemptAt?: string;
  }
  ```
- **Verification**: Interface exported but never imported or used
- **Lines to Remove**: 5 lines
- **Notes**: Portrait generation status tracking interface that was planned but never implemented

#### `GoalConfig`
- **Location**: `src/types/goal.types.ts:96-102`
- **Code**:
  ```typescript
  export interface GoalConfig {
    maxActiveGoals: number;
    maxContextTokens: number;
    minConfidenceThreshold: number;
    priorityWeights: Record<GoalPriority, number>;
    statusTransitions: Record<GoalStatus, GoalStatus[]>;
  }
  ```
- **Verification**: Interface exported but never imported or used
- **Lines to Remove**: 7 lines
- **Notes**: Configuration interface for goal system that was designed but not implemented

---

### 3. Deprecated Utility Functions (1 item, 8 lines)

#### `formatDistanceToNow()`
- **Location**: `src/lib/utils/textFormatter.ts:200-207`
- **Code**:
  ```typescript
  /**
   * Formats a date to show relative time (e.g., "2 hours ago", "3 days ago")
   * @param dateString - ISO date string to format
   * @returns Human-readable relative time string
   * @deprecated Use formatRelativeTime from @/lib/utils instead
   */
  export function formatDistanceToNow(dateString: string): string {
    return formatRelativeTime(dateString);
  }
  ```
- **Verification**: Marked as @deprecated and never imported or used
- **Lines to Remove**: 8 lines (including JSDoc)
- **Notes**: Deprecated wrapper function that was replaced by `formatRelativeTime`

---

### 4. Unused Hook Functions (1 item, 11 lines)

#### `useJournalShortcuts()`
- **Location**: `src/hooks/useKeyboardShortcuts.ts:65-75`
- **Code**:
  ```typescript
  /**
   * Hook specifically for journal shortcuts
   */
  export function useJournalShortcuts(onOpenJournal: () => void, enabled: boolean = true) {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'j',
        action: onOpenJournal,
        description: 'Open journal'
      }
    ];

    return useKeyboardShortcuts(shortcuts, enabled);
  }
  ```
- **Verification**: Exported but never imported or used in any component
- **Lines to Remove**: 11 lines (including JSDoc)
- **Notes**: Specialized hook that was created but never integrated into the journal UI

---

### 5. Unused Persistence Utilities (2 items, 9 lines)

#### `checkPersistenceAvailable()`
- **Location**: `src/state/persistence.ts:96-98`
- **Code**:
  ```typescript
  export const checkPersistenceAvailable = async (): Promise<boolean> => {
    return await isStorageAvailable();
  };
  ```
- **Verification**: Exported but never imported or used
- **Lines to Remove**: 3 lines
- **Notes**: Utility function for checking storage availability that was never utilized

#### `debugStorage`
- **Location**: `src/state/persistence.ts:110-115`
- **Code**:
  ```typescript
  export const debugStorage = {
    async inspectKey(key: string): Promise<string | null> {
      const storage = await getResilientStorage();
      return await storage.getItem(key);
    }
  };
  ```
- **Verification**: Exported object but never imported or used
- **Lines to Remove**: 6 lines (including JSDoc comment on line 109)
- **Notes**: Debugging utility that was created for development but never used

---

## Unused Components
**No unused components found**

All React components in the codebase are either:
- Imported and used in the application
- Used in Storybook stories
- Used in test files
- Properly integrated into the component tree

---

## Unused Store Methods
**No unused store methods found**

All exported methods in Zustand stores (worldStore, characterStore, narrativeStore, etc.) are actively used throughout the application.

---

## Unused Test Utilities
**No unused test utilities found**

All test utilities in `src/lib/test-utils/` and `__mocks__/` directories are actively used by the test suite.

---

### 6. Unused Validation Helper Functions (6 items, 88 lines)

**File**: `src/lib/utils/worldValidation.ts`

This file exports 7 functions and 1 object. Only `validateWorldCreationData()` is actually used (imported by `useWorldCreation.ts`). The other 6 items are dead code:

#### `validateWorldName()`
- **Location**: `src/lib/utils/worldValidation.ts:7-29`
- **Code**:
  ```typescript
  export function validateWorldName(value: string, existingNames: string[] = []): string | null {
    // ... 23 lines of validation logic
  }
  ```
- **Verification**: Only used internally within this file (by `validateWorldCreationData` on line 124)
- **Lines to Remove**: 23 lines
- **Status**: Over-exported - should be internal function, not exported

#### `validateGenre()`
- **Location**: `src/lib/utils/worldValidation.ts:34-45`
- **Code**:
  ```typescript
  export function validateGenre(value: string): string | null {
    // ... 12 lines of validation logic
  }
  ```
- **Verification**: Only used internally within this file (by `validateWorldCreationData` on line 131)
- **Lines to Remove**: 12 lines
- **Status**: Over-exported - should be internal function, not exported

#### `validateDescription()`
- **Location**: `src/lib/utils/worldValidation.ts:50-63`
- **Code**:
  ```typescript
  export function validateDescription(value: string, fieldName: string = 'Description'): string | null {
    // ... 14 lines of validation logic
  }
  ```
- **Verification**: Only used internally within this file (by `validateWorldCreationData` on line 137)
- **Lines to Remove**: 14 lines
- **Status**: Over-exported - should be internal function, not exported

#### `validateWorldReference()`
- **Location**: `src/lib/utils/worldValidation.ts:68-89`
- **Code**:
  ```typescript
  export function validateWorldReference(relationship?: string, reference?: string): string | null {
    // ... 22 lines of validation logic
  }
  ```
- **Verification**: Only used internally within this file (by `validateWorldCreationData` on line 142)
- **Lines to Remove**: 22 lines
- **Status**: Over-exported - should be internal function, not exported

#### `validateSuggestedName()`
- **Location**: `src/lib/utils/worldValidation.ts:94-102`
- **Code**:
  ```typescript
  export function validateSuggestedName(value: string, existingNames: string[] = []): string | null {
    if (!value?.trim()) {
      return null;
    }
    return validateWorldName(value, existingNames);
  }
  ```
- **Verification**: Exported but **never used anywhere** (not even internally)
- **Lines to Remove**: 9 lines
- **Status**: Completely dead code - can be deleted entirely

#### `worldValidators` object
- **Location**: `src/lib/utils/worldValidation.ts:154-161`
- **Code**:
  ```typescript
  export const worldValidators = {
    name: validateWorldName,
    genre: validateGenre,
    description: validateDescription,
    worldReference: validateWorldReference,
    suggestedName: validateSuggestedName,
    complete: validateWorldCreationData,
  };
  ```
- **Verification**: Exported but **never imported anywhere**
- **Lines to Remove**: 8 lines
- **Status**: Completely dead code - convenience object that's not used

**Summary for worldValidation.ts**:
- File has 161 total lines
- 88 lines are dead code (55% of the file)
- Only `validateWorldCreationData()` and `WorldCreationData` interface should remain as exports
- Helper functions should be made internal (remove `export` keyword)

---

### 7. Unused Narrative Parser Function (2 items, 54 lines)

#### `parseNarrativeContentWithMetadata()`
- **Location**: `src/lib/utils/narrativeParser.ts:147-195`
- **Code**:
  ```typescript
  export function parseNarrativeContentWithMetadata(content: string): NarrativeParseResult {
    // ... 49 lines of parsing logic with metadata tracking
  }
  ```
- **Verification**:
  - Exported from `src/lib/utils/index.ts:103`
  - **Never imported or used** anywhere in the application
  - Only exists in its definition file and re-export
- **Lines to Remove**: 49 lines (function body) + 1 line (export in index.ts) = 50 lines
- **Notes**: Enhanced version of `parseNarrativeContent()` that returns metadata, but the metadata is never used

#### `NarrativeParseResult` interface
- **Location**: `src/lib/utils/narrativeParser.ts:6-10`
- **Code**:
  ```typescript
  export interface NarrativeParseResult {
    content: string;
    wasJson: boolean;
    parseStrategy: 'direct' | 'codeblock' | 'regex' | 'fallback';
  }
  ```
- **Verification**: Only used by `parseNarrativeContentWithMetadata()` which is itself dead code
- **Lines to Remove**: 5 lines (including comment line 4)
- **Notes**: Remove along with the function that uses it

**Summary for narrativeParser.ts**:
- 54 total lines of dead code
- Keep: `parseNarrativeContent()` (actively used by NarrativeDisplay component)
- Remove: Enhanced version with metadata + its interface

---

### 8. Unused AI Error Creation Function (1 item, 7 lines)

#### `createError()`
- **Location**: `src/lib/ai/errors.ts:16-22`
- **Code**:
  ```typescript
  export const createError = (
    code: string,
    message: string,
    retryable: boolean
  ): AIServiceError => {
    return { code, message, retryable };
  };
  ```
- **Verification**: Searched entire codebase - only found in errors.ts itself, never imported
- **Lines to Remove**: 7 lines (including JSDoc comment lines 9-15)
- **Notes**: Simple factory function that was never adopted. Error objects are created inline instead.

---

### 9. Unused Design Token Utilities (2 items, 20 lines)

#### `getCSSVariable()`
- **Location**: `src/lib/design-tokens/index.ts:31-33`
- **Code**:
  ```typescript
  export function getCSSVariable(tokenPath: string): string {
    return `--${tokenPath.replace(/\./g, '-')}`;
  }
  ```
- **Verification**: Only found in design-tokens/index.ts, never imported or used
- **Lines to Remove**: 4 lines (including comment line 30)
- **Notes**: Utility to convert token paths to CSS variable names, but never used

#### `tokensToCSSVariables()`
- **Location**: `src/lib/design-tokens/index.ts:36-50`
- **Code**:
  ```typescript
  export function tokensToCSSVariables(tokens: Record<string, string | Record<string, unknown>>, prefix = ''): Record<string, string> {
    // ... 15 lines of recursive implementation
  }
  ```
- **Verification**: Only found in design-tokens/index.ts, never imported or used
- **Lines to Remove**: 16 lines (including comment line 35)
- **Notes**: Utility to convert token objects to CSS variables, but design tokens are used directly in Tailwind config instead

---

### 10. Unused Portrait Theme Design Tokens (2 items, 27 lines)

#### `portraitThemes` constant
- **Location**: `src/lib/design-tokens/tokens/contextual.ts:58-79`
- **Code**:
  ```typescript
  export const portraitThemes = {
    warm: { primary: ..., secondary: ..., accent: ... },
    cool: { ... },
    neutral: { ... },
    vibrant: { ... },
  } as const;
  ```
- **Verification**:
  - Exported from contextual.ts and re-exported from index.ts
  - `endingTones` and `loreCategories` from same file ARE used
  - `portraitThemes` never imported anywhere
- **Lines to Remove**: 22 lines (lines 57-79, including comment lines 57-58)
- **Notes**: Portrait generation feature that was designed but not implemented

#### `PortraitThemes` type
- **Location**: `src/lib/design-tokens/tokens/contextual.ts:83`
- **Code**:
  ```typescript
  export type PortraitThemes = typeof portraitThemes;
  ```
- **Verification**: Only exists in contextual.ts and index.ts re-export, never imported
- **Lines to Remove**: 1 line
- **Also remove**: Re-export from index.ts line 27 (1 more line)
- **Notes**: Type definition for unused constant

---

### 11. Unused Design Token Type Re-exports (5 items, 11 lines)

**File**: `src/lib/design-tokens/index.ts:11-28`

All of these type exports are re-exported but never imported anywhere:

#### Type re-exports to remove:
```typescript
export type { PrimitiveColor } from './tokens/primitives'      // Line 12
export type { SemanticColors } from './tokens/semantic'         // Line 16
export type { SemanticColorsDark } from './tokens/semantic'     // Line 17
export type { ComponentTokens } from './tokens/components'      // Line 21
export type { EndingTones } from './tokens/contextual'          // Line 25
export type { LoreCategories } from './tokens/contextual'       // Line 26
// PortraitThemes already counted above
```

- **Verification**: None of these types are imported anywhere in the codebase
- **Lines to Remove**: 11 lines (lines 11-13, 15-18, 20-22, 24-26)
- **Notes**: Over-exported types. The actual value exports (primitiveColors, semanticColors, etc.) ARE used, but the type exports are not

---

### 12. Unused Test Factory Functions (4 items, 89 lines)

**File**: `src/lib/test-utils/testDataFactory.ts`

These factory functions were created but never used in any test file:

#### `createMockWorldList()`
- **Location**: `src/lib/test-utils/testDataFactory.ts:249-262`
- **Lines to Remove**: 14 lines (including JSDoc comment lines 246-248)
- **Verification**: Only exists in testDataFactory.ts, never imported or used in tests

#### `createMockCharacterList()`
- **Location**: `src/lib/test-utils/testDataFactory.ts:267-280`
- **Lines to Remove**: 14 lines (including JSDoc comment lines 264-266)
- **Verification**: Only exists in testDataFactory.ts, never imported or used in tests

#### `createMockWorldStoreState()`
- **Location**: `src/lib/test-utils/testDataFactory.ts:308-332`
- **Code includes**: MockWorldStoreState interface (lines 285-306) + function (lines 308-332)
- **Lines to Remove**: 48 lines total (interface + JSDoc + function)
- **Verification**: Only exists in testDataFactory.ts, never used in tests
- **Notes**: Tests use actual mocks from `__mocks__/worldStore.ts` instead

#### `createMockCharacterStoreState()`
- **Location**: `src/lib/test-utils/testDataFactory.ts:357-378`
- **Code includes**: MockCharacterStoreState interface (lines 337-355) + function (lines 357-378)
- **Lines to Remove**: 42 lines total (interface + JSDoc + function)
- **Verification**: Only exists in testDataFactory.ts, never used in tests
- **Notes**: Tests use actual mocks from `__mocks__/characterStore.ts` instead

**Summary for testDataFactory.ts**:
- 118 lines of dead code (4 unused functions + 2 unused interfaces)
- Keep: Individual factory functions (createMockWorld, createMockCharacter, etc.) - these ARE used
- Remove: List/collection generators and store state mocks

---

## Summary Statistics

- **Total Dead Code Items**: 27 items
- **Total Lines to Remove**: ~353 lines
- **Files Affected**: 11 files
  1. `src/lib/constants/genres.ts` (1 line)
  2. `src/types/common.types.ts` (5 lines)
  3. `src/types/character.types.ts` (5 lines)
  4. `src/types/goal.types.ts` (7 lines)
  5. `src/lib/utils/textFormatter.ts` (8 lines)
  6. `src/hooks/useKeyboardShortcuts.ts` (11 lines)
  7. `src/state/persistence.ts` (9 lines)
  8. `src/lib/utils/worldValidation.ts` (88 lines - 55% of file!)
  9. `src/lib/utils/narrativeParser.ts` (54 lines)
  10. `src/lib/utils/index.ts` (1 line - remove re-export)
  11. `src/lib/ai/errors.ts` (7 lines)
  12. `src/lib/design-tokens/index.ts` (31 lines - utilities + type re-exports)
  13. `src/lib/design-tokens/tokens/contextual.ts` (24 lines - portraitThemes)
  14. `src/lib/test-utils/testDataFactory.ts` (118 lines - 31% of file!)

---

## Verification Methodology

Each item was verified through multiple methods:

1. **Grep/Ripgrep Search**: Searched entire codebase for all references to exported names
2. **Import Analysis**: Verified no import statements reference these exports
3. **Manual Review**: Checked each file manually to confirm no usage
4. **Cross-Reference**: Checked related files that would logically use these exports

All items listed have **zero references** outside their definition files.

---

## Removal Strategy

When ready to remove:

### Phase 1: Quick Wins - Completely Unused Items (Low Risk)
Remove items that are 100% unused anywhere:

**Pass 1 & 2 Findings:**
- `AI_SUPPORTED_GENRES` from genres.ts (1 line)
- `OperationResult<T>` from common.types.ts (5 lines)
- `PortraitGenerationStatus` from character.types.ts (5 lines)
- `GoalConfig` from goal.types.ts (7 lines)
- `formatDistanceToNow()` from textFormatter.ts (8 lines)
- `useJournalShortcuts()` from useKeyboardShortcuts.ts (11 lines)
- `checkPersistenceAvailable()` from persistence.ts (3 lines)
- `debugStorage` from persistence.ts (6 lines)
- `validateSuggestedName()` from worldValidation.ts (9 lines)
- `worldValidators` object from worldValidation.ts (8 lines)
- `parseNarrativeContentWithMetadata()` from narrativeParser.ts (49 lines)
- `NarrativeParseResult` interface from narrativeParser.ts (5 lines)
- Remove re-export from utils/index.ts (1 line)

**Pass 3 Findings:**
- `createError()` from errors.ts (7 lines)
- `getCSSVariable()` from design-tokens/index.ts (4 lines)
- `tokensToCSSVariables()` from design-tokens/index.ts (16 lines)
- `portraitThemes` from design-tokens/tokens/contextual.ts (22 lines)
- `PortraitThemes` type from contextual.ts (1 line)
- Remove `portraitThemes` re-export from design-tokens/index.ts (1 line)
- Design token type re-exports from design-tokens/index.ts (11 lines)
- `createMockWorldList()` from testDataFactory.ts (14 lines)
- `createMockCharacterList()` from testDataFactory.ts (14 lines)
- `createMockWorldStoreState()` + interface from testDataFactory.ts (48 lines)
- `createMockCharacterStoreState()` + interface from testDataFactory.ts (42 lines)

**Lines Removed**: ~265 lines

### Phase 2: Refactor Over-Exported Functions (Medium Risk)
For worldValidation.ts, remove `export` keyword from helper functions:
- `validateWorldName()` → internal function
- `validateGenre()` → internal function
- `validateDescription()` → internal function
- `validateWorldReference()` → internal function

Keep as public exports:
- `validateWorldCreationData()` ✓ (actively used)
- `WorldCreationData` interface ✓ (actively used)

**Lines Saved**: ~71 lines (by making functions internal instead of deleting)

### Verification Steps
After each phase:
1. Run TypeScript type checking: `npm run type-check`
2. Run full test suite: `npm test`
3. Run build: `npm run build`
4. Check for any import errors or broken tests

### Commit Strategy
Create separate commits for each phase:
```bash
# Phase 1
git add -A
git commit -m "chore: remove dead code - unused exports and functions (3 passes)

Removed 23 items of verified dead code (~265 lines) across 14 files:
- Unused constant exports
- Unused type definitions and type re-exports
- Deprecated functions
- Unused hooks and utilities
- Unused AI error creation function
- Unused design token utilities and portrait themes
- Unused test factory functions (4 items, 118 lines)

Biggest removals:
- testDataFactory.ts: 118 lines (31% of file)
- design-tokens/index.ts: 31 lines
- portraitThemes: 24 lines

See DEAD_CODE_ANALYSIS.md for full details.
All items verified as having zero usage through 3 comprehensive passes."

# Phase 2
git add src/lib/utils/worldValidation.ts
git commit -m "refactor: make worldValidation helper functions internal

Changed 4 validation helper functions from public exports to internal functions.
Only validateWorldCreationData and WorldCreationData remain as public API.

This reduces the public surface area and makes the module's intent clearer."
```

**Risk Level**:
- Phase 1: **Very Low** - All 23 items have zero external usage
- Phase 2: **Very Low** - Functions remain in file, just removing export keyword

**Impact**:
- ~353 lines of code removed/internalized (nearly doubled from initial analysis!)
- Cleaner public APIs
- Smaller bundle size
- Reduced test maintenance burden (removing unused test factories)
- No breaking changes (all verified unused through 3 passes)

**Test Impact**:
- All removed test factories are unused
- Individual factory functions (createMockWorld, createMockCharacter, etc.) remain and are actively used
- No test changes required
