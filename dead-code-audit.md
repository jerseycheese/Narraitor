# Dead Code Audit - Narraitor

**Date:** 2025-10-09
**Total Unused Exports Found:** 1,065 (via ts-prune)

## Executive Summary

This audit identified unused code across the codebase including complete files, unused functions, orphaned API routes, and dead exports. Items are categorized by confidence level for safe removal.

---

## High Confidence - Safe to Remove

### Unused AI Services & API Routes

#### Complete Files to Remove
1. **`src/lib/ai/skillDetectionService.ts`** (3.3KB)
   - Entire skill detection service unused
   - Client-side service with caching
   - No imports found outside the file itself
   - ✅ Removed 2025-10-10

2. **`src/app/api/ai/detect-skills/route.ts`**
   - API endpoint for unused skill detection service
   - POST endpoint, never called
   - ✅ Removed 2025-10-10

3. **`src/lib/ai/imageGenerator.ts`** (6.1KB)
   - DALL-E and Replicate image generation
   - Functions: `generateImageWithDALLE`, `generateImageWithReplicate`, `generateImage`
   - Zero usage outside the file
   - ✅ Removed 2025-10-10 (World image generation now relies solely on `worldImageGenerator`)

4. **`src/app/api/test-ai/route.ts`** (1.3KB)
   - Test API route for world analyzer
   - Used only in security testing docs
   - Not part of production functionality
   - ✅ Removed 2025-10-10

### Unused Function Exports

1. **`src/lib/ai/clientFactory.ts:101`**
   - Export: `isDevMockModeActive`
   - Function defined but never imported
   - ✅ Removed 2025-10-10 (dev mock mode handled through `mockStateManager` accessors)

2. **`src/lib/ai/goalExtractor.ts:520`**
   - Export: `createGeminiClient`
   - Only used in its own test file
   - ✅ Removed 2025-10-10 (tests mock `geminiClient` directly)

3. **`src/lib/constants/skillLevelDescriptions.ts:55`**
   - Export: `getSkillLevelDescription`
   - Entire file appears unused
   - ✅ Removed unused helper 2025-10-10 (core constants still in heavy use)

4. **`src/lib/constants/genres.ts`**
   - Line 54: `isValidGenre` - unused export
   - Line 97: `DEFAULT_GENRE` - unused export
   - ✅ Removed 2025-10-10 (no call sites; normalization helpers cover validation/defaults)

### Unused Design Token Exports

**File: `src/lib/design-tokens/index.ts`**

Verification (2025-10-10): Imports from `@/lib/design-tokens` power logging, Storybook, and AI mock styling. These exports are **in active use**; ts-prune false positive due to path aliases. No action taken.

### Other Unused Exports

1. **`src/lib/devtools/sectionVisibilityStorage.ts:156`**
   - Export: `resetSectionVisibility`
   - ✅ Removed 2025-10-10 (toggle/set helpers cover reset behavior)

2. **`src/lib/generators/characterGenerator.ts:44`**
   - Export: `generateCharacter`
   - Possible duplicate/old version
   - ✅ Removed 2025-10-10 (module now exposes `generateAICharacter`/`generateTestCharacter` only)

---

## Medium Confidence - Requires Verification

### Component Index Re-exports

**Note:** ts-prune flags these as unused, but many are actually used. Need individual verification.

**Potentially unused from `src/components/*/index.ts`:**
- CharacterCard (index export) - **VERIFIED: Actually used**
- CharacterCreationWizard (index export) - **VERIFIED: Actually used**
- CharacterEditor (index export) - **VERIFIED: Actually used**
- CharacterList (index export) - **NEEDS CHECK**
- CharacterPortrait (index export) - **NEEDS CHECK**
- ConfirmationDialog - **NEEDS CHECK**
- DeleteConfirmationDialog - **NEEDS CHECK**

### Hook Exports

**File: `src/hooks/index.ts`**

