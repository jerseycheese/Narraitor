---
title: "Narrative Generation System"
type: architecture
category: narrative
tags: [narrative, ai, generation, inventory]
created: 2025-05-20
updated: 2025-10-11
---

# Narrative Generation System

Narraitor's narrative generation creates coherent stories that feel like they belong in your world, rather than generic text. A cyberpunk dystopia and a medieval fantasy realm get different language, tone, and content from the same engine.

## Overview

The narrative system is built from several pieces that work together to create consistent, engaging stories:

1. **NarrativeGenerator Service**: The AI engine that actually creates the story content
2. **Template Manager**: Different prompt templates for different story moments (openings, transitions, etc.)
3. **Context Management**: Keeps track of what's happened so far so the story makes sense
4. **Component System**: React components that handle the UI side of storytelling
5. **State Management**: Stores all the narrative content using Zustand
6. **Story Checkpoints**: Captures AI-generated summaries at pivotal moments for long-session coherence (see `../features/story-checkpoints.md`)

## Usage Guide

### Basic Usage

The simplest way to add narrative generation to a game session:

```tsx
import { NarrativeController } from '@/components/Narrative/NarrativeController';

// In your GameSession component
<NarrativeController
  worldId={worldId}
  sessionId={sessionId}
  triggerGeneration={true}
/>
```

### Responding to Player Choices

When a player makes a choice, you can trigger a narrative response:

```tsx
// When a player makes a choice
const handleChoiceSelected = (choiceId: string) => {
  setSelectedChoiceId(choiceId);
  
  // The NarrativeController will generate a new segment based on this choice
  <NarrativeController
    worldId={worldId}
    sessionId={sessionId}
    choiceId={selectedChoiceId}
    onNarrativeGenerated={handleNarrativeGenerated}
  />
};
```

### Display-Only Mode

If you only want to display existing narrative without generating new content:

```tsx
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';

// Only displays existing narrative without generating new content
<NarrativeHistoryManager
  sessionId={sessionId}
/>
```

## Technical Implementation

### World-Specific Adaptation

The AI adapts to the kind of world you've created:

1. **Theme-Based Content**: A Western world feels like the Wild West, not generic fantasy
2. **Setting-Appropriate Starting Locations**: First scenes open somewhere the world would put you, not a default tavern:
   - Western worlds start in "Frontier Town"
   - Fantasy worlds start in "Enchanted Forest"
   - Sci-Fi worlds start in "Space Station"
3. **Tone Settings Integration**: Whether you want family-friendly adventures or gritty noir stories
4. **Attribute Integration**: Your world's custom attributes actually matter in the narrative

### Prompt Template System

Different moments in the story need different approaches, so we have specialized templates:

1. **Initial Scene Template**: Sets the stage for a new adventure
2. **Scene Template**: Handles the main story beats
3. **Transition Template**: Smoothly connects different narrative moments

### Prompt Size (Context Window Management)

The worry with a long session is that prompts quietly balloon as context accumulates. In practice they don’t, because every prompt component is bounded where it’s assembled: callers slice the segment window before it reaches the prompt, lore is capped at 20 facts, and the character section has no growth term. Turn 5 and turn 500 send comparably sized prompts.

What’s left is measurement. Each request records what its whole prompt weighed and reconciles that heuristic estimate against the provider’s own token count, which the DevTools panel reads. Nothing trims a prompt.

### Tone Settings System

The narrative generator enforces tone settings instead of just suggesting them to the AI.

Key settings include:

- **Content Rating**: G to NC-17 with appropriate filtering - stricter for G-rated content, more permissive for mature ratings
- **Narrative Style**: Nine options (serious, humorous, dramatic, mysterious, action-packed, etc.) so a noir detective story feels genuinely different from a lighthearted fantasy adventure
- **Language Complexity**: Four levels from simple to literary, affecting vocabulary and sentence structure - matters because stories for younger readers need different phrasing than adult content
- **Custom Instructions**: Additional tone requirements that the standard options don't cover
- **AI Safety Integration**: Dynamically adjusts safety thresholds based on content rating
- **Debug Logging**: Available for verifying tone settings are actually being applied to prompts

### Inventory Integration

The generator references inventory items when relevant. It ranks items by significance - quest items and equipment rank highest, recently acquired items get a boost, unique items beat common ones.

Limits to top 8 items to avoid prompt clutter. The AI only mentions items when contextually relevant.

### Item Usage Integration

Item usage generates narrative segments instead of just updating numbers. The AI describes the action, sensory details, and effects. For stackable items, it incorporates remaining quantity naturally.

