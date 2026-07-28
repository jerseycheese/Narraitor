# Pattern Alignment Checklist

Use this checklist during reviews to keep Narraitor changes consistent with existing patterns.

## Component structure
- Use PascalCase filenames for components.
- Keep components focused; suggest splitting if files drift past ~300 lines.
- Use primitives from `src/components/ui/` for form controls and common UI.
- Use `clsx` directly for conditional class merging (the repo's established pattern — 37+ components import it directly; `cssClasses` in `src/lib/utils/classNames.ts` is a thin wrapper only `ErrorDisplay` uses).

## Design tokens
- No hardcoded colors in TS/TSX or CSS.
- Use `var(--color-*)` design tokens directly — complete colors, don't wrap in `hsl()`. Status/domain tokens (`--success`, `--warning`, `--ending-*`, `--alignment-*`, etc.) are raw HSL channels and must be wrapped: `hsl(var(--success))`. Full split in `public_docs/design-system/design-tokens.md`.
- There is no JS token module — read computed styles when JavaScript needs a token value. (`src/lib/design-tokens/` was deleted in #1509.)

## Error handling
- Use helpers in `src/lib/utils/errorUtils.ts` for user-facing errors.
- Use `createStoreError` for store-level errors.
- Categorize errors with `ErrorType` when relevant.

## State management
- Keep state in domain stores under `src/state/`.
- Use `CrudStore` patterns when appropriate (`src/state/crudStore.types.ts`).
- Use `persist` + `createIndexedDBStorage` when state should survive reloads.
- Avoid direct store-to-store imports; use `storeEvents` (`src/lib/state/storePubSub.ts`) or parent orchestration.

## Types and domain boundaries
- Use domain types from `src/types/*.types.ts`.
- Avoid `any`; use `unknown` + type guards if needed.
- Keep domain logic inside its domain; coordinate cross-domain behavior at pages or feature orchestrators.

## Testing
- Add tests in `__tests__/` or `*.test.ts(x)`.
- Prefer user-facing queries (`getByRole`, `getByLabelText`, etc.).
- Test behavior, not implementation details.
- Add Storybook stories for new complex components.

## Accessibility (WCAG 2.1 AA)
- Ensure labels, keyboard access, focus visibility, and contrast.
- See `references/accessibility.md` for detailed patterns.

## Docs style (when docs change)
- Keep tone conversational and context-first.
- Split long docs instead of exceeding ~300 lines.

## Suggested issue format
- Pattern violated
- Location (file:line)
- Why it matters
- Existing utility/pattern to use
- Concrete fix
