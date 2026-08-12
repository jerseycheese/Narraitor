---
title: Prompt Context API
tags: [prompt, context, api, ai]
created: 2025-05-12
updated: 2026-08-12
---

# Prompt Context API

The AI needs to understand the world, the character, recent events, and lore to write a
good scene. The `promptContext` module is the measuring and shaping layer under prompt
assembly: it counts how big a chunk of text is, formats the trickier pieces (like
inventory) so they stay useful, and records what each finished request weighed.

There's no single "context manager" class. The module is three small, focused pieces that
the AI layer composes itself, which keeps each piece testable and avoids one god-object
owning the whole prompt.

One thing worth saying up front, because the module name suggests otherwise: nothing here
trims a prompt to fit a global budget. Each prompt component is bounded where it's
assembled — callers slice the narrative window before it reaches the prompt, lore is
capped at 20 facts, the character section has no growth term, and inventory caps itself.
A long session doesn't send a bigger prompt than a short one.

## Token counting (`tokenUtils.ts`)

`estimateTokenCount` runs the real Gemini tokenizer (`@lenml/tokenizer-gemini`, wrapped in
`tokenizer.ts` behind a lazily-built singleton). It's called an estimate because it counts
the prompt text rather than whatever the provider ultimately bills, not because the
tokenization is approximate.

```typescript
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';

const tokens = estimateTokenCount('This is a sample text to count.');
```

## Prompt calibration (`promptCalibration.ts`)

This is the observability half. `buildCalibrationSnapshot` produces the record the DevTools
panel reads: what a request's whole prompt weighed by our own count, what the provider
reported, and the ratio between them.

```typescript
import {
  buildCalibrationSnapshot,
  DEFAULT_TOTAL_BUDGET,
} from '@/lib/promptContext/promptCalibration';

const snapshot = buildCalibrationSnapshot(estimatedTokens, providerPromptTokens);
// { totalBudget: 80000, estimated: 2413, actual: 2380, accuracy: 0.986 }
```

`accuracy` only appears once the provider has reported a count and the estimate is
non-zero. `DEFAULT_TOTAL_BUDGET` is `80000` — roughly 8% of a 1M-token context window. It's
the yardstick the panel measures a request against, not a ceiling: nothing enforces it.

In practice you don't call this directly. `recordRequestCalibration` in
`narrativeGenerator.calibration.ts` wraps it and pushes the result into the calibration
store after each generation. That publishing is browser-only and skipped in production, so
the panel is a local debugging surface rather than a telemetry pipeline.

## Inventory context (`inventoryContextBuilder.ts`)

Inventory is the part that most needs shaping, since a character can be carrying a pile of
mundane junk that would crowd out the stuff the story actually cares about.
`buildInventoryContext` sorts by what matters — equipped gear first, then category priority
(quest items beat consumables), then how recently something was acquired — and trims to a
token budget so the AI sees the important items and not forty healing potions.

```typescript
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';

const { context } = buildInventoryContext(characterInventoryItems, {
  equippedItemIds: ['item-sword'],
  tokenLimit: 160,
});

/* Produces:
## Inventory Summary
- [Equipped] Sword of Dawn (equipment, qty 1, acquired via quest on 2025-06-01) — Radiant blade that channels sunlight.
- Healing Potion (consumables, qty 3, acquired via purchase on 2025-06-02) — Restores moderate health.
+ 2 more items not shown to stay within token limits.
*/
```

Each line carries when and how the item was acquired, which gives the AI something concrete
to reference in narrative. It defaults to 180 tokens and 8 items; when it has to truncate,
it appends the "+ N more items" summary line and drops lower-priority items so that summary
still fits. This is the one limit in the module that actually cuts content, and it's
self-contained — the caller can pass a different `tokenLimit`, but nothing outside the
builder decides one for it.

## Where this gets used

The consumers all live in the AI layer. `narrativeGenerator.prompt.ts`,
`narrativeGenerator.prompt.personalization.ts`, and `choiceGenerator.prompt.ts` assemble
their prompts on top of these pieces, and the narrative templates themselves
(`templates/narrative/baseNarrativeTemplate.ts`) pull in formatted context. So the flow is
roughly: a template knows what sections it wants, each section bounds itself,
`buildInventoryContext` handles the one that needs real sorting logic, and
`narrativeGenerator.calibration.ts` measures the result on the way out.

## Behavior under bad input

The pieces are built to degrade rather than throw. Missing world or character data just
produces a smaller context with whatever's available, and empty structures return empty
strings. Counting is O(n) on content length and synchronous, so none of this adds latency
worth worrying about.
