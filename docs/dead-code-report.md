# Dead Code Inventory

_Last updated: October 9, 2025_

This log tracks code that currently has no live references. Each entry lists the evidence gathered so far so we can safely prune when ready.

## Confirmed Unreferenced Code

- **React hook `useWorldCreation`** (`src/hooks/useWorldCreation.ts`)
  - Evidence: `rg "useWorldCreation" -n` only reports the hook definition and the unused helper export in `src/lib/services/worldCreationService.ts`.
  - Notes: All world creation flows call `worldCreationService` directly; no component imports this hook.
  - Suggested cleanup: Delete the hook and strip the corresponding section from docs that reference it.

- **Service helper `useWorldCreation`** (`src/lib/services/worldCreationService.ts:296-306`)
  - Evidence: Same search as above; no imports anywhere else.
  - Notes: Was likely intended as a convenience wrapper around the service but never wired up.
  - Suggested cleanup: Remove the export when the hook above is deleted.

- **World creation helpers (`cloneWorld`, `setAsCurrentWorld`, `validateWorldData`)** (`src/lib/services/worldCreationService.ts`)
  - Evidence: `rg "cloneWorld" -n` / `rg "setAsCurrentWorld" -n` / `rg "validateWorldData" -n` only surface the definitions and references inside the unused hook noted above.
  - Notes: No runtime code or tests exercise these helpers. They can be removed together with the unused hook, or rewritten if a future flow needs them.

- **World creation validation utilities** (`src/lib/utils/worldValidation.ts`)
  - Evidence: `rg "validateWorldCreationData" -n` shows usage exclusively inside the dead `useWorldCreation` hook.
  - Notes: The wizard now handles validation internally, so this standalone helper is orphaned.

- **React hook `useWorldTypeSelection`** (`src/hooks/useWorldTypeSelection.ts`)
  - Evidence: `rg "useWorldTypeSelection" -n` returns only the hook definition and a README snippet; no components import it.
  - Notes: World type selection now relies on `WorldTypeSelector` utilities directly.

- **Prompt helpers `CustomPromptSection` / `PromptOverrideSection`** (`src/components/shared/CustomPromptSection.tsx`)
  - Evidence: `rg "CustomPromptSection" -n` shows only the file itself and a self-referential render; there are no usages elsewhere.
  - Notes: The image customization flows use other UI; these sections can be removed or migrated into a live consumer before keeping them.

- **Card action helper `MakeActiveButton`** (`src/components/shared/cards/MakeActiveButton.tsx`)
  - Evidence: `rg "MakeActiveButton" -n` finds only the component file and README examples.
  - Notes: All places that swap active entities use `CardActionGroup` instead, leaving this component unused.

- **UI `AccessButton`** (`src/components/ui/AccessButton/AccessButton.tsx`)
  - Evidence: `rg "AccessButton" -n` only returns the component file; there are no stories or consumers.
  - Notes: Consider deleting or integrating it where small secondary buttons are still hard-coded.

- **Storage health widget `StorageStatus`** (`src/components/shared/StorageStatus.tsx`)
  - Evidence: `rg "StorageStatus" -n src/app src/components --glob '!src/components/shared/StorageStatus.tsx'` produces no results.
  - Notes: The resilient storage middleware updates status, but nothing renders it. Either wire it into settings/devtools or remove it.

## Runtime-Unused (only referenced in tests/docs)

These items do not affect the production bundle today but have unit tests or documentation. Removing them requires pruning their tests/stories too.

- **AI prompt pipeline class `AIPromptProcessor`** (`src/lib/ai/aiPromptProcessor.ts`)
  - Evidence: `rg "AIPromptProcessor" -n src/app src/components` returns nothing; usages are limited to `src/lib/ai/__tests__` and README examples.
  - Notes: If no roadmap depends on this abstraction, consider removing the class and its tests to reduce maintenance.

- **Devtools component `CustomActionProcessor`** (`src/components/shared/CustomActionProcessor/CustomActionProcessor.tsx`)
  - Evidence: `rg "CustomActionProcessor" -n src/app src/components --glob '!src/components/shared/CustomActionProcessor*'` finds no live imports; only stories/tests exercise it.
  - Notes: Keep only if a devtools embedding is imminent; otherwise delete along with its snapshot tests.

- **World creation entry point `createWorldManually`** (`src/lib/services/worldCreationService.ts:142-244`)
  - Evidence: `rg "createWorldManually" -n src/app src/components` shows no runtime usage; only service unit tests and the unused hook invoke it.
  - Notes: The wizened flow writes directly to the store, so this service method can be retired alongside the hook/tests if we do not plan a headless API entry.

- **Toast hook `useToast`** (`src/components/ui/toast/toaster.tsx`)
  - Evidence: `rg "useToast(" -n src/app src/components` yields no results beyond the hook implementation and docs.
  - Notes: We already mount `ToastProvider`/`Toaster` in `app/layout.tsx`, but no component triggers notifications. Either add a first consumer or remove the hook/docs for now.

## Tooling Notes

- `npx depcheck` flagged `csv-parse` (root package) and several Storybook dev dependencies as "unused". Manual verification shows most are invoked via configuration files (e.g., `.storybook/main.cjs`) or nested `scripts/` tooling, so they should not be removed blindly. `csv-parse` _is_ used under `scripts/user-stories/`, but consider moving that dependency to the `scripts/package.json` workspace to silence the warning later.

Next steps once we are ready to delete code:
1. Remove each file/export listed under "Confirmed Unreferenced Code" and run the full test + lint suite.
2. For the runtime-unused items, decide whether to mothball the associated tests/stories or wire the feature back into the UI before deleting anything.
3. Re-run `npx depcheck` and `rg` spot checks to confirm no new dead code remains.
