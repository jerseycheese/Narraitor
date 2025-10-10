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

- **Shared wizard suggestions view `AISuggestions`** (`src/components/shared/wizard/components/AISuggestions.tsx`)
  - Status: ✅ Removed on October 9, 2025 (see PR #740).
  - Follow-up: Ensure no new barrel exports reintroduce the component.

- **Shared wizard shell `CollapsibleCard`** (`src/components/shared/wizard/components/CollapsibleCard.tsx`)
  - Status: ✅ Removed on October 9, 2025.
  - Follow-up: References scrubbed from wizard docs; keep an eye on any future need.

- **Wizard AI helper hooks** (`src/components/shared/wizard/hooks/useWizardAI.ts`)
  - Status: ✅ Removed on October 9, 2025.
  - Follow-up: All wizard AI flows now rely on purpose-built hooks.

- **Shared form hook `useFormField`** (`src/components/shared/forms/index.ts`)
  - Status: ✅ Removed on October 9, 2025.
  - Follow-up: No action; maintainers confirmed per-component form logic suffices.

## Runtime-Unused (only referenced in tests/docs)

No remaining items. Re-run `rg` sweeps before each cleanup wave to catch new candidates early.

## Tooling Notes

- `npx depcheck` flagged `csv-parse` (root package) and several Storybook dev dependencies as "unused". Manual verification shows most are invoked via configuration files (e.g., `.storybook/main.cjs`) or nested `scripts/` tooling, so they should not be removed blindly. `csv-parse` _is_ used under `scripts/user-stories/`, but consider moving that dependency to the `scripts/package.json` workspace to silence the warning later.

Next steps once we are ready to delete code:
1. Remove each file/export listed under "Confirmed Unreferenced Code" and run the full test + lint suite.
2. For the runtime-unused items, decide whether to mothball the associated tests/stories or wire the feature back into the UI before deleting anything.
3. Re-run `npx depcheck` and `rg` spot checks to confirm no new dead code remains.
