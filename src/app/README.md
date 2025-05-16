# Narraitor Routes (App Router)

This directory uses the Next.js App Router architecture, which replaced the previous Pages Router implementation.

## Available Routes

### Main Application
- `/` - Home page (redirects to /worlds)
- `/worlds` - World list page with "Create World" button
- `/worlds/[id]` - Individual world page (404 until implemented)
- `/world/create` - World creation page

### Development and Testing
- `/dev` - Development test harness index
- `/dev/controls` - Developer controls interface
- `/dev/mocks` - Mock services testing
- `/dev/test` - Basic test component
- `/dev/world-creation-wizard` - World Creation Wizard test harness

## World Creation Wizard

The wizard has been fully implemented with:
- 5 steps: Basic Info, Description, Attributes, Skills, Finalize
- 6 default attributes: Strength, Intelligence, Agility, Charisma, Dexterity, Constitution
- 12 default skills with "Learning Curve" instead of "Difficulty"
- Navigation to `/worlds` on completion or cancellation
- State persistence between steps
- Local storage integration for created worlds

## App Router Structure

This directory follows Next.js 15+ App Router conventions:

- `page.tsx` - The UI for a specific route
- `layout.tsx` - Shared layouts that wrap page components
- `error.tsx` - Error boundaries for handling errors
- `loading.tsx` - Loading UI for suspense boundaries
- `(groupName)/` - Route groups (non-URL segments) for organization
- `[dynamic]/` - Dynamic route segments with parameters

## Notes

- All routes are now implemented using the App Router pattern
- The Pages Router implementation has been completely removed
- ServerComponents are used by default, with 'use client' directive for client components
- Nested layouts provide a consistent UI structure
- Route groups (parentheses) group related routes without affecting the URL structure
