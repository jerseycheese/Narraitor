# Narraitor

Play a story that answers to the world you built. Define a setting, create a character, and make the choices that steer what happens. Your decisions get tested against your character's skills, so what happens next is earned.

**[Play it at narraitor-six.vercel.app](https://narraitor-six.vercel.app/)**. No account, runs in your browser, on a Google Gemini key you bring.

## What this actually does

The core idea came from wanting tabletop RPG experiences that could happen anytime, without coordinating schedules or finding a game master. You define a world's rules, attributes, and tone; create characters that fit it; then play through a generated story that responds to your choices.

The storytelling adapts to the world you described, so a noir detective setting reads completely differently from a space opera. Middle Earth, the beaches of Normandy, something you invented last week: all fair game.

## What to know before you start

**You bring your own key.** Generation runs on a [Google Gemini](https://aistudio.google.com/apikey) key you provide once under Settings, then Providers. It's encrypted in your browser and sent per request, so the stories you generate run on your own account.

**It runs on your device.** Worlds, characters, and saves live in your browser's storage (IndexedDB). There's no backend database and no server-side copy of your games. Settings has export/import if you want a backup or you're moving between browsers, and clearing site data really does delete everything.

**No accounts.** Nothing to sign up for, no profile, no email.

## What you can do

**Build a world.** Describe a setting and the creation wizard suggests attributes and skills that fit it ("Force Sensitivity" for Star Wars, "Sanity" for Lovecraft), all of which you can edit, replace, or write yourself.

**Create characters.** Multi-step creation that works off your world's rules: allocate attribute points, pick skills that make sense for the setting, write a background. Portraits get generated to match.

**Play the story.** Pick from suggested choices or type your own action. Decisions get weighted Minor, Major, or Critical so you can see what's actually at stake, and alignment tracking (Lawful, Neutral, Chaotic) keeps a read on how your character has been playing.

**Keep track of it.** A journal drawer holds story history and past decisions, inventory tracks what you're carrying, and "Story So Far" summaries capture where things stand, which also keeps long campaigns coherent.

**Finish it.** When a story's reaching its natural end, you get an ending suggestion and a generated conclusion, so a campaign gets a real ending.

**Take it with you.** Settings exports everything (worlds, characters, sessions, journal, narrative, inventory, and lore) as a JSON file you can re-import later.

---

The rest of this is for running Narraitor locally or working on it.

## Running it locally

You'll need Node 20 (see [.nvmrc](.nvmrc)), npm, and a Google Gemini key. Nothing generates without the key, but you don't need it to install; add it through Settings, then Providers once the app is running, the same way players do.

```bash
git clone https://github.com/jerseycheese/narraitor.git
cd narraitor
npm install
npm run dev
```

That's it. The app comes up on `localhost:3000` at the landing page, and **Build your world** starts the wizard.

If you'd rather use a server-side key than go through the provider settings screen (handy locally so you're not re-entering it), copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`. That's a fallback for local work only; in normal use the player's own key wins.

> Running from a git worktree? `npm run dev` picks a stable per-worktree port automatically (the main checkout keeps 3000), so multiple worktrees can run side by side without fighting over the port. The chosen URL is printed on startup; set `PORT` to override.

## Development

The approach here is component-first with Storybook and TDD: build components in isolation, then integrate them. It keeps things manageable.

```bash
npm run storybook      # component catalog on :6006
npm run test           # Jest
npm run type-check     # tsc --noEmit
npm run lint           # ESLint
npm run lint:css       # Stylelint
```

Run the last four before committing; CI runs them separately and the production build enforces lint and types anyway.

Worth knowing about `npm run build`: it builds the app *and* Storybook, then copies the static Storybook output into `public/`. If you just want to check the app compiles, `npm run build:app` is the faster one.

There are also `/dev` routes for exercising components against real data without walking the whole app flow: `/dev/game-session`, `/dev/world-generation`, and eight more. For the full themed component catalog, Storybook is the place.

Contributor PRs should target `develop` (see [Branches and releases](#branches-and-releases) below).

## How it's organized

Next.js 15 with the App Router. The structure follows domain-driven design, so related functionality stays together:

```
src/
├── app/           # Next.js pages and API routes
├── components/    # UI components (organized by domain)
├── state/         # Zustand stores for each domain
├── lib/           # AI services, theme tokens, generators, utilities
├── services/      # cross-domain service logic
├── hooks/         # shared React hooks
├── stories/       # Storybook stories
├── styles/        # global and shared CSS
├── types/         # TypeScript definitions
└── utils/         # helper functions
```

Components are grouped by domain (World, Character, Narrative, and so on) rather than by type, so you'll find `components/world/SkillEditor/` instead of `components/editors/SkillEditor/`.

## Under the hood

**World and character creation.** Multi-step wizards that adapt to each other: the world defines the attributes and skills, and character creation allocates against them. AI suggestions seed both, and everything stays editable.

**Narrative engine.** Gemini handles generation through Next.js API routes (`/api/narrative/generate`, `/api/narrative/choices`, and others). The interesting part is context management: prompts carry your world's rules, character details, and recent story history so what gets generated stays consistent with the setting.

**State and persistence.** Zustand stores backed by IndexedDB, one store per domain. Sessions survive a browser restart, and if IndexedDB is unavailable the storage layer falls back to memory-only so the app still runs. It just won't persist, and it says so.

**Provider keys.** A player's key travels from the browser to the API routes in a per-request header (`x-provider-api-key`), gets used server-side for that single call, and is never logged or persisted. At rest in the browser it's encrypted. The `GEMINI_API_KEY` env var is a local/dev fallback that stays server-side.

**Rate limiting & route protection.** All 17 AI routes are wrapped by `withAIRoute` with in-memory per-IP rate limiting (50 requests per hour in production, looser in development; per-instance on serverless), a 64KB request body size cap (HTTP 413), and server-enforced max output token ceilings (`SERVER_MAX_OUTPUT_TOKENS = 4096`). Upstream provider errors are normalized to sanitize raw upstream error messages and prevent credential leakage.

**Design system.** Narraitor ships a single design system, DS3 ([ADR-013](public_docs/architecture/ADR-013-collapse-to-single-design-system-ds3.md)). Plain CSS with design tokens, no Tailwind. [DESIGN.md](DESIGN.md) is the AI-readable surface for tokens and components, and [public_docs/design-system/](public_docs/design-system/) has the full reference. Storybook (`npm run storybook`) is the single canon surface: every component, themed, with mock data and no backend, plus a light/dark switcher in the toolbar. See [ADR-012](public_docs/architecture/ADR-012-storybook-single-canon-surface.md).

**Images.** Beyond character portraits there's generation for world, journal, item, and ending images. [public_docs/features/portrait-generation-guide.md](public_docs/features/portrait-generation-guide.md) covers how the portrait side works.

## Branches and releases

Two branches matter. `main` is the latest tagged release and the default clone target, so pin here if you want something stable. `develop` is the rolling integration line where in-flight work lands, which means it may include partial features at any given moment. Contributor PRs should target `develop`.

Release notes for each tagged version live in [RELEASES.md](RELEASES.md).

## Roadmap

Version 1.0 shipped in August 2026: a single-player release you run in your browser with your own key, no account needed. The releases since have been refinements rather than big new features, and each one is written up in [RELEASES.md](RELEASES.md). The current version is 1.6.

Recent work: a visual redesign, generated images for worlds and journal entries and endings, better keyboard support, longer stories that stay consistent turn to turn, and the option to generate with OpenAI or OpenRouter instead of Gemini (or your own server, if you run one).

The next version, [1.7](https://github.com/jerseycheese/Narraitor/milestone/8), makes what the story takes away from you land as a consequence of your choices rather than something that would have happened regardless.

There are no plans for accounts or cloud saves: Narraitor stays on your device unless a clear reason to change that turns up, and [the reasoning is written down](public_docs/architecture/ADR-014-browser-local-until-named-trigger.md). Further out, the ideas worth exploring are shared worlds, voice narration, and mobile apps.

## License

MIT. See the [LICENSE](LICENSE) file for details.
