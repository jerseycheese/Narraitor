# Narraitor Routes (App Router)

This directory uses the Next.js App Router architecture, which replaced the previous Pages Router implementation. So basically, we migrated from the old file-based routing to the new App Router because it gives us better layouts, loading states, and nested routing capabilities.

## How the Routes Work

The main application has these routes:

**Core App Routes:**
- `/` - Home page (redirects to /worlds)
- `/worlds` - World list page with "Create World" button
- `/worlds/[id]` - Individual world page (404 until implemented)
- `/worlds/create` - World creation page

**Development Routes:**
- `/dev` - Development test harness index
- `/dev/controls` - Developer controls interface
- `/dev/mocks` - Mock services testing
- `/dev/test` - Basic test component
- `/dev/world-creation-wizard` - World Creation Wizard test harness

The dev routes are super helpful when you're working on components in isolation - you can test them without having to navigate through the whole app.

## World Creation Wizard

The wizard has been fully implemented and it's pretty comprehensive:

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