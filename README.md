# Narraitor

AI-powered storytelling app that basically lets you play through narrative RPG experiences in any world you can imagine, fictional or non-fictional. Maybe you want to explore Middle Earth? Storm the beach at Normandy? Design something completely original? Narraitor adapts the AI storytelling to match your world's themes and tone.

> **A quick note on the UI**: I know it's pretty basic right now. I'm focused on building the foundational systems first - the storytelling engine, world mechanics, character progression. The plan is to eventually have worlds auto-skin their interfaces to match their genres. Think sleek sci-fi panels for space opera, weathered parchment for fantasy, noir shadows for detective stories. Right now it's all about getting the framework solid.

## What This Actually Does

The core idea came from wanting tabletop RPG experiences that could happen anytime, without coordinating schedules or finding a game master. Narraitor uses Google's Gemini AI to generate dynamic stories that respond to your choices, but here's the key part: it's not just generic fantasy. You define your world's rules, attributes, and tone, and the AI storytelling adapts to match exactly what you're going for.

## Branches

The repo has two branches that matter. `main` is the latest tagged release and the default clone target — pin here if you want something stable. `develop` is the rolling integration line where in-flight work lands, so it may include partial features at any given moment. Contributor PRs should target `develop`.

Release notes for each tagged version live in [RELEASES.md](RELEASES.md).

## Key Features

**World Creation**: You can define any fictional universe with custom attributes (like "Force Sensitivity" for Star Wars or "Sanity" for Lovecraft) and skills that make sense for your setting. The AI wizard helps suggest appropriate mechanics based on your world's theme.

**Character Building**: Multi-step character creation that works with your world's rules. Allocate attribute points, pick relevant skills, write backstories; all tailored to fit your specific fictional universe.

**Adaptive AI Storytelling**: This is where it gets interesting. The AI doesn't just generate generic fantasy stories. It learns your world's tone, themes, and mechanics, then creates narratives that feel authentic to that universe. Playing in a noir detective setting feels completely different from space opera adventures.

**Smart Choice Systems**: Decisions get weighted as Minor/Major/Critical so you can see what really matters. Plus there's alignment tracking (Lawful/Neutral/Chaotic) with visual indicators, which helps maintain character consistency.

**Session Persistence**: Your games save automatically using IndexedDB, so you can pick up where you left off. No more lost progress when you close the browser.

## Additional Features

**Template Worlds**: Don't want to build from scratch? Start with pre-configured worlds like Western, Sitcom, or high Fantasy, then customize from there.

**AI Character Portraits**: Generate visual representations of your characters that match their descriptions and world settings.

**Custom Player Actions**: Type any action you want to try instead of being limited to AI-suggested choices.

**In-Session Journal**: Review story history and past decisions through a floating journal button during gameplay.

**Story Endings**: AI-suggested narrative conclusions help you wrap up campaigns when you're ready to finish.

**Export/Import**: Save and share your worlds, characters, or sessions as JSON files for backup or collaboration.

**Developer Tools**: Built-in debugging panel for inspecting application state and testing features.

**Story Checkpoints**: Capture "story so far" summaries at pivotal moments to keep long campaigns coherent.

## Getting It Running

You'll need Node.js (v18+), npm, and a Google Gemini API key. For local development the key lives in a server-side env file (`GEMINI_API_KEY`, below). In normal use, players bring their own key — see [AI Integration Details](#ai-integration-details).

```bash
# Clone and set up
git clone https://github.com/jerseycheese/narraitor.git
cd narraitor
npm install

# Add your API key
cp .env.example .env.local
# Edit .env.local and add: GEMINI_API_KEY=your-key-here
# Optional: enable token-budget-based prompt truncation
# (keeps long-running sessions from ballooning prompt size)
# ENABLE_TOKEN_BUDGET_MANAGER=true

# Feature flags (default off)
# NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING=false
# NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE=false
# NEXT_PUBLIC_FEATURE_VIRTUALIZATION=false

# Fire it up
npm run dev
```

