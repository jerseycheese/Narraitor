# Narraitor

I've been building this AI-powered storytelling app that basically lets you play through narrative RPG experiences in any fictional world you can imagine. Whether you want to explore Middle Earth, create adventures in the Star Wars universe, or design something completely original, Narraitor adapts the AI storytelling to match your world's themes and tone.

## What This Actually Does

The core idea came from wanting tabletop RPG experiences that could happen anytime, without coordinating schedules or finding a game master. Narraitor uses Google's Gemini AI to generate dynamic stories that respond to your choices, but here's the key part: it's not just generic fantasy. You define your world's rules, attributes, and tone, and the AI storytelling adapts to match exactly what you're going for.

## Key Features

**World Creation**: You can define any fictional universe with custom attributes (like "Force Sensitivity" for Star Wars or "Sanity" for Lovecraft) and skills that make sense for your setting. The AI wizard helps suggest appropriate mechanics based on your world's theme.

**Character Building**: Multi-step character creation that works with your world's rules. Allocate attribute points, pick relevant skills, write backstories; all tailored to fit your specific fictional universe.

**Adaptive AI Storytelling**: This is where it gets interesting. The AI doesn't just generate generic fantasy stories. It learns your world's tone, themes, and mechanics, then creates narratives that feel authentic to that universe. Playing in a noir detective setting feels completely different from space opera adventures.

**Smart Choice Systems**: Decisions get weighted as Minor/Major/Critical so you can see what really matters. Plus there's alignment tracking (Lawful/Neutral/Chaotic) with visual indicators, which helps maintain character consistency.

**Session Persistence**: Your games save automatically using IndexedDB, so you can pick up where you left off. No more lost progress when you close the browser.

**Template Worlds**: Don't want to build from scratch? Start with pre-configured worlds like Western, Sitcom, or high Fantasy, then customize from there.

## Getting It Running

You'll need Node.js (v18+), npm, and a Google Gemini API key. The API key stays server-side for security; no client exposure.

```bash
# Clone and set up
git clone https://github.com/jerseycheese/narraitor.git
cd narraitor
npm install

# Add your API key
cp .env.example .env.local
# Edit .env.local and add: GEMINI_API_KEY=your-key-here

# Fire it up
npm run dev
```

The app runs on `localhost:3000`. You'll see the world creation wizard first: either pick a template or build your own universe.

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

There are several `/dev` routes for testing components interactively: `/dev/world-creation-wizard`, `/dev/devtools-test`, etc. These let you test components with real data without going through the full app flow.

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

The components are grouped by domain (World, Character, Narrative, etc.) rather than by type. So you'll find `components/world/WorldEditor/` instead of `components/editors/WorldEditor/`. Makes it easier to find related functionality.

## Technical Architecture

The app separates concerns into clear domains:

**World Management**: Multi-step wizard for creating fictional universes. The AI suggests attributes and skills based on your world's theme, but you can customize everything. Template worlds give you starting points.

**Character Creation**: Point-allocation system that adapts to your world's attributes and skills. Background generation helps flesh out character stories.

**AI Narrative Engine**: Google Gemini integration handles story generation. The key innovation here is context management: the AI maintains awareness of your world's rules, character details, and story history to generate consistent narratives.

**State Persistence**: Zustand stores with IndexedDB backing. Game sessions persist across browser sessions, and there's graceful fallback to memory-only if IndexedDB fails.

**Security**: API keys stay server-side. All AI requests go through Next.js API routes with rate limiting (50/hour per IP) to prevent abuse.

## AI Integration Details

The AI system routes everything through Next.js API endpoints (`/api/narrative/generate`, `/api/narrative/choices`) for security. Your API key never touches the browser.

```bash
# .env.local
GEMINI_API_KEY=your-api-key
```

**Security measures**: Rate limiting prevents abuse, input gets sanitized, and all requests are validated server-side. The AI context system is probably the most interesting part - it builds prompts that include your world's rules, character details, and recent story events so the generated content stays consistent with your setting.

**Portrait Generation**: There's also an AI portrait system for character images. Check `docs/features/portrait-generation/` for details on how that works.

## License

This project is licensed under the MIT License; see the LICENSE file for details.
