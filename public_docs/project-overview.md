---
title: Narraitor Project Overview
tags: [narraitor, overview]
created: 2025-04-27
updated: 2026-09-28
---

# Narraitor Project Overview

## What This Project Does
I built this AI storytelling app that lets you play RPG narratives in any fictional universe you can imagine. Most AI story generators default to generic fantasy; Narraitor instead learns the world's own rules and tone, so what it generates actually fits the setting you described.

Middle Earth, the beaches of Normandy, something you invented last week: all fair game. It's designed for solo play when you want a narrative RPG experience but don't have a group or game master available.

## Current Status
As of v1.12.0 (2026-10-03), the app is past MVP: all the main systems (world creation, character building, AI narrative generation, session persistence, multi-provider AI) are operational and have shipped through twelve releases. v1.11 built scene state for long-session coherence and ships switched off; v1.12 changed lever, making cheaper open-weight models work properly through OpenRouter, and DeepSeek flash beat the old baseline. Current work (v1.13) makes it the recommended default and clears out Gemini-only assumptions. See [MVP Roadmap](./development/mvp-roadmap.md) and [RELEASES.md](../RELEASES.md) for the running detail.

## Technical Foundation

The stack:
- **Framework**: Next.js 15 (15.5.x) with App Router
- **AI Integration**: BYO-key, multi-provider (Gemini, OpenRouter, Ollama, and OpenAI live; more scaffolded), with the player's key encrypted in the browser and proxied through server-side routes
- **State Management**: Zustand stores with IndexedDB persistence
- **UI**: Plain CSS driven by design tokens (no Tailwind); components are shadcn-derived (Radix primitives) but styled with semantic CSS classes
- **Testing**: Jest, React Testing Library, Storybook
- **Development**: TDD workflow with 300-line file limits

## Core Features

**World Creation**: The multi-step wizard lets you define any fictional universe. Describe what you have in mind and you get suggested attributes and skills tuned to that theme, all of them editable.

**Character Building**: Point-allocation system that adapts to your world's rules. Create characters with backgrounds that make sense for your setting. The wizard guides you through attribute allocation, skill selection, and story background. You can build multiple characters in the same world and switch between them, but each plays their own session — the player controls one character at a time; everyone else in the story is an NPC.

**Adaptive AI Narratives**: The AI maintains context about your world's rules, your character's abilities, and the ongoing story to create narratives that feel consistent with your setting.

**Choice Weighting**: Decisions get labeled by importance (Minor/Major/Critical) and alignment (Lawful/Neutral/Chaotic) so you can see which decisions carry weight for your character's development.

**Session Persistence**: Games save automatically using IndexedDB with graceful fallback to memory-only if storage fails. Pick up where you left off anytime.

**Development Infrastructure**: DevTools for debugging, Storybook for component development, and automated workflow scripts for repetitive tasks.

## Security & Performance
The player's key is encrypted at rest in the browser, decrypted only when a request needs it, and sent to same-origin routes rather than to Google. Nothing is baked into the client bundle. Rate limiting (50 requests/hour per IP in production) guards the AI generation routes against abuse, and all input gets sanitized and validated before hitting the AI service.

## Who This Is For
Built primarily for personal use: solo narrative RPG experiences when you want to explore stories in specific fictional universes without needing a group or game master.

## Development Philosophy
- **KISS approach**: Simple, maintainable code over clever solutions.
- **TDD workflow**: Tests before implementation to catch issues early.
- **Component-first**: Build in Storybook isolation before integration.
- **Domain boundaries**: Keep related functionality together.

## Current Focus
v1.12: OpenRouter models without workarounds (#2252, #2251, #2249), the fatal-cooldown fix (#2250), then a re-measure at n=3 plus 10-turn episodes (#2257). See [MVP Roadmap](./development/mvp-roadmap.md) for the active queue.

## Technical Architecture
Domain-driven structure with Zustand stores for each area (World, Character, Narrative, etc.). Shared component patterns for wizards and forms. AI service abstractions handle prompt management and context building. Everything's type-safe with validation.
