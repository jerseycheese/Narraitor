# Factual review — Reviewer 1 (FACTUAL VERIFIER)

Reviewed 2026-07-04 against `develop` @ 4bec88e6 (clean tree, verified `git log --oneline -1`). Scope: the 16 new narraitor-* skills + README.md + the seven meta docs. Pre-existing skills (narraitor-architecture, narraitor-pattern-alignment-skill, review, style-port) not reviewed.

**Summary: 2 BLOCKING, 6 IMPORTANT, 7 MINOR.**

The load-bearing majority of the library checks out: every quoted npm script exists (package.json read in full), all 20 API route paths are exact, model strings / generation config / the 120s `AI_REQUEST_TIMEOUT_MS` are exact, IndexedDB names (`narraitor-state`/`narraitor-store`, `narraitor-secure`/`keys`) are exact, event-type strings match `storePubSub.ts` verbatim, localStorage/sessionStorage keys are exact, the joyride pin + React overrides are real, Playwright config claims (threshold 0.2, maxDiffPixels 10000, webServer CI-only, chromium/tutorials projects, 199 `-chromium-darwin.png` baselines — exactly 199) are exact, Storybook claims (v8, `main.cjs` stories glob, essentials+a11y, withStores no-auto-reset, MSW bypass + happy-path handlers, base href `/storybook/`) are exact, CI job claims match `ci.yml` (lint job runs lint:css/layout-usage/ds-canon/deps:validate; knip, skott-cycles, audit-css, test via `test:ci`, build, storybook, security), `.skott-baseline.json` budget is 6, `validate-prompt-templates.js` really is a standalone toy demo, `getNarrativeTemplate` throws on unknown id, every `NarrativeTemplateContext` field really is optional and `toneSettings` really is opaque (`void toneSettings` in baseNarrativeTemplate), streamResilience really is gone (zero grep hits), and all 18 issue/PR states I checked match the claims (#1415/#1417/#1320/#1434/#1438/#1465/#1474/#1476/#1477 open; #1478/#468/#903/#1206/#1484/#1488 closed; #1423–#1437 closed; #1505/#1506/#1508/#1509 merged with matching titles). The unit-suite claim was re-run this session: `npm test` → 353 suites / 2399 tests, exit 0 — exact match. Logger default WARN (hedged in the skills as memory-derived) is in fact true (`logger.ts:49`).

---

## BLOCKING

### B1. Persist keys wrong for 8 of 11 stores

- **File:** `narraitor-domain-reference/reference.md` (Stores table) and `narraitor-domain-reference/SKILL.md` §5.
- **Claim:** table lists persist keys `world-store`, `character-store`, `session-store`, `inventory-store`, `journal-store`, `npc-store`, `goal-store`, `navigation-store`; SKILL.md gives "Persist keys are inconsistent by history (`world-store` vs `narraitor-narrative-store`)".
- **Actual:** `grep -rn "name: '" src/state/*.ts` — worldStore `narraitor-world-store` (worldStore.ts:510), characterStore `narraitor-character-store` (:809), sessionStore `narraitor-session-store` (:704), inventoryStore `narraitor-inventory-store` (:1057), journalStore `narraitor-journal-store` (:252), npcStore `narraitor-npc-store` (:228), goalStore `narraitor-goal-store` (:367), navigationStore `narraitor-navigation-store` (:415). Only `lore-store`, `narraitor-narrative-store`, and `narraitor-provider-store` are quoted correctly. There is no `world-store` persist key anywhere in `src/state/`. The real historical inconsistency is `lore-store` (no prefix) vs everything else (`narraitor-*`). Corroborated by `tests/visual/utils/seedTestData.ts:98` seeding `` `narraitor-${name}-store` `` keys.
- **Why blocking:** the table hands a session exact-looking key strings for IndexedDB inspection, e2e seeding, and migrate work — 8 of them will silently return nothing. This is exactly the "wrong action" the skill exists to prevent, and the debugging-playbook's "State not persisting" row sends people to these keys.
- **Fix:** correct all 8 keys; change the SKILL.md example to "`lore-store` vs `narraitor-world-store`".

### B2. The `{prompt}` body contract is claimed for all six narrative routes; it holds for two

- **File:** `narraitor-domain-reference/reference.md` (API routes: "Narrative text (body `{prompt}` → Gemini text): `narrative/generate` … `choices`, `ending`, `summarize`, `story-checkpoint`, `validate-event-significance`"); `narraitor-domain-reference/SKILL.md` ("Route handlers are thin: body `{prompt}` → `processGeminiTextRequest`"); `narraitor-debugging-playbook` symptom row ("Body shape (`{prompt: string}` for narrative text routes)").
- **Actual:** only `narrative/generate` (1024 tok) and `narrative/choices` (2048 tok) use `processGeminiTextRequest` with the `{prompt}` contract and the 400 "prompt is required" path (verified: both route files + `apiHelpers.ts:224`). The other four have their own contracts (route files read this session): `narrative/ending` requires `{sessionId, characterId, worldId, endingType}` → 400 "Missing required fields…"; `narrative/summarize` requires `{content, …}` → 400 "Content is required"; `narrative/story-checkpoint` takes `StoryCheckpointRequestBody`; `narrative/validate-event-significance` requires `{majorEvent}`.
- **Why blocking:** a session following the campaign's Phase 2 ("for each narrative route … then one live smoke") that extends the documented `{"prompt": …}` curl to ending/summarize gets 400s and will misdiagnose a healthy route as broken — or "fix" a route toward the documented contract. (The weaker claim "expect 400 on empty body" does hold for all six.)
- **Fix:** scope `{prompt}` to generate/choices; list the other four contracts, or say "each route validates its own body — read the route file before smoking it".

---

## IMPORTANT

### I1. Archaeology E8 misattributes the "one true revert" to #1195

- **File:** `narraitor-failure-archaeology/reference.md` E8, `narraitor-failure-archaeology/SKILL.md` index ("one true revert in ~400 commits (#1195 personalizationEngine)"), `_expert_distillation_notes.md` §4.
- **Claim:** "personalizationEngine rollback (#1195) — the single true revert in ~400 commits".
- **Actual:** `gh pr view 1195` → MERGED, "feat(ds): apply DS1/DS2/DS3 structural differentiation to wizard surface (#1167)" — a design-system PR, no revert, no personalization. `git log --all --grep="ersonaliz"` shows no revert commit; `git log --diff-filter=D --all -- src/lib/ai/personalizationEngine.ts` is empty (the file was added in a81bf962 and never deleted). Also `git rev-list --count HEAD` = 1519, not ~400.
- **Why important:** anyone doing archaeology on the "one revert" chases a wrong PR; the doctrine's flagship evidence doesn't exist as cited.
- **Fix:** delete or re-source E8. If forward-fix culture stays as doctrine, anchor it to checkable evidence (e.g., `git log --grep='Revert "'` being near-empty) and drop the #1195/personalizationEngine story.

### I2. Retry/timeout story conflates two server request paths

- **File:** `_repo_capability_map.md` §4 ("route calls `resolveApiKey(request)` … → `GeminiClient` (3 retries, exponential backoff)"), `narraitor-domain-reference/SKILL.md` ("the Gemini client retries 3x with backoff" presented as the request path), `narraitor-diagnostics-and-tooling` interpretation note ("5xx/timeout on a valid body = key, upstream, or timeout (120s ceiling)").
- **Actual:** the core text routes (generate, choices) call `makeGeminiRequest` (`apiHelpers.ts:138`) — a single fetch, **no retries**, hardcoded **30s** AbortController timeout. `GeminiClient` (maxRetries 3 + exponential backoff + `timeoutSignal`, geminiClient.ts:40-77) is used by summarize, story-checkpoint, ending, image, and similarity routes via their generators. The 120s ceiling is the *client-side* `aiFetch` timeout — irrelevant when you curl the route directly; the server-side ceiling on generate is 30s.
- **Why important:** wrong latency/retry model → wrong debugging conclusions (e.g., expecting three retries to mask a transient Gemini blip on the main narrative route, or waiting 120s for a curl that aborts at 30s).
- **Fix:** describe both paths and attribute the 30s (server, makeGeminiRequest) vs 120s (client, aiFetch) ceilings explicitly.

### I3. "Every store persists" — three stores deliberately don't

- **File:** `narraitor-architecture-contract/SKILL.md` I6 ("Every store persists via `createIndexedDBStorage()`"), `narraitor-domain-reference/SKILL.md` ("Everything persists through IndexedDB"), `narraitor-domain-reference/reference.md` table row implying aiContext/calibration/continuity have persist keys "(see files)".
- **Actual:** `aiContextStore.ts`, `calibrationStore.ts`, `continuityStore.ts` use plain `create()` with no persist middleware; the latter two say "never persisted" in their file headers (calibrationStore.ts:7, continuityStore.ts:7).
- **Why important:** wrong mental model — a session may expect continuity/calibration state to survive reload (it won't, by design) or add version/migrate ceremony to stores that don't persist.
- **Fix:** "all durable domain stores persist …; aiContext/calibration/continuity are deliberately in-memory".

### I4. Invented store action names in the reference table

- **File:** `narraitor-domain-reference/reference.md` (Stores table, "Notable actions" column).
- **Claims vs actual** (grepped in the store files):
  - sessionStore "recordPlayerChoice" — no such action; actual: `setPlayerChoices` / `selectChoice` (sessionStore.ts:309/314).
  - sessionStore "save/loadSession" — no such actions; actual: `getSavedSession`, `resumeSavedSession`, `deleteSavedSession` (:355/364/410); saving runs through `src/lib/services/autoSaveService.ts`.
  - narrativeStore "recordDecision" — actual store action is `addDecision` (narrativeStore.decisions.ts:20; `recordDecision` is a playerDecisionTracker method).
  - narrativeStore "setEnding" — actual: `setCurrentEnding` / `clearEnding` (narrativeStore.endings.ts:198-200).
  - loreStore "deduplicateFacts" — zero hits in `src/` (dedup machinery exists in loreStore.deduplication.ts under other names; `mergeFacts` is real).
  - Verified-correct in the same column: createWorld/updateWorld/deleteWorld/updateToneSettings, createCharacter/updateCharacter/deleteCharacter/addAttribute/updateAttribute, addItem/useItem/toggleEquipItem/clearCharacterInventory, addFact/mergeFacts, createGoal/processSegmentForGoals, addSegment/selectDecisionOption/clearSession*.
- **Why important:** these look like exact identifiers; grepping for them wastes time and casts doubt on real code.
- **Fix:** correct the five names (or trim the column to verified names only).

### I5. `examples/` is mischaracterized as a regression corpus of prior good outputs

- **File:** `narraitor-prompt-template-governance/SKILL.md` G5 ("compare against prior good outputs (examples/ + any excerpts …)"), `_expert_distillation_notes.md` §3 prompt tree step 4 ("compare manually against saved examples in src/lib/promptTemplates/examples/"), `_model_transfer_eval.md` T10 gold ("checks G5 regression against examples/").
- **Actual:** `src/lib/promptTemplates/examples/` is a few-shot **Example Library injected INTO prompts** — `exampleLibrary.ts` (curated style/format snippets), `exampleManager.ts` (token-aware selection), per its own README: "Examples guide AI output style, format, and patterns while respecting token budget constraints." It is not a set of saved prior generations, and editing it changes live prompt behavior.
- **Why important:** a session running G5 goes looking for prior good outputs there and finds prompt-side few-shot content; worse, it might "add a good output" to the library and silently change every prompt. The library's own product-frontier F5 correctly says no golden corpus exists — G5 contradicts it.
- **Fix:** in G5, drop `examples/` as a comparison source (keep "excerpts saved in earlier eval logs"); describe `examples/` in the registry section as prompt-side few-shot content whose edits multiply the eval surface (same warning as shared fragments).

### I6. `test:visual` and `test:e2e:critical` are the same command, presented as two tiers

- **File:** `narraitor-validation-and-qa/SKILL.md` tier table (separate "Visual regression" and "E2E critical" rows with different commands and different "proves" columns).
- **Actual:** package.json — `"test:e2e:critical": "playwright test --project=chromium"` and `"test:visual": "playwright test --project=chromium"` — identical; one suite (tests/visual, chromium project), two aliases. The only genuinely separate project is `tutorials`.
- **Why important:** a session may run both "suites" (doubling a long run) or cite "the e2e suite also passed" as additional coverage that doesn't exist.
- **Fix:** one row (or a footnote): "aliases of the same chromium project; the conceptual split is which assertions a spec makes, not which command runs".

---

## MINOR

### M1. Story-file count off
`_repo_capability_map.md` §2: "stories live centrally under `src/stories/` (147 files)". Actual at 4bec88e6: `find src/stories -name "*.stories.*" | wc -l` = 144. Fix the number or say "~145".

### M2. DESIGN.md staleness overstated
`_repo_capability_map.md` §7.1 / `narraitor-repo-orientation` traps: "DESIGN.md … still point at `/dev/design-system*` showcase pages as canon". DESIGN.md line 100 now explicitly names Storybook as canon and cites ADR-012; the stale residue is one line (281: "Do use the showcase pages as the spec"). `public_docs/design-system/README.md` is fully stale as claimed (lines 18/38/61). Fix: narrow the DESIGN.md claim to the residual line.

### M3. loreStore concern-file count
`narraitor-domain-reference/reference.md`: "loreStore.ts (+ 9 concern files)". Actual: 10 concern files (actions, aliases, deduplication, extraction, helpers, import-export, resolution, state, types, utils — `ls src/state/loreStore*.ts`).

### M4. CI workflow inventory incomplete
`narraitor-repo-orientation` §5 table: "`.github/workflows/ci.yml` (+ `playwright-tutorials.yml`, `codeql.yml`)". The directory also holds `playwright-focused.yml`, `deploy-storybook.yml`, `storybook-preview.yml`. The parenthetical reads as a complete list; add the others or mark it "among others".

### M5. "audit:css … always exit 0" slightly over-broad
`_repo_capability_map.md` §3. Script header (scripts/audit-css.mjs:6): "never fails CI (exit 0 on findings)" — but it `process.exit(1)`s on internal failure (:125). "Exit 0 on findings" is the accurate phrasing.

### M6. Commit hash formatted as an issue ref
`narraitor-failure-archaeology/reference.md` E11: "history shows specs mocking AI routes (#8e538a18)". That's a commit (8e538a18 "test(visual): mock AI routes in world-creation spec … (#1466)"), not an issue; the `#` invites a `gh issue view` that will fail. Write it as a bare hash or cite #1466.

### M7. README cites Phase-6 files that don't exist yet
`README.md` foundation list names `_review_factual/_doctrine/_usability.md` + `_fixer_report.md`. At review time only `_review_factual.md` exists (this file). Fine if the remaining phases land; confusing if they don't — remove or mark "produced in Phase 6" once the pass completes.

---

## Claims I could not check (and why)

- **"Storybook mocks the router as a logger"** (`narraitor-storybook-app-parity` §5.6) — behavior internal to `@storybook/nextjs`; not verifiable by grep without running Storybook. Plausible (framework default), unverified.
- **Runtime/latency claims** — "5–8s prose pop-in" (#1476), guardrail fire behavior (product-frontier F1), Gemini refusal shapes: need a live server + key; no server was started for this review. The skills already carry issue refs or instrument-first caveats for these.
- **Gate executions the skills themselves mark unverified** — `npm run build`, `deps:validate`, `knip`, `skott:check`, visual/e2e suites. Config and script existence verified; not executed (the `_uncertainty_register.md` already discloses this, so per the review rules it's not a finding). I did execute `npm test` (353/2399, exit 0 — matches).
- **Historical figures labeled stale-risk in the skills** — the ~51 tsc-error joyride number, "15+ commits" for the baseline cascade (E9), "#1352 area" vacuous-test commits: git-history mining beyond spot checks not done; the joyride number is correctly hedged in-skill.
- **Branch-protection/ruleset claims** — only referenced from project memory, not asserted in the new skills; needs admin API access anyway.
- **`docs/` planning-vault contents** — gitignored; confirmed ignored (`.gitignore:104`) but contents not audited (the skills only say "don't trust it", which needs no audit).
- **Node/npm "known-good" range** — session env matches the claim exactly (node v24.16.0, npm 11.13.0) but the supported-range question is owner-confirmation-needed, as the skills already state.
- **#1494** (checked per brief: OPEN, "Visual polish backlog — 2026-06-28") — no claim in the new library cites it, so nothing to compare.
