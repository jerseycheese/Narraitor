# Issue #1045 Storybook Migration Contract

- Part of #1020
- Implements #1045
- Applies to #1037, #1038, #1032, #1033, #1034, #1035
- Extended in #1046 and #1047 for non-game-session rollout
- Last updated: 2026-02-08

## Purpose

This contract prevents Storybook drift during design-system migration.

Migration changes are not complete unless Storybook coverage changes in the same PR and `npm run build-storybook` passes. This keeps implementation, documentation, and visual regression surfaces aligned.

## Required contract for migration PRs

1. Maintain a mapping table for touched surfaces using the canonical format (`surface -> story file -> keep/update/deprecate`).
2. Update or deprecate stories in the same PR as implementation changes for those surfaces.
3. Record story gaps explicitly using the story-gap policy below; no silent gaps.
4. Run `npm run build-storybook` for migration PRs that touch mapped surfaces, stories, or shared styling layers (`src/app/globals.css`, tokens, shared UI wrappers).
5. Treat Storybook build failures as blocking.

## Canonical mapping table format

Use this table format in migration artifacts:

| Surface | Story file | Action (`keep`/`update`/`deprecate`) | Gap status | Owner issue | Notes |
| --- | --- | --- | --- | --- | --- |

- `Surface`: production file or styling surface being migrated.
- `Story file`: direct story path. If no direct story exists, point to the current parent/indirect coverage.
- `Action`: required action now.
- `Gap status`: one of `none`, `temporary-parent-coverage`, `missing-direct-story`.
- `Owner issue`: issue responsible for closing the mapping action and gap.

## Story-gap policy

### Allowed gap statuses

- `none`: direct story exists and is current for the surface.
- `temporary-parent-coverage`: no direct story yet, but behavior is currently validated through a parent integration story.
- `missing-direct-story`: no direct or parent coverage that meaningfully validates the surface.

### Required handling

- Every `temporary-parent-coverage` or `missing-direct-story` row must include:
  - owner issue,
  - closure path (`add direct story` or `add explicit state variant to parent story`),
  - migration phase where closure happens.
- Migration issues must not close with unresolved `missing-direct-story` rows for touched surfaces.

## Foundation vs feature story update rules

| Change type | Story scope | Owner issue |
| --- | --- | --- |
| Token and neutral-palette changes | `src/stories/00-foundation/*` first, then affected component/page stories | #1032 |
| Streaming behavior and narrative stability changes | Narrative and streaming stories under `03-organisms/narrative` and game-session pages | #1033 |
| Game-session composition/layout changes | Game-session pages and related organism stories | #1034 |
| Progressive disclosure interaction changes | Drawer, marginalia, and progressive disclosure stories | #1035 |

## Required actions by issue

| Issue | Contract action | Expected story scope |
| --- | --- | --- |
| #1037 | Produce initial game-session mapping and gaps | `05-pages/game-session`, `03-organisms/narrative`, `03-organisms/character/display`, `00-foundation` |
| #1038 | Apply removals and update/deprecate mapped stories in same PR | Game-session pages + any story impacted by removed global classes |
| #1032 | Update foundation/token stories before or with token migration | `00-foundation/*` + any surface relying on neutral/token changes |
| #1033 | Update streaming/narrative stories with anchoring behavior changes | Narrative streaming stories + game-session narrative page coverage |
| #1034 | Update game-session composition stories and resolve layout-linked temporary gaps | Game-session page stories, choices/narrative integration coverage |
| #1035 | Update progressive disclosure story coverage behind flag-safe behavior | Drawer/marginalia/progressive disclosure stories |

## Applied mapping snapshot for current game-session audit surfaces

This applies the policy to known game-session surfaces from #1037.

| Surface | Story file | Action (`keep`/`update`/`deprecate`) | Gap status | Owner issue | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/GameSession/ActiveGameSession.tsx` | `src/stories/05-pages/game-session/ActiveGameSession.stories.tsx` | `update` | `none` | #1034 | Page-level integration surface for layout migration. |
| `src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx` | `src/stories/05-pages/game-session/ActiveGameSession.stories.tsx` | `update` | `temporary-parent-coverage` | #1034 | Direct story absent; parent coverage accepted until composition migration lands. |
| `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx` | `src/stories/05-pages/game-session/ActiveGameSession.stories.tsx` | `update` | `temporary-parent-coverage` | #1034 | Direct story absent; parent coverage accepted until composition migration lands. |
| `src/components/GameSession/CharacterSummary.tsx` | `src/stories/03-organisms/character/display/CharacterSummary.stories.tsx` | `update` | `none` | #1032/#1034 | Existing organism story should track token and layout changes. |
| `src/components/GameSession/GameSessionSkeleton.tsx` | No dedicated story | `update` | `missing-direct-story` | #1038/#1034 | Close by adding dedicated skeleton story or explicit loading-state variant in page stories. |
| `src/app/globals.css` (`.narrative-content*`, `.card`, `.btn`, `.btn-primary`) | Impacted game-session stories | `update` | `none` | #1038 | Story updates required in same PR as removals. |
| Foundation token surfaces | `src/stories/00-foundation/DesignTokens.stories.tsx`, `src/stories/00-foundation/DesignSystemShowcase.stories.tsx` | `update` | `none` | #1032 | Required when gray->zinc token migration lands. |

## Verification gate

Run for migration PRs touching mapped surfaces:

```bash
npm run build-storybook
```

Expected:
- Build succeeds.
- No unresolved Storybook drift for touched surfaces.
- Mapping table rows are updated in the same PR when story state changes.

## References

- [Epic #1020](https://github.com/jerseycheese/Narraitor/issues/1020)
- [Issue #1045](https://github.com/jerseycheese/Narraitor/issues/1045)
- [`migration-plan.md`](./migration-plan.md)
- [`issue-1037-legacy-styling-audit.md`](./issue-1037-legacy-styling-audit.md)
- [`issue-1046-non-game-session-legacy-styling-audit.md`](./issue-1046-non-game-session-legacy-styling-audit.md)
