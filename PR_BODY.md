## Description
This tightens up the “game session cleanup” branch by removing deprecated components, consolidating UX around the active session, and aligning supporting tooling/docs. The big idea is: stabilize the Game Session experience, reduce drift, and make the dev surface simpler.

- Remove unused component: `src/components/GameSession/ActiveGameSession.complex.tsx` (canonical component remains `ActiveGameSession.tsx`).
- Game Session UX: journal access (modal + FAB), ending suggestion/confirmation flows, reliable choice-loading with solid fallbacks, and narrative/choices height sync to avoid layout jumps.
- Narrative system: safer decision fallbacks, clearer ending detection plumbing, and targeted tests for formatting/ending indicators.
- Navigation/UI: standardize on shadcn primitives, better breadcrumbs/mobile menu, consistent loading/error components, and design token compliance.
- Routes/dev pages: add focused dev sandboxes; consolidate world routes under `app/worlds/...`.
- Tooling/tests: Playwright config + MCP wrapper (`scripts/mcp-playwright.sh`), seed scripts for visuals, ESLint rule for design tokens, Stylelint config, Storybook tune-ups.
- Docs: remove stale/duplicative guides; add concise technical guides and feature docs; smaller, clearer docs surface.

## Related Issue
Closes # — branch-wide cleanup and Game Session UX polish. If there’s a tracking issue, replace this line with the number.

## Type of Change
- [x] Refactor/cleanup
- [x] DX and tooling improvements
- [x] Tests and documentation updates

## Implementation Notes
- The “complex” variant was unreferenced; all imports resolve to `ActiveGameSession.tsx` via `index.ts`.
- Session reliability: explicit loading states and fallbacks for AI choice generation, plus a simple height sync to keep narrative and choices in visual lockstep.
- Design tokens enforced: new ESLint rule and Stylelint config prevent hardcoded colors.
- Worlds routes moved to `app/worlds/...`; associated pages/tests updated.
- Local MCP runs launch Playwright through a wrapper to avoid “blank tab” sessions.

## Screenshots
- See new images under `screenshots/` for journal and devtools flows.

## Testing Instructions
- Unit: `npm test` (or `npm run test:coverage`).
- Critical E2E: `npm run test:e2e:critical`.
- Visual: `npm run test:visual:seed` then `npm run test:visual` (use `npm run test:visual:update` for intentional changes).
- Manual: `npm run dev` and verify choices/journal/ending flows and the `/worlds/...` routes.

## Checklist
- [x] ESLint/Stylelint pass; no hardcoded colors
- [x] Tests pass locally; updated/added as needed
- [x] Deprecated components removed; no lingering imports
- [x] Documentation updated where behavior changed

