---
title: Prompt Context API
tags: [prompt, context, api, ai]
created: 2025-05-12
updated: 2026-05-22
---

# Prompt Context API

The AI needs to understand the world, the character, recent events, and lore to write a
good scene, but the prompt can only carry so much before it gets expensive and noisy. The
`promptContext` module is the budgeting layer that sits under prompt assembly: it estimates
how big a chunk of text is, hands each part of the prompt a token allowance, and formats
the trickier pieces (like inventory) so they stay useful without blowing past their share.

There's no single "context manager" class. The module is three small, focused pieces that
the AI layer composes itself, which keeps each piece testable and avoids one god-object
owning the whole prompt.

## Token estimation (`tokenUtils.ts`)

Pulling in a real tokenizer just to budget prompts isn't worth the dependency weight, so
estimation uses a heuristic that approximates LLM tokenization — word boundaries,
punctuation, CamelCase and hyphen splits, and a character-count fallback for long words.
It's not exact, but it's close enough to decide what fits and what gets trimmed.

```typescript
import { estimateTokenCount, truncateToTokenLimit } from '@/lib/promptContext/tokenUtils';

const tokens = estimateTokenCount('This is a sample text to estimate token count.');
const trimmed = truncateToTokenLimit(longLoreBlob, 800);
```

`truncateToTokenLimit` caps a string at an estimated token limit and avoids cutting
mid-word when it can. That's what the prompt builders lean on to keep a large section
(recent narrative, lore) inside its allocation.

## Token budgeting (`tokenBudgetManager.ts`)

Each prompt is built from competing parts — base template, character context, recent
narrative, goals, tone, lore, inventory, personalization — and they can't all grow
unbounded. `RequestBudget` handles the divvying-up for a single request. You give it a set
of per-component allocations and a total budget, and it resolves how many tokens each
component actually gets, reducing lower-priority components first when things are tight.

```typescript
import {
  RequestBudget,
  ComponentPriority,
  DEFAULT_ALLOCATIONS,
  DEFAULT_TOTAL_BUDGET,
} from '@/lib/promptContext/tokenBudgetManager';

const budget = new RequestBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET, true);

const loreAllowance = budget.getAllocation('lore-context');
budget.recordUsage('lore-context', actualLoreTokens);
```

A few things worth knowing about how it resolves:

- Allocations carry a `ComponentPriority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) plus
  `min`, `target`, and `max`. `CRITICAL` components (base template, character context) get
  their minimum first, then everything else is filled by priority from what's left.
- Pass `enabled: false` and it stops enforcing limits — `getAllocation` returns `Infinity`
  and nothing gets trimmed, which is handy for debugging a prompt without the budget in the
  way.
- `DEFAULT_TOTAL_BUDGET` is `80000`, deliberately conservative at roughly 8% of a 1M-token
  context window. `DEFAULT_ALLOCATIONS` is the narrative-generation preset that ships with
  the module.

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
still fits.

## Where this gets used

The consumers all live in the AI layer. `narrativeGenerator.prompt.ts`,
`narrativeGenerator.budget.ts`, `narrativeGenerator.prompt.personalization.ts`, and
`choiceGenerator.prompt.ts` assemble their prompts on top of these pieces, and the narrative
templates themselves (`templates/narrative/baseNarrativeTemplate.ts`) pull in formatted
context. So the flow is roughly: a template knows what sections it wants, `RequestBudget`
says how big each can be, `tokenUtils` measures and trims, and `buildInventoryContext`
handles the one section that needs real sorting logic.

## Behavior under bad input

The pieces are built to degrade rather than throw. Missing world or character data just
produces a smaller context with whatever's available, empty structures return empty strings,
and a disabled budget skips enforcement entirely. Estimation is O(n) on content length and
synchronous, so none of this adds latency worth worrying about.