Flagged as unused but need verification:
- `useCharacterCreationAutoSave` - **VERIFIED: Used in CharacterCreationWizard**
- `useNavigationFlow` - **VERIFIED: Used**
- `useNavigationLoading` - **NEEDS CHECK**
- `usePointPoolManager` - **VERIFIED: Used**
- `useWizardState` - **VERIFIED: Used**
- `useAutoSave` - **VERIFIED: Used**

### Type Exports from src/types/index.ts

**Many type exports flagged as unused - need verification:**
- EntityID, ISODateString, TimestampedEntity, NamedEntity
- WorldAttribute, WorldSkill, WorldSettings
- CharacterAttribute, CharacterSkill, CharacterBackground, etc.
- (50+ type exports to review)

---

## Test Files - NOT Dead Code

### "Orphaned" Test Files (49 found)

These test files don't have 1:1 source file matches because they test specific **aspects** of larger files. These are **feature-specific test suites** and should be kept.

**Examples:**
- `src/state/__tests__/narrativeStore.ending.test.ts` → tests ending features in `narrativeStore.ts`
- `src/state/__tests__/journalStore.persistence.test.ts` → tests persistence in `journalStore.ts`
- `src/components/Narrative/__tests__/NarrativeController.aiEndingDetection.test.tsx` → tests AI detection in `NarrativeController.tsx`

**Recommendation:** Keep all these test files. They follow a valid pattern of separating test concerns.

---

## Unused Library Exports from Index Files

### src/lib/ai/index.ts

Potentially unused exports (need verification):
- `GeminiClient`
- `PortraitGenerator`
- `WorldImageGenerator`
- `createAIClient`
- `generateCharacter`
- `generateWorld`
- `AIServiceConfig`
- `AIServiceError`
- `AIResponse`
- `GenerationConfig`
- `SafetySetting`
- `ProcessedPrompt`
- `AIConfig`
- `AIPromptProcessorOptions`
- `AIImageResponse`
- `AIClient`
- `getAIConfig`
- `getGenerationConfig`
- `getSafetySettings`
- `getDefaultConfig`

### src/lib/promptContext/index.ts

Flagged exports:
- `ContextBuilder`
- `ContextPrioritizer`
- `PromptContextManager`
- `WorldContext`
- `AttributeDefinition`
- `SkillDefinition`
- `CharacterContext`
- (and more...)

### src/lib/promptTemplates/index.ts

Flagged exports:
- `PromptType`
- `PromptVariable`
- (need to check more)

---

## Removal Strategy

### Phase 1: High-Confidence Removals (Immediate)
1. ✅ Remove unused AI services
   - `src/lib/ai/skillDetectionService.ts`
   - `src/lib/ai/imageGenerator.ts`
2. ✅ Remove unused API routes
   - `src/app/api/ai/detect-skills/route.ts`
   - `src/app/api/test-ai/route.ts`
3. ✅ Remove unused utility functions
   - `isValidGenre`, `getSkillLevelDescription`, etc.
4. ✅ Run tests to verify

### Phase 2: Dead Export Cleanup
1. Remove unused exports from design-tokens/index.ts
2. Remove unused exports from lib/ai/index.ts
3. Remove createGeminiClient from goalExtractor.ts
4. Run full test suite

### Phase 3: Deep Verification
1. Manually verify each "medium confidence" item
2. Use grep/ripgrep to confirm no usage
3. Remove verified dead exports
4. Update documentation

### Phase 4: Final Cleanup
1. Run ts-prune again to measure reduction
2. Document removed code in PR
3. Archive findings

---

## Estimated Impact

- **Direct file removals:** ~15KB
- **Dead export removals:** ~200-300 lines
- **Reduced confusion:** Less code to maintain
- **No functional impact:** All verified unused

---

## Next Steps

1. Add more findings from second pass
2. Verify medium-confidence items
3. Create removal PR for Phase 1
4. Iterate through phases with testing between each
