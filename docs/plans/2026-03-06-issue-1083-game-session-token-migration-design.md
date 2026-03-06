# Issue 1083: Game Session Legacy Style Migration Design

## Context

The `globals.css` manuscript class system uses design tokens (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--font-*)`, `var(--shadow-*)`) consistently. But 11 game session TSX components still use Tailwind utilities, creating two competing styling approaches in the same surface. This makes theme switching inconsistent and future layout work harder.

This design covers eliminating Tailwind utility classes from all game session components and aligning them to the existing manuscript CSS class system. No visual changes -- styling consolidation only.

## Scope

11 production component files, plus `globals.css`. Story files are out of scope.

### Files with Tailwind to migrate

| File | Severity | Instance count |
|---|---|---|
| GameSessionSkeleton.tsx | Heavy | ~15 (entire component is Tailwind) |
| ActiveGameSessionChoicesColumn.tsx | Mixed | ~10 (skeleton state + stray utilities) |
| ChoiceHistorySection.tsx | Mixed | ~3 clusters |
| EndingScreen.tsx | Moderate | 4 (prose plugin classes) |
| ManuscriptCharactersRail.tsx | Minor | ~5 (avatar wrapper) |
| EndingSuggestionBanner.tsx | Minor | 3 (button row) |
| ManuscriptSessionShell.tsx | Minor | 3 (spacing + max-width) |
| CharacterSnapshot.tsx | Trivial | 1 (single mb-2) |
| ActiveGameSessionNarrativeColumn.tsx | Trivial | 1 (w-full) |
| play/page.tsx | Minor | 2 (page wrapper) |
| ActiveGameSession.tsx | Exception | 1 (sr-only -- kept as-is) |

### Also in scope

- New `--color-text-inverse` token replacing 10 hardcoded `rgb(255 255 255)` instances in globals.css
- Documenting magic numbers in ManuscriptSessionShell.tsx syncPosition logic

## Design Decisions

**Slicing strategy:** Component-by-component, heaviest first. Each component gets its own commit for easy review.

**GameSessionSkeleton:** Dedicated `manuscript-skeleton-*` CSS classes. The skeleton is a simplified approximation of the real UI, not a mirror of it. Coupling skeleton classes to active-state classes would mean changes to one could break the other.

**EndingSuggestionBanner:** Keep the shadcn Alert component for its accessible semantics (role, structure). Add manuscript CSS on top via newly defined class rules.

**ManuscriptSessionShell inline styles:** Document the magic numbers (`8px` gap, `3px` multiplier) with inline comments rather than tokenize them. These are geometric constants tied to ResizeObserver math, not themeable design decisions.

**Hardcoded whites:** New `--color-text-inverse: rgb(255 255 255)` token. Alpha variants derived using relative color syntax: `rgb(from var(--color-text-inverse) r g b / 20%)`.

**`sr-only` utility:** Intentional exception. This is a functional accessibility utility, not a themeable design decision.

## Implementation Order

1. GameSessionSkeleton.tsx -- new `manuscript-skeleton-*` classes in globals.css
2. ActiveGameSessionChoicesColumn.tsx -- skeleton state classes + absorb stray utilities
3. ChoiceHistorySection.tsx -- new empty state class + absorb button utilities
4. EndingScreen.tsx -- `manuscript-ending-prose` class replacing Tailwind Typography plugin
5. ManuscriptCharactersRail.tsx -- absorb avatar utilities into existing CSS
6. EndingSuggestionBanner.tsx -- define CSS for dangling class + button row
7. CharacterSnapshot.tsx -- absorb single `mb-2`
8. ManuscriptSessionShell.tsx -- absorb spacing/width + document magic numbers
9. Remaining small files (ActiveGameSessionNarrativeColumn, play/page.tsx)
10. `--color-text-inverse` token + 10 replacements

## Verification

- Per-component visual check after each step (active play, loading, ending, mobile)
- Theme switching consistency across all game session states
- Full test suite pass (behavior unchanged)
- Clean `npm run build` and `npm run lint`
- Edge cases: rail positioning, skeleton-to-active transition, EndingSuggestionBanner rendering
