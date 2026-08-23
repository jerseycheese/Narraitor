# Failure archaeology — full entries

Format per entry: Symptom → Investigation/wrong path → Root cause → Evidence → Doctrine → Where encoded.
Evidence labels: known (verified 2026-07-04 session), observed (discovery-agent read), candidate.
Append new entries at the bottom; never rewrite existing ones (corrections per change-control).

---

## E1. The Tailwind removal (#1097 and fallout)

- **Symptom:** Utility-class styling and token systems fought each other; three design systems couldn't differentiate structurally.
- **Wrong path:** Incremental coexistence — keeping cva/cn() while adding tokens produced two sources of truth.
- **Root cause:** Utility classes encode design decisions in markup, unmanageable across ds1/ds2/ds3.
- **Evidence:** known — no tailwind deps in package.json; ADR-007 marked historical; multiple dead-code sweeps cleaning fallout (#1507 etc.).
- **Doctrine:** Plain CSS + design tokens + clsx. Any Tailwind/cva/cn() suggestion is a regression. Docs mentioning them are historical.
- **Encoded in:** architecture-contract I9, repo-orientation traps.

## E2. eval(require()) store access (#1206)

- **Symptom:** Cross-store code used dynamic `eval(require())` imports; dependency tooling was blind to real edges.
- **Root cause:** Working around circular imports dynamically instead of structurally.
- **Evidence:** observed — history sweep found no eval patterns post-#1206; dep-cruiser + skott now guard.
- **Doctrine:** Static imports only; circularity is solved by the event bus or restructuring, never dynamism.
- **Encoded in:** architecture-contract I3.

## E3. StoreEventBus — looks like overengineering, isn't

- **Symptom:** Simplification audits repeatedly flag `src/lib/state/storePubSub.ts` as indirection.
- **Wrong path:** Inlining cascade deletes as direct cross-store calls — recreates the circular-import problem E2 came from.
- **Root cause of its existence:** worldStore can't import characterStore/npcStore/goalStore/loreStore (and vice versa) without cycles; deletion cascades need a decoupled channel.
- **Evidence:** known — bus + wiring exist; #1505 completed the WORLD_DELETED cascade AND fixed loreStore's migrate wiping lore, showing how subtle this seam is.
- **Doctrine:** The bus stays. New cascades = new event + wiring entry, not direct calls.
- **Encoded in:** architecture-contract I2, failure-archaeology index.

## E4. react-joyride pin (3.0.0-7)

- **Symptom:** Dependency-update passes flag `react-joyride: 3.0.0-7` as an outdated prerelease.
- **Wrong path:** Bumping to stable 3.x — it's a @floating-ui positioning rewrite; the attempt produced ~51 tsc errors (remembered figure, stale-risk) and was abandoned.
- **Evidence:** known — pin + react/react-dom overrides in package.json (the overrides force React 19 compat, another sign this is deliberate).
- **Doctrine:** The pin is a decision. Bumping = scoped migration issue with tutorial visual-spec proof, not a routine update.
- **Encoded in:** failure-archaeology index; domain-reference (tutorial system).

## E5. ExportService and the wrapper-service purge

- **Symptom:** Service classes that merely wrapped store calls added a hop with no behavior.
- **Evidence:** observed — ExportService gone from tree (zero grep hits in docs sweep); history shows collapse into `createAutoSave` factory.
- **Doctrine:** No wrapper-service layer; `src/services/` is for real logic (e.g., characterDeletionService's cascade cleanup), not pass-throughs. Note the asymmetry: `src/lib/api/*` service modules are NOT wrappers-for-wrapping's-sake — they own the fetch/error/key-header contract (#1508).
- **Encoded in:** architecture-contract I8, I4.

## E6. Living style guide → Storybook canon (ADR-011 → ADR-012)

- **Symptom:** `/dev/design-system{,-2,-3}` pages drifted from production components; two canons.
- **Evidence:** observed — ADR-012 file; routes deleted (#1488); `verify-ds-canon.cjs` guard with `.ds-canon-baseline.json` grandfathering; DESIGN.md still stale-references the old pages (open doc debt).
- **Doctrine:** Storybook is the single canon surface. Never rebuild style-guide routes. Fix stale doc refs when touched.
- **Encoded in:** storybook-app-parity, repo-orientation, docs-and-writing.

## E7. streamResilience — built unwired, died unused (#903 → deletion)

- **Symptom:** A stream-resilience middleware shipped with no caller; sat for months; deleted in a dead-code sweep.
- **Evidence:** known — `grep -rn resilientStream src` returns nothing (2026-07-04); project memory still claimed it existed unwired (now-stale memory, a live demonstration of doc decay).
- **Doctrine:** (a) Infrastructure lands WITH its caller or not at all. (b) Streaming the narrative (#1476) starts from scratch — don't go hunting for the old middleware. (c) Out-of-repo memory decays; re-verify.
- **Encoded in:** change-control, product-frontier (#1476 entry), expert notes §1.

## E8. The hallucinated revert — a lesson from building this very library

- **Symptom:** During this library's authoring (2026-07-04), a discovery agent reported "personalizationEngine rollback (#1195), the single true revert in ~400 commits" — and the authoring session encoded it as fact.
- **Wrong path:** Trusting agent-mediated history mining without spot-verification.
- **Root cause:** The claim was fabricated: PR #1195 is a merged design-system wizard PR; no personalization revert exists in history; `src/lib/ai/personalizationEngine.ts` was never deleted (caught by the factual review pass, which also corrected a wrong persist-key table from the same discovery batch).
- **Evidence:** known — `_review_factual.md` B-findings; `gh pr view 1195`.
- **Doctrine:** (a) Claims produced by subagents are `observed` at best, never `known`, until spot-checked against `git log`/`gh` directly. (b) The narrower/more superlative the claim ("the single X in history"), the more it demands direct verification — superlatives are where hallucinations hide. (c) This library is subject to its own rules; its corrections are documented in `_fixer_report.md`.
- **Encoded in:** failure-archaeology index; change-control evidence tiers; uncertainty register process caveats.

## E9. Visual-baseline cascade (recurring, 15+ commits)

- **Symptom:** A shared-chrome CSS change (sidebar, header, card footers) diffs a dozen fullPage baselines across unrelated specs; sessions chased them one spec at a time.
- **Wrong paths:** Regenerating single specs serially; regenerating on Linux (guaranteed diffs — baselines are `-chromium-darwin`); bumping diff thresholds.
- **Root cause:** fullPage screenshots frame shared chrome; any chrome shift cascades. Sticky header + 100vh sidebar also mis-place in fullPage captures.
- **Evidence:** observed — 199 macOS baselines; repeated baseline-adoption commits (e.g. around #1317, #1221, #1283).
- **Doctrine:** Prefer locator screenshots; when chrome legitimately changes, enumerate and regenerate ALL affected baselines in one commit, on macOS, with a one-line justification; single-spec height diff = stale base (rebase, don't chase).
- **Encoded in:** validation-and-qa, debugging-playbook.

## E10. E2E seeding and hydration races (recurring)

- **Symptom:** Seeded store state vanishes or half-applies in e2e; flaky specs blamed on Playwright.
- **Wrong path:** `addInitScript` seeding (races persist rehydration) and blind timeout bumps.
- **Root cause:** Zustand persist rehydrates from IndexedDB asynchronously; seeding before `hasHydrated` gets overwritten.
- **Evidence:** observed — `tests/visual/global.setup.ts` + seedTestData dual-seed IndexedDB/localStorage; specs wait on hydration.
- **Doctrine:** Seed AFTER hydration (`waitForFunction(persist.hasHydrated)` then `evaluate`), or via the established seed helpers; never re-invent seeding inline in a spec.
- **Encoded in:** validation-and-qa, debugging-playbook, domain-reference.

## E11. AI calls escaping the test gate

- **Symptom:** Visual runs hang for minutes, then time out; diffs show spinners.
- **Root cause:** A component fires an on-mount AI fetch not gated by `isPlaywrightEnv()`.
- **Evidence:** observed — gate sites across NarrativeController, useStoryCheckpointManager, useActiveGameSessionJournal, EndingScreen; history shows specs mocking AI routes (commit 8e538a18).
- **Doctrine:** Any render-path AI call must be gated on `isPlaywrightEnv()` (do NOT broaden it to `navigator.webdriver` — that leaks DevTools suppression into other automation). New on-mount fetches get a gate review.
- **Encoded in:** debugging-playbook, domain-reference.

## E12. Ambient @google/genai types

- **Symptom:** tsc errors on SDK fields that "definitely exist" per upstream docs.
- **Root cause:** `src/types/@google/genai.d.ts` REPLACES the SDK's types (deliberate, to control the surface); new fields must be declared there.
- **Evidence:** known — file exists and declares GoogleGenAI/GenerationConfig/etc.
- **Doctrine:** Extend the ambient file; don't bump the SDK to chase types; don't cast to any.
- **Encoded in:** debugging-playbook, domain-reference.

## E13. Model-name decay (gemini-2.0-flash → 2.5)

- **Symptom:** Docs and old issues reference `gemini-2.0-flash`; a session "fixes" code back toward docs, or smoke-tests the wrong model.
- **Evidence:** known — `src/lib/ai/config.ts` says `gemini-2.5-flash` / `gemini-2.5-flash-image`; `public_docs/features/ai-systems.md` still says 2.0 (stale).
- **Doctrine:** Model names are config, verified by grep at time of use; docs about models are stale-by-default.
- **Encoded in:** repo-orientation, diagnostics-and-tooling.

## E14. Rigged and vacuous tests (cleanup arc)

- **Symptom:** Suites that passed while proving nothing (no expects, resolve-only async tests missing the reject path).
- **Evidence:** observed — eslint-jest guards (`expect-expect`, `no-disabled-tests`, `no-commented-out-tests`) added; vacuous-test cleanup commits (#1352 area).
- **Doctrine:** Test the reject path of async handlers explicitly; a test without a meaningful assertion is deleted, not kept for coverage numbers. Never rig.
- **Encoded in:** validation-and-qa.

## E15. PageLayout self-closing SSR trap

- **Symptom:** Self-closing `<PageLayout />` caused SSR issues; now lint-blocked.
- **Evidence:** observed — `scripts/verify-page-layout-usage.cjs` + `lint:layout-usage` CI gate exist solely for this.
- **Doctrine:** Always `<PageLayout>...</PageLayout>`; if the linter blocks you, that's the lesson working — don't bypass.
- **Encoded in:** build-test-env gate table.

## E16. God-file stores and the split pattern

- **Symptom:** narrativeStore/loreStore grew past maintainability; audits repeatedly flagged them.
- **Resolution:** Split into `<store>.<concern>.ts` modules (state/actions/persistence/types…) — the split IS the sanctioned pattern; inventoryStore (~1,100 lines) is the remaining candidate (#1415).
- **Evidence:** known — `src/state/` listing shows the split families.
- **Doctrine:** Don't re-merge split store files "for simplicity"; don't split ad-hoc either — follow the existing concern-file naming, as its own scoped issue.
- **Encoded in:** architecture-contract weak points.

---

(Add new entries below this line, following the same format. Append-only.)

## E17. Making the prose answer a character-sheet fact (#1828, closed unfixed 2026-08-23)

- **Symptom:** When the player raised a fact from their own sheet, the prose gave a generic reaction instead of having a named NPC answer it. Filed as F26 of the #1818 playtest campaign.
- **Wrong path:** Thirteen measured rounds, almost all of them wording rounds on `sceneTemplate.ts`. Each killed the failure it targeted and produced a new one — the same pattern #1872 had already shown. Two draft PRs (#1925, #1927) reached CI-green and neither could merge.
- **Root cause of the dead end:** engagement and invention are the same reflex. Round 13's block got a named NPC answering with the player's specifics on 7/9 Harrowgate raises against 1/9 without it, and invented player history (relatives, events the sheet never carried) on 7/9 of those same raises. The invented names then persisted as `world-shared` lore facts. Two structural follow-ons each closed part of it and left the rest: the #1926 player-sheet guard took kin-tied entries from 28 flagged to 5 with 0 incorrect drops of 32, but the name walked back in kin-free (24 kept entries under the guard alone), and a simulated session quarantine list caught 15 of those 24 against a gate of 2 while colliding with real on-screen NPCs that share first names with the invented ones.
- **Evidence:** known — eval logs `1828-raised-background-answered.md` and `1926-player-sheet-guard.md`; the full replay, judge items, unblinding map and scripts under `~/.claude/projects/-Users-jackhaas-Projects-personal-narraitor/artifacts/1926-replay/`; the closing comments on #1828 and #1926.
- **Doctrine:**
  (a) **Do not reopen #1828 with a wording round.** New evidence has to be a different mechanism, not different words in the same block. Presence-gating is not a shippable subset either: the invention happened where NPCs *were* present.
  (b) **Split A/B flags by which build wrote the prose before claiming a bug exists on develop.** The #1926 guard read as a 28-to-5 win until the split showed all 28 came from treatment-build prose and 0 from control — it was a prerequisite for an unshipped block, not a standalone fix, and on develop it dropped four true entries for one catch.
  (c) **A prompt change that trades one named failure for another is a stop signal, not a tuning signal.** Two rounds of that (here and #1872) is enough to conclude the lever is wrong.
  (d) **Prefer measurements that settle several claims at once.** This arc spent live sessions and blind judges per round to move one issue. The #1829 instrumented run reads out four.
- **Encoded in:** failure-archaeology index; ai-quality-discipline (the stop rule); playtest-loop.
