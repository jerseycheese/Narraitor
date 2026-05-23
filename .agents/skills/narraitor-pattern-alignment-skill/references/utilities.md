# Utilities Reference (Narraitor)

Before adding new helpers, scan these areas for existing utilities:
- `src/lib/utils/` (general helpers)
- `src/lib/<domain>/` (domain-specific helpers)
- `src/hooks/` (shared hooks)
- `src/state/` (store helpers and patterns)

## Common utilities (paths)
- `src/lib/utils/errorUtils.ts` — ErrorType, user-friendly errors, retryability, store errors
- `src/lib/utils/formatters.ts` — date/time/string formatting helpers
- `src/lib/utils/validationUtils.ts` — input and rules validation
- `src/lib/utils/classNames.ts` — `cn` Tailwind class merger
- `src/lib/utils/generateId.ts` — `generateUniqueId`
- `src/lib/utils/logger.ts` — Logger utility
- `src/lib/utils/timestamp.ts` — timestamp helpers
- `src/lib/utils/textNormalization.ts` — text normalization helpers used in stores
- `src/lib/utils/wizardValidation.ts` — wizard-specific validation helpers

## Domain utilities
- `src/lib/world/` — world-specific logic (state formats, templates)
- `src/lib/character/` — character helpers (if needed, check before adding)
- `src/lib/inventory/` — inventory logic and integrations
- `src/lib/narrative/` — narrative parsing and prompt helpers
- `src/lib/lore/` — lore extraction/dedup/resolution utilities
- `src/lib/promptTemplates/` — AI prompt templates and validations
- `src/lib/storage/` — storage helpers (IndexedDB, persistence)

## Hooks
- `src/hooks/useAutoSave.ts`
- `src/hooks/useWizardState.ts`
- `src/hooks/useNavigationFlow.ts`
