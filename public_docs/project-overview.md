---
title: Narraitor Project Overview
tags: [narraitor, overview]
created: 2025-04-27
updated: 2025-06-26
---

# Narraitor Project Overview

## What This Project Does
I built this AI storytelling app that lets you play RPG narratives in any fictional universe you can imagine. Most AI story generators default to generic fantasy; Narraitor instead learns the world's own rules and tone, so what it generates actually fits the setting you described.

Middle Earth, the beaches of Normandy, something you invented last week: all fair game. It's designed for solo play when you want a narrative RPG experience but don't have a group or game master available.

## Current Status
The core functionality is working and stable. All the main systems (world creation, character building, AI narrative generation, session persistence) are operational. Currently in the polish phase: fixing UI edge cases, optimizing performance, and preparing for broader use.

## Technical Foundation

The stack:
- **Framework**: Next.js 15 (15.5.x) with App Router
- **AI Integration**: Google Gemini, with the player supplying their own key (encrypted in the browser, proxied through server-side routes)
- **State Management**: Zustand stores with IndexedDB persistence
- **UI**: Plain CSS driven by design tokens (no Tailwind); components are shadcn-derived (Radix primitives) but styled with semantic CSS classes
- **Testing**: Jest, React Testing Library, Storybook
- **Development**: TDD workflow with 300-line file limits

## Core Features

**World Creation**: The multi-step wizard lets you define any fictional universe. Describe what you have in mind and you get suggested attributes and skills tuned to that theme, all of them editable. Want "Force Sensitivity" as an attribute? No problem.

**Character Building**: Point-allocation system that adapts to your world's rules. Create characters with backgrounds that make sense for your setting. The wizard guides you through attribute allocation, skill selection, and story background.

**Shared World, Multi-Character Play**: Maintain parallel protagonists inside the same persistent world. The character roster now shows per-character thread summaries and cross-character relationships, while the narrative engine cross-references your other characters so their choices actually acknowledge one another.

**Adaptive AI Narratives**: This is the interesting part. The AI doesn't just generate random fantasy stories. It maintains context about your world's rules, your character's abilities, and the ongoing story to create narratives that feel consistent with your setting.

**Choice Weighting**: Decisions get labeled by importance (Minor/Major/Critical) and alignment (Lawful/Neutral/Chaotic) so you can see which decisions carry weight for your character's development.

**Session Persistence**: Games save automatically using IndexedDB with graceful fallback to memory-only if storage fails. Pick up where you left off anytime.

**Development Infrastructure**: DevTools for debugging, Storybook for component development, and automated workflow scripts for repetitive tasks.

## Security & Performance
The player's key is encrypted at rest in the browser, decrypted only when a request needs it, and sent to same-origin routes rather than to Google. Nothing is baked into the client bundle. Rate limiting (50 requests/hour per IP in production) guards the AI generation routes against abuse, and all input gets sanitized and validated before hitting the AI service.

## Who This Is For
Built primarily for personal use: solo narrative RPG experiences when you want to explore stories in specific fictional universes without needing a group or game master.

## Development Philosophy
**KISS approach**: Simple, maintainable code over clever solutions. **TDD workflow**: Tests before implementation to catch issues early. **Component-first**: Build in Storybook isolation before integration. **Domain boundaries**: Keep related functionality together.

## Current Focus
Polishing the user experience: responsive design, performance optimization, edge case handling. The core functionality works well, so now it's about making it smooth and reliable for broader use.

## Technical Architecture
Domain-driven structure with Zustand stores for each area (World, Character, Narrative, etc.). Shared component patterns for wizards and forms. AI service abstractions handle prompt management and context building. Everything's type-safe with validation.
