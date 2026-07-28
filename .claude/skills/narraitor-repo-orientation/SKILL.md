---
name: narraitor-repo-orientation
description: Fast orientation map for a zero-context session in the Narraitor repo. Use FIRST when starting work here, when asked "where does X live", "how is this repo organized", "what's the stack", "where do I look for the stores / AI code / themes / tests", or to check WHICH docs are trustworthy before acting on one. (Asking WHY something is built this way -> narraitor-failure-archaeology; fixing or correcting a stale doc -> narraitor-docs-and-writing; "where do prompts live" -> narraitor-prompt-template-governance.)
---

# Narraitor repo orientation

## 1. Purpose
Get a cold session productive in minutes: where things live, which commands exist, which docs are canonical, and which claims to distrust. This is the map, not the manual — deeper rules live in the sibling skills.

## 2. When to use
- First substantive action in a fresh session or after a long gap.
- Any "where is / where do I look" question about this repo.
- Before citing a doc's claim about structure, tooling, or design-system canon.

## 3. When not to use
- You already know the target file — go read it.
- Authoring new components/stores/routes → use `narraitor-architecture` (conventions) and `narraitor-architecture-contract` (invariants).
- Debugging a concrete failure → `narraitor-debugging-playbook`.

## 4. Inputs required
None. Repo checkout on `develop` (run `git fetch && git status` first — never orient against a stale checkout).

## 5. Procedure

1. Read `CLAUDE.md` (repo root) — the operating manual. Then this map.
2. Locate by concern:

| Concern | Look here first |
|---|---|
| App data / state | `src/state/` — one Zustand store per domain; persistence seam `src/state/persistence.ts` (IndexedDB db `narraitor-state`) |
| Cross-store cascades | `src/lib/state/storePubSub.ts` + `src/state/storeEventWiring.ts` |
| AI generation | `src/lib/ai/` — model strings in `src/lib/ai/config.ts`; client fetch seam `src/lib/ai/aiFetch.ts`; server key resolution `src/lib/ai/resolveApiKey.ts` |
| Prompt templates | `src/lib/promptTemplates/` (registry: `narrativeTemplateManager.ts`); context/token budget in `src/lib/promptContext/` |
| Server endpoints | `src/app/api/**/route.ts` (19 routes: narrative/*, generate-*, ai/*, inventory/*) |
| Client→API seam | `src/lib/api/` — components call these services, never raw fetch (dependency-cruiser enforces) |
| UI components | `src/components/<Domain>/` with co-located `.css`; stories centralized in `src/stories/` |
| Theming / tokens | `src/lib/theme/themes/{_shared-tokens,ds3}.css`; `ThemeProvider.tsx`; localStorage `narraitor-color-scheme` (light/dark only — ADR-013 deleted DS1/DS2 and the `narraitor-theme` key with them) |
| Pages | `src/app/` (App Router); dev harnesses under `src/app/dev/*` (knip-exempt, not production canon) |
| Unit tests | co-located `src/**/__tests__` + `src/**/*.test.*`; config `jest.config.cjs` |
| Visual/e2e tests | `tests/visual/**/*.spec.ts`; baselines `*-chromium-darwin.png`; config `playwright.config.ts` |
| CI gates | `.github/workflows/ci.yml` (+ `playwright-tutorials.yml`, `codeql.yml`) |
| Scripts/tools | `scripts/` — check package.json before assuming a script is wired |

3. Command quick-reference (details + failure modes: `narraitor-build-test-env`):
   `npm run dev` (3000 main / derived port in worktrees) · `npm run storybook` (6006) · quality gate = `npm test` + `npm run type-check` + `npm run lint` + `npm run lint:css`.
4. Docs of record: `public_docs/` (ADR-001…012 under `public_docs/architecture/`, roadmap at `public_docs/development/mvp-roadmap.md`), `README.md`, `DESIGN.md`, `.github/` templates.
5. Check the do-not-trust list (below) before acting on any doc claim.

## 6. Evidence required
Before repeating any structural claim (path, script, route, store field): confirm it with `ls`/glob/grep in the current tree. Docs and memories describe the past; the tree is the present.

## 7. Output artifact
An oriented session. If asked to summarize, produce a short "where I'll look and why" note with verified paths — not a re-dump of this map.

## 8. Common traps
- **Do NOT trust blindly:** `docs/` (gitignored planning vault — point-in-time plans, several completed/superseded); residual `/dev/design-system*` references in `DESIGN.md` and `public_docs/design-system/README.md` (those pages are retired — Storybook is canon per ADR-012; DESIGN.md largely reflects this now, but residual lines linger); `public_docs/features/ai-systems.md` model name `gemini-2.0-flash` (actual: `gemini-2.5-flash`); ADR-007 Tailwind content (historical — Tailwind/cva/cn() removed in #1097); and parts of the PRE-EXISTING skills: `narraitor-architecture`/`narraitor-pattern-alignment-skill` still carry shadcn-era mentions and `style-port` cites a token path that no longer exists (tokens live in `src/lib/theme/themes/_shared-tokens.css`) — where they conflict with `narraitor-architecture-contract`, the contract wins.
- Bad behavior this prevents: a session reads `DESIGN.md`, navigates to `/dev/design-system`, finds nothing, and "helpfully" rebuilds a living style guide that was deliberately deleted.
- Port 3000 may be held by an orphan `next dev` or another project — `lsof -nP -iTCP:3000 -sTCP:LISTEN` before blaming code.
- `src/app/dev/*` harnesses are development sandboxes: patterns there are NOT production conventions.
- No Tailwind. Plain CSS + design tokens (`var(--token)`) + `clsx`. Any utility-class or `cn()` suggestion is a regression.

## 9. Related skills
`narraitor-build-test-env` (run/verify commands) · `narraitor-architecture-contract` (invariants) · `narraitor-domain-reference` (applied domain knowledge) · `narraitor-failure-archaeology` (settled battles) · existing `narraitor-architecture` (authoring conventions).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `ls src/state src/lib/ai src/lib/api src/lib/theme/themes && find src/app/api -name route.ts | wc -l` (expect ~20 routes)
- `grep -n "gemini-" src/lib/ai/config.ts` (current model strings)
- `git log --oneline -5` (has the world moved since this map?)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- Route count and `/dev/*` harness list drift as features land; counts here are a snapshot.
- `docs/` vault contents were sampled, not exhaustively read.
