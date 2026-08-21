# Repo capability map — Narraitor

Phase 1 output of the capability-distillation pass. Baseline: `develop` @ 4bec88e6, clean, up to date with origin. Date: 2026-07-04.
Evidence labels: `known` = verified this session (command run or file read), `observed` = reported by a discovery agent that read the file, `candidate`/`unverified`/`stale-risk` as marked.

## 1. Project purpose

AI-driven narrative RPG framework (known — README, CLAUDE.md). Build a world (theme, attributes, skills, tone), create characters, play a generated choice-driven story with tracked inventory/journal/lore. Single-player web app: no backend database — player data lives in the browser (IndexedDB via Zustand persist), AI generation runs through the player's own Gemini key (BYO-key). v1.0 launch phase: polish + reliability only, no net-new features (observed — mvp-roadmap.md, tracking issue #1320).

## 2. Main subsystems (domains)

- **State** (`src/state/`): one Zustand store per domain — world, character, narrative (split across `narrativeStore.*.ts`), inventory, journal, lore (split across `loreStore.*.ts`), npc, goal, session, navigation, provider, aiContext, calibration, continuity. All persist through `src/state/persistence.ts` (IndexedDB). Cross-store cascades via the event bus `src/lib/state/storePubSub.ts` + `src/state/storeEventWiring.ts` (events: `WORLD_DELETED`, `CHARACTER_DELETED`, `SESSION_FRESH_START`, `SESSION_STARTED`, `SESSION_ENDED`) (observed).
- **AI layer** (`src/lib/ai/`): Gemini client (`geminiClient.ts`, model `gemini-2.5-flash` + `gemini-2.5-flash-image` in `config.ts` — known), generators (narrative, choice, ending, images, goals, lore extraction), `aiFetch.ts` (client fetch + BYO key header + 120s timeout), `resolveApiKey.ts` (server key resolution), `abortTimeout.ts` (per-request abort signals, PR #1506) (observed).
- **Prompt templates** (`src/lib/promptTemplates/`): registry `narrativeTemplateManager.ts` → `getNarrativeTemplate(id)`; template generators under `templates/narrative/` + `templates/endingTemplates.ts`; context assembly + token measurement in `src/lib/promptContext/` (nothing budgets or trims the assembled prompt) (known — read this session).
- **API routes** (`src/app/api/`): 19 route.ts files (known — full list verified): narrative (generate/choices/ending/summarize/story-checkpoint/validate-event-significance), generation (world/character/portrait/world-image/item-image/journal-image/ending-image), ai (analyze-world/validate-provider), inventory (categorize/check-similarity), delete-image, debug. No lore route — `lore/check-similarity` was deleted in #1634.
- **Client API seam** (`src/lib/api/`): components call these services, not fetch directly — enforced by dependency-cruiser since PR #1508 (known — dir listing; observed — rule).
- **Components** (`src/components/`): domain-organized (GameSession, Narrative, WorldCreationWizard, CharacterCreationWizard, Journal, inventory, ui primitives, shared, devtools…). CSS co-located per component; stories live centrally under `src/stories/` (140 files, known) (observed).
- **Theming** (`src/lib/theme/`): ONE design system, ds3, as `themes/ds3.css` + `_shared-tokens.css` (ADR-013 deleted ds1/ds2); `ThemeProvider.tsx`; localStorage key `narraitor-color-scheme` for light/dark (the `narraitor-theme` key went with the DS picker); FOUC-prevention init script (observed).
- **App routes** (`src/app/`): worlds/characters CRUD + wizards, `/worlds/[id]/play` session, `/settings/providers`, legal/landing, plus ~10 `/dev/*` harness routes (observed).

## 3. Build/test/run commands verified

Run this session on `develop` @ 4bec88e6 — all `known`:

| Command | Result |
|---|---|
| `npm test` | exit 0 — 353 suites, 2399 tests, ~26s |
| `npm run type-check` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run lint:css` | exit 0 |

Config-verified but NOT executed this session (`observed`, re-verify before relying): `npm run build`, `npm run dev` (port 3000 main checkout; worktrees get derived ports via `scripts/worktree-port.js`), `npm run storybook` (6006), `npm run test:visual` / `test:e2e:critical` (needs a running dev server locally — Playwright `webServer` only autostarts in CI), `npm run deps:validate`, `npm run knip`, `npm run skott:check` (budget: `maxCircularDependencies: 6` in `.skott-baseline.json`), `npm run lint:ds-canon`, `npm run lint:layout-usage`, `npm run audit:css` (advisory, always exit 0).

Environment: node v24.16.0, npm 11.13.0 (known). Port 3000 free at session time (known).

## 4. AI / narrative workflows verified

- BYO-key flow (observed): `providerStore` (persist key `narraitor-provider-store`, encrypted) → `aiFetch()` injects the `x-provider-api-key` header → route calls `resolveApiKey(request)` (header → `GEMINI_API_KEY` env fallback). Two server paths: generate/choices via `makeGeminiRequest` (30s, no retries); other generators via `GeminiClient` (3 retries, exponential backoff).
- Model strings live ONLY in `src/lib/ai/config.ts` (known — grep): `gemini-2.5-flash`, `gemini-2.5-flash-image`. Docs referencing `gemini-2.0-flash` are stale (see §7).
- Timeouts: `aiFetch` 120s client-side; `timeoutSignal()` per Gemini request (observed; PR #1506).
- Generation config (observed): temperature 0.7, maxOutputTokens 2048 (route-specific overrides exist), thinkingBudget 0, safety BLOCK_NONE.
- Response handling: dedicated parse/normalize modules (`narrativeGenerator.response.parse.ts`, `.normalize.ts`, `parseJSON.ts`) — malformed-output handling is a first-class code path (known — dir listing).
- No streaming middleware exists: `streamResilience.ts`/`resilientStream` have been deleted (known — grep, zero hits). Any doc/memory claiming otherwise is stale. Feature flag `BUFFERED_STREAMING` exists in `src/lib/featureFlags.ts` (observed). Progressive prose streaming is open work (#1476).

## 5. Storybook + integration workflows verified

- Storybook 8 + `@storybook/nextjs`; stories glob `src/stories/**/*.stories.*` (140 story files, known — counted this session); addons: essentials + a11y (observed).
- `withStores` decorator (`.storybook/decorators/withStores.tsx`): synchronous real-store `setState()` seeding; stores NOT auto-reset between stories (observed).
- MSW (`.storybook/msw/handlers.ts`): mocks `/api/*` with canned responses, `onUnhandledRequest: 'bypass'` (observed).
- Toolbar: light/dark `colorScheme` global + viewports — no design-system picker (ADR-013 collapsed to ds3) (observed).
- Storybook is the canon design surface (ADR-012, `public_docs/architecture/ADR-012-storybook-single-canon-surface.md`); `verify-ds-canon.cjs` (via `npm run lint:ds-canon`, CI-blocking) fails on NEW in-scope components without stories, grandfathered via `.ds-canon-baseline.json` (observed).
- Production build copies `storybook-static` into `public/` (known — package.json build script).
- Integration tier: real app hydrates from IndexedDB; e2e seeds stores post-hydration (`tests/visual/global.setup.ts`, seedTestData dual-seeding IndexedDB + localStorage; AI calls gated by `isPlaywrightEnv()` from `src/lib/utils/isPlaywrightEnv.ts`) (observed).

## 6. Critical docs of record

- `CLAUDE.md` — operating manual (known).
- `public_docs/` — committed docs of record: `architecture/` (ADR-001…012 as files, state-management-guide, repository-structure), `development/mvp-roadmap.md` (release-gate source of truth), testing guides, feature docs (observed).
- `DESIGN.md` — DS1 token frontmatter / design map (observed; carries stale refs, see §7).
- `README.md` — product overview (known).
- `.github/PULL_REQUEST_TEMPLATE.md` + `ISSUE_TEMPLATE/` (bug, enhancement, epic, feature_request, user-story) (observed).
- `docs/` — gitignored private planning vault (~18 dated implementation plans); NOT canonical (observed).
- Existing `.claude/skills/`: narraitor-architecture, narraitor-pattern-alignment-skill, review, style-port; `.claude/agents/`: design-system-cop, formatting-cop, issue-prioritizer, pr-closer, test-fixer (known — dir listing; observed — frontmatter).

## 7. Known stale docs or contradictions

All `stale-risk`, verified by discovery grep this session:

1. `DESIGN.md` and `public_docs/design-system/README.md` carry residual `/dev/design-system*` showcase-page references — those pages were retired per ADR-012 (#1484/#1488). DESIGN.md largely names Storybook as canon already; the staleness is residual lines, not the whole doc.
2. ~~`public_docs/features/ai-systems.md` names `gemini-2.0-flash`~~ — FIXED in the doc-rot sweep; it now points at `src/lib/ai/config.ts` rather than naming a model inline.
3. `public_docs/architecture/ADR-007-tailwind-shadcn-styling.md` + `design-system/shadcn-integration-guide.md` describe Tailwind/cva/cn() — correctly marked historical; do not treat as current guidance.
4. Project memory (out-of-repo) claim that `streamResilience.ts` exists but is unwired — file deleted; stale.
5. `docs/plans/archive/*` are point-in-time implementation plans, all now archived; several describe completed/superseded work (e.g. #1038 clean-slate) — never treat as current state. Note `docs/` is gitignored entirely (committed docs go in `public_docs/`), so these are local scratch, not repo history.

## 8. Known failure modes

(Condensed; operational detail in `_expert_distillation_notes.md` and the skills.)

- Storybook-green treated as app-verified; mock-data-only components breaking on real AI responses (empty/malformed/slow).
- Single-world/single-character validation generalized; one good generation treated as a reliable prompt.
- Store shape edits without tracing selectors + persisted IndexedDB slices + migrate versions (loreStore is at persist v3 with migrate; narrativeStore has custom Date serialization — observed).
- Hydration races: e2e seeding before `persist.hasHydrated()`; components reading stores pre-hydration.
- Visual-baseline cascade: shared-chrome CSS shifts many `-chromium-darwin` baselines (199 total); chasing single specs instead of regenerating all affected at once. Baselines are macOS-rendered — never regenerate on Linux/cloud.
- Raw colors outside theme files (stylelint blocks: color-no-hex, property-value disallowed lists; custom ESLint rule `design-tokens/no-hardcoded-colors`).
- Domain-boundary violations (dependency-cruiser + known-violations baseline; lib/api seam since #1508).
- Port collisions: main checkout owns 3000; worktrees derive ports; another project (rcv-simulator-va) also defaults to 3000.
- Dead code accumulation (knip is CI-blocking) and circular-dependency growth (skott budget = 6).
- AI calls escaping the `isPlaywrightEnv()` gate and hanging visual runs.

## 9. Current highest-risk live problems

From the history/issue sweep (observed — gh issue list, mvp-roadmap.md):

1. **v1.0 launch gate is nearly closed but not closed**: tracking epic #1417/#1320; QA findings #1423–#1438 all closed except #1434 (character-creation DS/UX pass) and #1438 (explicitly post-1.0). Launch-gate items in roadmap Phase C (landing #1365, legal #1366, analytics #1367) are shipped per memory; roadmap doc may lag (stale-risk).
2. **AI play-loop verification gap**: the live narrative loop (real Gemini, multi-turn, consequences, endings) has no automated coverage by design — visual/e2e suites gate AI off. Manual QA walkthrough is the only gate. #1476 (progressive streaming of prose, 5–8s pop-in) is the biggest live UX gap in the loop.
3. **Accessibility**: #1477 touch targets below 44px app-wide (WCAG 2.5.5) — open, unclear if launch-blocking (owner-confirmation-needed).
4. **Token drift**: #1474 dual accent token systems (legacy `--primary` HSL vs `--color-*`) — medium priority tech debt.
5. **God-file stores**: #1415 inventoryStore.ts (~1,115 lines) split pending; narrativeStore already split into modules.
6. Open flake: #1465 world-creation.spec.ts fullPage height race (low).

## 10. Skills the repo clearly needs

The 16-skill library planned in `_distillation_plan.md` §2 — validated by discovery: the repo has strong *enforcement* tooling (stylelint/knip/skott/dep-cruiser/ds-canon) but thin *procedural* capture of how an expert debugs, evaluates AI output quality, promotes components from Storybook to app-verified, and decides ship/hold. No committed QA-walkthrough procedure exists in-repo (the owner has a personal-level skill; the repo itself needs the evidence bar encoded).

## 11. Skills that would be premature

- Automated prompt-eval harness runner (no golden corpus exists yet — the skill can define the manual protocol and the criteria for building one, not pretend a harness exists).
- Multiplayer/platform-upgrade skills (epics #1370/#1368 are post-MVP backlog).
- A "fix CI" skill duplicating the owner's global `ci-fix-with-memory` skill — the library references it instead.
- Anything duplicating live enforcement (stylelint/knip rules) as prose — the skills point at the gates rather than restating them.

## 12. Questions the repo cannot answer

(owner-confirmation-needed; carried into `_uncertainty_register.md`. Answered provisionally from project memory where noted.)

1. Is #1477 (touch targets) a v1.0 launch blocker or 1.1 polish? Roadmap doesn't say.
2. What is "beyond state of the art" for this product — deeper long-arc coherence, replayability, or multiplayer? Memory suggests long-arc story memory/coherence/consequences (provisional).
3. Is the manual QA walkthrough (owner-level skill) intended to become a committed repo artifact, or stay personal?
4. Should prompt-template changes require a recorded multi-world eval log as a hard gate, or is that aspirational for now? (Skills encode it as the required bar per the distillation brief; owner may soften.)
5. Are the stale local branches (`feat/distill-*` with uncommitted changes, `claude/*`) safe to prune? Two carry dirty state — do not touch without asking.
