# Narraitor Routes (App Router)

This directory uses the Next.js App Router architecture, which replaced the previous Pages Router implementation. So basically, we migrated from the old file-based routing to the new App Router because it gives us better layouts, loading states, and nested routing capabilities.

## How the Routes Work

**Core app routes:**
- `/` - public landing page (returning browsers with local app state are routed to `/dashboard`)
- `/dashboard` - app home/dashboard (first-time onboarding lives here too)
- `/welcome` - legacy alias, permanent redirect to `/`
- `/worlds`, `/worlds/create`, `/worlds/[id]`, `/worlds/[id]/edit` - world list, creation, detail, edit
- `/worlds/[id]/play`, `/worlds/[id]/play/journal` - active gameplay and the in-session journal
- `/characters`, `/characters/create`, `/characters/[id]`, `/characters/[id]/edit` - character list, creation, detail, edit
- `/play` - standalone play entry
- `/settings`, `/about`

**API routes** (`src/app/api/**`): server-side proxies for AI and image generation
(`narrative/generate`, `generate-character`, `inventory/categorize`, and so on). These exist so
the Gemini API key stays server-side — see [ADR-006](../../public_docs/architecture/ADR-006-gemini-server-side-api.md).

**Development routes** (`/dev/*`): test harnesses for the surfaces Storybook can't cover —
live AI calls, real stores, real routing (e.g. `/dev/game-session`, `/dev/world-generation`).
The visual canon for the design system is
Storybook (`npm run storybook`) — see [ADR-012](../../public_docs/architecture/ADR-012-storybook-single-canon-surface.md).

## World Creation Wizard

The wizard is fully implemented:

- **5 steps**: Basic Info, Description, Attributes, Skills, Finalize
- **6 default attributes**: Strength, Intelligence, Agility, Charisma, Dexterity, Constitution
- **12 default skills** with "Learning Curve" instead of "Difficulty" (which tested better with users)
- **Smart navigation** to `/worlds` on completion or cancellation
- **State persistence** between steps so you don't lose your work
- **Local storage integration** for created worlds

## App Router Structure

This directory follows Next.js 15+ App Router conventions. The basic idea is that each folder can have special files that Next.js knows how to handle:

- `page.tsx` - The actual UI for a route
- `layout.tsx` - Shared layouts that wrap page components
- `error.tsx` - Error boundaries for handling errors
- `loading.tsx` - Loading UI for suspense boundaries
- `(groupName)/` - Route groups for organization (doesn't affect URLs)
- `[dynamic]/` - Dynamic route segments with parameters

## Migration Notes

We completely moved away from the Pages Router because the App Router gives us much better developer experience and performance. Key changes:

- All routes now use the App Router pattern
- ServerComponents are used by default, with 'use client' directive only when needed
- Nested layouts provide consistent UI structure across the app
- Route groups (parentheses) let us organize related routes without affecting URLs

The migration was pretty smooth overall - the main challenge was making sure all the client-side hooks were properly marked with 'use client'.