The app runs on `localhost:3000`. You'll see the world creation wizard first: either pick a template or build your own universe.

> Running from a git worktree? `npm run dev` picks a stable per-worktree port automatically (the main checkout keeps 3000), so multiple worktrees can run side by side without fighting over the port. The chosen URL is printed on startup; set `PORT` to override.

## Development Setup

I've been using a component-first approach with Storybook and TDD. Basically, build components in isolation first, then integrate them. It keeps things manageable.

```bash
# Component development
npm run storybook

# Testing
npm run test
npm run test:prompt-templates  # AI prompt validation

# Interactive testing
npm run dev
# Then visit /dev routes for component testing
```

There are several `/dev` routes for testing components interactively: `/dev/world-creation-wizard`, `/dev/game-session`, `/dev/design-system`, etc. These let you test components with real data without going through the full app flow.

### Feature Flags

We use feature flags to safely roll out major changes. Configure them in `.env.local` and use the helper:

```typescript
import { isFeatureEnabled } from '@/lib/featureFlags';

if (isFeatureEnabled('BUFFERED_STREAMING')) {
  // new path
} else {
  // current path
}
```

## How It's Organized

Using Next.js 15 with App Router. The structure follows domain-driven design, so related functionality stays together:

```
src/
├── app/                    # Next.js pages and API routes
├── components/             # UI components (organized by domain)
├── state/                  # Zustand stores for each domain
├── lib/                    # AI services and utilities  
├── types/                  # TypeScript definitions
└── utils/                  # Helper functions
```

The components are grouped by domain (World, Character, Narrative, etc.) rather than by type. So you'll find `components/world/SkillEditor/` instead of `components/editors/SkillEditor/`. Makes it easier to find related functionality.

## Roadmap

The core MVP functionality is basically complete - you can create worlds, build characters, play through AI-generated stories, and everything persists properly. The focus now has shifted to polish and getting things ready for a proper 1.0 release.

### What's Already Working

