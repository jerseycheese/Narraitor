# Repository Guidelines

## Project Structure & Module Organization
- App code in `src/` organized by domain: `app/` (routes + API), `components/`, `state/` (Zustand), `lib/` (AI, utils, services), `types/`, `utils/`.
- Tests colocated under `__tests__/` folders or `*.test.ts(x)` next to code.
- Public assets in `public/`; Storybook stories in `src/stories/`; Playwright output in `playwright-report/` and `playwright-test-results/`.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js locally on port 3000.
- `npm run build` — Build app and Storybook; copies `storybook-static/` into `public/`.
- `npm start` — Run the production build.
- `npm run storybook` — Storybook for component development.
- `npm test` / `npm run test:coverage` — Jest unit tests (with coverage).
- `npm run test:e2e:critical` — Playwright critical E2E suite.
- `npm run test:visual` — Visual regression; run `npm run test:visual:update` to update snapshots.
- `npm run lint` and `npm run lint:css` — ESLint and Stylelint checks.

## Coding Style & Naming Conventions
- TypeScript everywhere; components in `PascalCase` (`ComponentName.tsx`), hooks `useXyz.ts`.
- Prettier: 2 spaces, single quotes, trailing commas (`.prettierrc`).
- ESLint: Next.js core web vitals + custom rule `design-tokens/no-hardcoded-colors` (no raw colors in TS/TSX).
- Stylelint forbids hex and `rgb(a)`; use Tailwind tokens or `hsl(var(--...))` and `theme()`.

## Architecture Overview
- Next.js 15 App Router in `src/app` with API routes under `src/app/api`.
- State via Zustand stores in `src/state`; persistence uses IndexedDB with graceful fallbacks.
- AI integration in `src/lib/ai`, accessed only through server/API code using `@google/genai`.
- Design system uses Tailwind and design tokens; avoid hardcoded colors (see ESLint/Stylelint rules).
- Testing layers: Jest unit/integration; Playwright for critical E2E and visual regression.

## Testing Guidelines
- Unit/integration: Jest + Testing Library. Name tests `*.test.ts` or `*.test.tsx` or place in `__tests__/`.
- Visual/E2E: Playwright. Seed data with `npm run test:visual:seed` before visual runs; update baselines intentionally via `test:visual:update`.
- Keep tests deterministic; mock network/AI where practical (`src/__mocks__`, `src/lib/__mocks__`).

## Commit & Pull Request Guidelines
- Commits: imperative, concise, scoped (e.g., "Fix visual regression timeout"), reference issues (`#123`) when relevant.
- PRs: include summary, screenshots for UI changes, steps to reproduce/verify, and linked issues.
- Required before merge: `npm test`, `npm run lint`, and Playwright checks passing or justified snapshot updates.

## Security & Configuration
- Copy `.env.example` to `.env.local`; set `GEMINI_API_KEY`. Never commit secrets.
- All AI calls go through API routes; do not expose keys client-side. Respect rate limits.

## MCP & Playwright Integration
- Public guidance only. For step‑by‑step local setup and host‑specific notes, see `AGENTS.local.md` (ignored) and use `AGENTS.local.example` as a template.
- Key point: local MCP should launch Playwright via `scripts/mcp-playwright.sh` to ensure clean, ephemeral sessions (prevents blank tabs). Details and config snippets are in the local doc.
- Visual/E2E testing (`npm run test:e2e:critical`, `npm run test:visual`) is unchanged; the wrapper only affects MCP‑driven browser actions.
