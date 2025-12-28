---
title: Architecture Decisions
tags: [architecture, decisions, adr]
created: 2025-04-28
updated: 2025-06-26
---

# Architecture Decisions

So these are the key architectural decisions we made for Narraitor - basically why we chose certain technologies and patterns over others.

## Frontend Architecture

**Next.js 15+ App Router**: We went with the modern React framework because server/client components and nested layouts give us way better performance and organization than the old pages router.

**Domain-Driven Design**: Instead of organizing code by technical layers (components, hooks, utils), we organize by business domains (World, Character, Narrative, etc.). This keeps related functionality together and makes it easier to find things.

**Zustand State Management**: We tried React Context first, but it got messy fast with all the re-renders. Zustand is lightweight and lets us have domain-specific stores that don't interfere with each other.

**TypeScript**: Full type safety with strict mode because catching errors at compile time is way better than debugging runtime crashes.

## Data & Styling

**IndexedDB Persistence**: We need to store complex world and character data, plus support offline use. LocalStorage maxes out too quickly, and we wanted something that scales.

**Tailwind CSS v3**: Utility-first styling because it's faster to build with and the performance is great. Sticking with v3 for Storybook compatibility, which matters more than having the latest features. The theme support makes dark mode trivial.

**shadcn/ui Components**: These give us accessible, good-looking components without reinventing the wheel. Built on Radix UI so accessibility is handled properly.

## Development Practices

**Storybook-First Development**: Building components in isolation catches issues early and makes debugging way easier. Plus it forces you to think about all the different states a component needs to handle.

**Test-Driven Development**: We use Jest and React Testing Library, but focus on testing what users actually experience rather than implementation details. No point testing CSS classes when you should be testing behavior.

**Three-Stage Verification**: Every feature goes through Storybook (component isolation) → Test Harness (integration) → System Integration (full app). This catches different types of problems at each level.

## Product Decisions

**Single Player Focus**: For the MVP, we're focusing on single-player to keep things simple and really nail the core narrative experience. Multiplayer adds a ton of complexity we don't need right now.

**300-Line File Limit**: This might seem arbitrary, but it forces you to break things down properly. If a file is getting too big, it's usually doing too much.

**Google Gemini AI**: The integration is entirely server-side with rate limiting and validation. We tested a few different AI providers and Gemini gave us the best balance of quality and reliability.

**Security-First API Design**: All API keys stay server-side, we sanitize requests, and nothing sensitive ever reaches the client. Learned this lesson from other projects where API keys ended up in the browser.