The foundation is solid:
- **World Creation System** with AI assistance and template worlds
- **Character Building** with point allocation and progression
- **AI Narrative Engine** with story generation and choice systems
- **Session Persistence** using IndexedDB with graceful fallbacks
- **Visual Regression Testing** with Playwright ([#384](https://github.com/jerseycheese/Narraitor/issues/384))
- **Toast Notification System** for user feedback
- **Navigation & State Management** with automatic saves
- **Decision Weight System** (Minor/Major/Critical choices)
- **Character Alignment Tracking** (Lawful/Neutral/Chaotic)

### Current Focus: Polish & Cleanup

Making what exists work really well:

**Journal System Completeness** 
- Entry viewing with proper formatting
- Choice and outcome tracking
- Session boundary logging

**Character System Improvements**
- Better attribute point distribution
- In-game character reference access
- Post-creation character modifications

**World Configuration Polish**
- Custom attribute definition capabilities
- Improved AI suggestion workflows

### Developer Infrastructure

Because debugging production issues without proper tools is a nightmare:

**Error Reporting & Monitoring**
- Runtime error capture and display
- Comprehensive error reporting system
- AI service error monitoring

**Debugging Tools**
- Application state modification interfaces
- Component visibility debugging
- Console access for debugging functions

**AI Service Improvements**
- Request/response monitoring and logging
- Decision relevance scoring ([#666](https://github.com/jerseycheese/Narraitor/issues/666))
- Performance measurement tools

### Testing & Quality

Making sure things don't break when I change stuff:

**Visual Testing Enhancements**
- [Cross-platform Docker consistency](https://github.com/jerseycheese/Narraitor/issues/653)
- [Advanced flakiness mitigation](https://github.com/jerseycheese/Narraitor/issues/654)
- [Visual diff review workflow](https://github.com/jerseycheese/Narraitor/issues/652)
- [Performance monitoring](https://github.com/jerseycheese/Narraitor/issues/656)
- [Component library generation](https://github.com/jerseycheese/Narraitor/issues/657)

**Technical Debt**
- [Fix skipped localStorage tests](https://github.com/jerseycheese/Narraitor/issues/646)
- Performance optimization
- Bundle size improvements

### Working Toward 1.0

What constitutes "done enough" for a 1.0:
- All user-facing polish complete
- Developer tools operational for maintainability
- Comprehensive testing coverage
- Performance benchmarks met
- Documentation that actually makes sense

### Future Ideas (Post-1.0)

Things that would be cool to explore:
- **Enhanced Notifications** across all user interactions ([#607](https://github.com/jerseycheese/Narraitor/issues/607))
- **Multiplayer Capabilities** (shared worlds and storytelling)
- **Voice Narration** for enhanced immersion
- **Mobile App Versions** for on-the-go storytelling
- **Advanced AI Personalization** based on play patterns
- **Content Moderation Tools** for public sharing
- **Economy Systems** for more complex world building

**Note**: Multi-model AI support (GPT-4, Claude, Ollama, etc.) is being explored for earlier implementation - see Epic [#878](https://github.com/jerseycheese/Narraitor/issues/878) for provider-agnostic AI integration plans.

The nice thing about having the foundation solid is that these features can be added incrementally without breaking existing functionality.

## Technical Architecture

The app separates concerns into clear domains:

**World Management**: Multi-step wizard for creating fictional universes. The AI suggests attributes and skills based on your world's theme, but you can customize everything. Template worlds give you starting points.

**Character Creation**: Point-allocation system that adapts to your world's attributes and skills. Background generation helps flesh out character stories.

**AI Narrative Engine**: Google Gemini integration handles story generation. The key innovation here is context management: the AI maintains awareness of your world's rules, character details, and story history to generate consistent narratives.

**State Persistence**: Zustand stores with IndexedDB backing. Game sessions persist across browser sessions, and there's graceful fallback to memory-only if IndexedDB fails.

**Security**: All AI requests go through Next.js API routes with rate limiting (50/hour per IP) to prevent abuse. Players bring their own Gemini key, sent per request and used server-side for that one call — never persisted or logged. A server-side `GEMINI_API_KEY` env var acts as a local/dev fallback.

**Design System**: Three structurally-different design systems (DS1/DS2/DS3) ship together; the user picks one. See [DESIGN.md](DESIGN.md) for the AI-readable design surface (tokens, components, do's and don'ts), [ADR-011](public_docs/architecture/ADR-011-three-design-systems.md) for the rationale, and [public_docs/design-system/](public_docs/design-system/) for the full reference. Canon order is **showcase routes (`/dev/design-system{,-2,-3}`) > Storybook (`npm run storybook`) > app** — Storybook's toolbar has a DS1/DS2/DS3 + light/dark switcher for verifying components across all six combinations.

## AI Integration Details

The AI system routes everything through Next.js API endpoints (`/api/narrative/generate`, `/api/narrative/choices`). A player's own Gemini key travels from the browser to those routes in a per-request header (`x-provider-api-key`), gets used server-side for that single call, and is never logged or persisted. The `GEMINI_API_KEY` env var below is a local/dev fallback that stays server-side.

```bash
# .env.local
GEMINI_API_KEY=your-api-key
# Optional: enable token-budget-based prompt truncation
# ENABLE_TOKEN_BUDGET_MANAGER=true

# Feature flags
# NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING=false
# NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE=false
# NEXT_PUBLIC_FEATURE_VIRTUALIZATION=false
```

**Security measures**: Rate limiting prevents abuse, input gets sanitized, and all requests are validated server-side. The AI context system is probably the most interesting part - it builds prompts that include your world's rules, character details, and recent story events so the generated content stays consistent with your setting.

**Portrait Generation**: There's also an AI portrait system for character images. Check `public_docs/features/portrait-generation-guide.md` for details on how that works.

## License

This project is licensed under the MIT License; see the LICENSE file for details.
