---
title: Narraitor Project Overview
tags: [narraitor, overview]
created: 2025-04-27
updated: 2025-06-26
---

# Narraitor Project Overview

## What This Project Does
I built this AI storytelling app that lets you play RPG narratives in any fictional universe you can imagine. The key insight was that most AI story generators produce generic fantasy, but what if the AI could actually understand and adapt to specific world rules and tones? 

Whether you want noir detective stories, space opera adventures, or something set in Middle Earth, Narraitor learns your world's mechanics and generates narratives that feel authentic to that setting. It's designed for solo play when you want a narrative RPG experience but don't have a group or game master available.

## Current Status
The core functionality is working and stable. All the main systems (world creation, character building, AI narrative generation, session persistence) are operational. Currently in the polish phase: fixing UI edge cases, optimizing performance, and preparing for broader use.

## Technical Foundation

 Built on a solid foundation of modern tools:
- **Framework**: Next.js 15.5.6 with App Router (updated 2025-10-27)
- **AI Integration**: Google Gemini (secure server-side)
- **State Management**: Zustand stores with IndexedDB persistence
- **UI**: Tailwind CSS v4 with shadcn/ui components
- **Testing**: Jest, React Testing Library, Storybook
- **Development**: TDD workflow with 300-line file limits

## Core Features

**World Creation**: The multi-step wizard lets you define any fictional universe. You can start from scratch or use templates (Western, Fantasy, Sci-Fi, etc.). The AI suggests appropriate attributes and skills based on your world's theme, but everything's customizable. Want "Force Sensitivity" as an attribute? No problem.

**Character Building**: Point-allocation system that adapts to your world's rules. Create characters with backgrounds that make sense for your setting. The wizard guides you through attribute allocation, skill selection, and story background.

**Adaptive AI Narratives**: This is the interesting part. The AI doesn't just generate random fantasy stories. It maintains context about your world's rules, your character's abilities, and the ongoing story to create narratives that feel consistent with your setting.

**Smart Choice Systems**: Decisions get labeled by importance (Minor/Major/Critical) and alignment (Lawful/Neutral/Chaotic) so you can see what really matters for your character's development.

**Session Persistence**: Games save automatically using IndexedDB with graceful fallback to memory-only if storage fails. Pick up where you left off anytime.

**Development Infrastructure**: Built comprehensive DevTools for debugging, Storybook for component development, and automated workflow scripts for repetitive tasks.

## Security & Performance
API keys stay server-side with rate limiting (50 requests/hour per IP) to prevent abuse. All input gets sanitized and validated before hitting the AI service.

## Who This Is For
Built primarily for personal use: solo narrative RPG experiences when you want to explore stories in specific fictional universes without needing a group or game master.

## Development Philosophy
**KISS approach**: Simple, maintainable code over clever solutions. **TDD workflow**: Tests before implementation to catch issues early. **Component-first**: Build in Storybook isolation before integration. **Domain boundaries**: Keep related functionality together.

## Current Focus
Polishing the user experience: responsive design, performance optimization, edge case handling. The core functionality works well, so now it's about making it smooth and reliable for broader use.

## Technical Architecture
Domain-driven structure with Zustand stores for each area (World, Character, Narrative, etc.). Shared component patterns for wizards and forms. AI service abstractions handle prompt management and context building. Everything's type-safe with comprehensive validation.