Creates "action" segments with `item-usage` tags. Significant items generate journal entries. Falls back to simple text if AI generation fails.

### Narrative Perspective

The narrative system consistently uses second-person perspective ("you") to create an immersive experience. The AI understands that the player IS the named character, so all narration uses "you" instead of the character name. Character names only appear when NPCs are addressing the player in dialogue, which creates a direct, personal connection to the story instead of reading about someone else's adventure.

### Deduplication and Error Prevention

The system includes several safeguards to prevent common issues. Initial scene deduplication ensures you don't get multiple opening scenes generated for the same session - it happened during early testing and was confusing. Choice tracking prevents the same choice from triggering multiple narrative generations, which could happen if a player clicked quickly or if the UI re-rendered.

Component lifecycle management prevents state updates after a component unmounts, which React will complain about loudly. Error recovery catches AI service failures instead of crashing, and JSON parsing includes fallbacks for different response formats since the AI doesn't always return perfectly structured JSON.

### AI API Call Patterns

Each turn fans out into a few separate Gemini calls, and on a free tier (50 requests/hour/IP) that adds up fast during playtesting. The current per-turn pattern:

- **Narrative generation** — 1 call to produce the next segment.
- **Ending detection** — 1 call (once the session has at least 3 segments). `useEndingDetection` asks the AI whether the story has reached a natural conclusion. This is easy to forget when counting calls, but it's a real request every turn.
- **Choice generation** — 1 call to produce the player's next decision.

So a normal turn is up to 3 calls, not 2. Using an item adds its own item-usage narrative call plus a choice regeneration call on top.

To trim the obvious waste, choice generation is skipped when the turn already ends the session — there's no point generating choices nobody will ever see. The path that actually fires today is a **critical-decision failure**: `NarrativeController` already treats a failed roll on a `critical`-weight decision as fatal (it auto-generates the ending), so it skips choices on that turn. The `isSessionEndingSegment` helper (`src/lib/narrative/isSessionEndingSegment.ts`) covers the other terminal cases — an `ending`-type segment or committed ending data (`endingId`/`endingData`) — and a `fatal-outcome` tag. Note the `fatal-outcome` tag isn't currently emitted by generation (the AI tags narrative deaths freely, e.g. `death`), so that branch is forward-looking parity with the existing `hasFatalTag` check rather than something that fires in practice. Ending detection short-circuits too — once an ending's been suggested for the session, it won't fire another AI call.

One deliberate exception: a *soft* AI ending suggestion (the kind the player can decline and keep playing) does **not** skip choice generation. If it did, anyone who rejected the suggestion would be stranded with no choices. Only the definitive, can't-continue signals suppress choices.

## Error Handling

The narrative system handles several types of errors that can come up during generation. When errors occur, the system displays appropriate messages to users instead of showing raw error text or crashing, and attempts recovery when possible.

Error types handled:

- **AI Service Errors**: When the AI service fails to generate content - maybe overloaded or having issues
- **JSON Parsing Errors**: AI response format is unexpected, which happens more often than you'd think since AI responses can be inconsistent
- **Network Errors**: Straightforward communication failures between client and server
- **Session-Related Errors**: Issues with session management or data retrieval from stores

Recovery strategies include retrying failed requests with exponential backoff and falling back to default content if the AI is unavailable.

## Testing

### Manual Testing

The system includes a test harness at `/dev/game-session` for manual testing. You can generate initial narrative for different world themes to see how genre adaptation works, make player choices to verify narrative continuity, create new sessions to test initialization, and deliberately create edge case scenarios to test error handling. It's useful for catching issues that automated tests miss, particularly around the AI's actual output quality.

### Automated Testing

Unit tests cover the key components:

- **narrativeGenerator.test.ts**: Core generation functionality including prompt building and response parsing
- **NarrativeController.test.tsx**: Controller component behavior around state management and lifecycle
- **NarrativeDisplay.test.tsx**: Display component rendering of narrative segments

## Future Enhancements

There are several areas where the narrative system could be extended. More sophisticated context selection would help long sessions stay coherent by preferring the most relevant history instead of just “the most recent that fits.” Better character integration would improve how player and NPC characters interact in the narrative, making relationships and character development feel more natural.

Long-term narrative memory for persistent game worlds would be useful for players who want to continue stories across multiple sessions. More complex branching storylines based on player choices could create more meaningful consequences for decisions. Allowing players to select their preferred narrative style (beyond just tone settings) would let them customize the storytelling experience even further.
