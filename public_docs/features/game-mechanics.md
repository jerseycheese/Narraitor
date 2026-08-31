---
title: Game Mechanics
tags: [mechanics, choices, attributes, alignment, decisions]
created: 2025-06-26
updated: 2026-07-21
---

# Game Mechanics

This the gameplay here focuses on meaningful choices rather than complex mechanics. The insight was that players needed to understand which decisions actually matter for the story versus routine choices that just move things along.

## Decision Weight System

The AI tags each decision with a weight, which mostly shapes how the story treats it rather than
how it looks:

**Minor Decisions** - Routine stuff that doesn't dramatically affect the story. Things like "What will you have for breakfast?" or casual conversation options.

**Major Decisions** - Important story moments that affect character relationships, story direction, or significant plot points. Like "The dragon offers you a deal. How do you respond?"

**Critical Decisions** - Life-changing moments that determine major story outcomes. "The kingdom's fate hangs in the balance. What is your final choice?"

The weight feeds the summarization prompt and can gate a fatal ending. Visually it does nothing:
the journal's choice history prints it as a text label (`major WEIGHT`), and
`getDecisionWeightStyling()` in `choiceStyling.tsx` returns empty strings, so weight adds no
borders, shadows, or color to the choices themselves.

**Decision Context** - Instead of just repeating the story, the AI generates context that explains why the decision matters:
- "Tension builds as you must choose how to respond to the merchant's accusation"
- "A critical moment where your response could determine if the alliance forms"
- "The stranger's offer seems too good to be true"

This helps you understand the stakes without spoiling the outcomes.

### API Types

```typescript
type DecisionWeight = 'minor' | 'major' | 'critical';

interface Decision {
  id: string;
  prompt: string;
  options: DecisionOption[];
  selectedOptionId?: string;
  decisionWeight?: DecisionWeight;
  contextSummary?: string;
}
```

## Choice Alignment System

The alignment system adds personality variety to choices. When the AI generates options, it tags them as Lawful, Neutral, or Chaotic to give players different approaches to the same situation.

Lawful choices follow rules and respect authority - things like following protocols or seeking official help. These get a blue accent. Neutral choices are pragmatic and situational - investigating, gathering information, practical solutions. Standard gray styling. Chaotic choices break conventions and use creative approaches - unconventional tactics or dramatic actions. These get a red accent.

The point is giving players ways to express their character's personality through choices, not just picking the "right" answer.

### Implementation

```typescript
export type ChoiceAlignment = 'lawful' | 'chaotic' | 'neutral';

interface DecisionOption {
  id: EntityID;
  text: string;
  alignment?: ChoiceAlignment;
  isCustomInput?: boolean;
  customText?: string;
}
```

### AI Generation Template

```typescript
FORMAT (REQUIRED - include alignment tags, decision weight, and context summary):
Decision Weight: [MINOR/MAJOR/CRITICAL]
Context Summary: [Brief explanation of why this decision matters]
Decision: What will you do?

Options:
1. [LAWFUL] [Choice following rules/authority]
2. [NEUTRAL] [Balanced/practical choice]
3. [CHAOTIC] [Creative/unconventional choice]
```

### Visual Styling

Alignment is the one axis that does show up visually. `getAlignmentClasses()` in
`src/components/shared/ChoiceSelector/choiceStyling.tsx` maps it to a semantic class name, and the
CSS decides what that looks like:

```typescript
// lawful  -> 'manuscript-suggested-action-lawful'
// chaotic -> 'manuscript-suggested-action-chaotic'
// neutral -> '' (no extra class)
```

## Skill Check System

The skill system here focuses on consequences rather than blocking players from actions. When you see a choice like "Sneak past guards [Stealth]", you can attempt it regardless of your character's actual Stealth level. The badge just shows which skill is involved - not the difficulty level. This prevents players from avoiding choices they know they'd fail. The key difference is what happens next: your character's skill level determines whether the action succeeds or fails in the story.

This approach means players discover their limitations through play, not through grayed-out options. If your character has Stealth 2 and tries that level 8+ stealth action, they don't get blocked - they get caught. The narrative shows them failing through actual story events, not game messages.

The other critical piece is keeping game mechanics invisible in the narrative. The AI never mentions skill names or levels when generating story text. When your low-Mechanics character tries to fix a radio, the narrative doesn't say "Your Mechanics skill, while only at level two, allows you to salvage a few components." Instead it shows what actually happens: "Your hands fumble with the radio's internals. Despite your best efforts, wires snap and components crack under your inexperienced touch."

### Implementation

```typescript
interface DecisionRequirement {
  type: 'skill' | 'attribute' | 'item' | 'relationship';
  targetId: EntityID;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number | string;
}

interface DecisionOption {
  id: EntityID;
  text: string;
  alignment?: ChoiceAlignment;
  requirements?: DecisionRequirement[];
  hint?: string;
}
```

### How It Works

The flow is pretty straightforward. Players see choices with skill badges showing which skill is involved (like "Stealth"), pick one, then the system evaluates whether their character's skill level meets the requirement. Based on that check, it creates either a `skill-success:stealth` or `skill-failure:stealth` tag. These tags then guide the AI to generate appropriate narrative - success means the action works out, failure means it goes wrong in the story.

The skill badges just show the skill name - no difficulty numbers. This way players know what kind of action it is (sneaking, persuading, etc.) but can't game the system by avoiding choices they'd fail.

```typescript
// Badge shows skill name only
<Badge variant="skill-requirement">
  Stealth
</Badge>

// Behind the scenes, tags guide AI narrative generation
// Success: "You slip past the guards unnoticed..."
// Failure: "Your foot catches on loose gravel, alerting the nearest guard..."
```

### Character Skills

Skills defined at world level, assigned values at character level:

```typescript
interface WorldSkill {
  id: EntityID;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CharacterSkill {
  id: EntityID;
  worldSkillId: EntityID;
  name: string;
  level: number;  // 1-10
  category?: string;
}
```

## Character Attributes

Attributes are the foundation for character capabilities. For the MVP, all attributes use a fixed 1-10 range where 1 is minimal capability, 5-6 is average, and 10 is peak human or beyond.

The key thing about attributes is the default value. This represents what's "normal" in your game world. Set it to 3 and characters start weaker, set it to 7 and they start stronger. This default influences character creation, guides NPC generation, and sets the relative difficulty of challenges.

### Data Structure

```typescript
export interface WorldAttribute extends NamedEntity {
  worldId: EntityID;
  name: string;
  description: string;
  range: {
    min: number;  // Always 1 for MVP
    max: number;  // Always 10 for MVP
  };
  defaultValue: number;  // 1-10, world-specific
}

export interface CharacterAttribute {
  attributeId: EntityID;
  name: string;
  value: number;  // 1-10
  modifiedValue?: number;  // After equipment/effects
}
```

### Attribute Configuration

Each world configures its own attributes. You set the name (Strength, Arcane Power, whatever fits your world), add a description explaining what it does, choose the default value for what's "normal" in this world, and use the fixed 1-10 range. The range is locked for MVP but could expand later.

### Integration Examples

```typescript
// World creation with custom attributes
const fantasyWorld = {
  attributes: [
    {
      name: 'Arcane Power',
      description: 'Magical energy and spellcasting ability',
      defaultValue: 4,
      range: { min: 1, max: 10 }
    },
    {
      name: 'Dragon Affinity', 
      description: 'Connection to draconic beings',
      defaultValue: 2,
      range: { min: 1, max: 10 }
    }
  ]
};

// Character with attribute values
const character = {
  attributes: [
    { attributeId: 'arcane-power', name: 'Arcane Power', value: 8 },
    { attributeId: 'dragon-affinity', name: 'Dragon Affinity', value: 3 }
  ]
};
```

## Component Integration

### ChoiceSelector with All Features

```typescript
interface ChoiceSelectorProps {
  decision?: Decision;
  choices?: SimpleChoice[];
  onSelect: (choiceId: string) => void;
  isDisabled?: boolean;
  showHints?: boolean;
  enableCustomInput?: boolean;
  onCustomSubmit?: (text: string) => void;
  customInputPlaceholder?: string;
  maxCustomLength?: number;
}

// Usage with all mechanics
<ChoiceSelector
  decision={decisionWithWeightAndAlignment}
  onSelect={handleChoiceSelect}
  enableCustomInput={true}
  onCustomSubmit={handleCustomInput}
  showHints={true}
/>
```

### Visual Feedback

The UI shows decision weight through border styling and shadows - heavier borders mean more important choices. Alignment shows through left border colors (blue for lawful, red for chaotic, gray for neutral). Custom input gets a prominent textarea so players can write their own actions. Context summaries explain what's at stake without spoiling outcomes.

## Testing & Development

There are a few dev routes set up for testing these mechanics. `/dev/game-session` lets you test everything in context, and `/dev/choice-alignment` focuses on alignment and decision-weight behavior.

When testing, try out different decision weights (minor, major, critical), all three alignment types in various situations, different attribute configurations, and how these systems work together.

## Item Usage System

Item usage ties inventory items into the narrative flow. When a player uses an item, the system handles inventory updates, generates appropriate narrative describing what happens, and creates journal entries for significant moments.

Every item use gets a narrative turn. Significance controls journal creation: quest items, equipment, documents, and valuables create entries, while consumables and miscellaneous items don't. This prevents journal spam from using health potions while keeping important story moments tracked.

### How It Works

When a player uses an item, the system:

1. Revalidates the world, character, item ownership, and quantity inside the session's turn lock
2. Consumes the item once, then generates and commits an item-specific narrative segment
3. Reconciles world-clock, world-state, and other reported item losses before continuing
4. Replaces the current choices only after the turn fully settles and doesn't end the session
5. Creates a journal entry for significant items after the turn lock is released

The AI understands context around stackable items. If you use one health potion from a stack of five, the narrative will mention you still have four left. Use your last potion and it'll emphasize that you're out. This keeps players informed about their resources through the story itself instead of requiring constant inventory checking.

### API Usage

```typescript
import { processItemUsage } from '@/lib/inventory/itemUsageService';

// Use an item during gameplay
const result = await processItemUsage({
  worldId,
  characterId,
  itemId,
  sessionId,
});

// Check the result
if (result.success) {
  console.log(result.narrative); // AI-generated description
  console.log(result.segmentId); // Narrative segment ID
  console.log(result.remainingQuantity); // How many left
} else {
  console.error(result.error.message);
}
```

### Types

```typescript
interface ItemUsageResult {
  success: boolean;
  wasConsumed?: boolean;
  remainingQuantity?: number;
  previousQuantity?: number;
  narrative?: string;
  segmentId?: EntityID;
  error?: UserFriendlyError;
}
```

### Narrative Context

The AI gets specific instructions about item usage to generate contextual narratives. For stackable items, it knows to mention remaining quantities naturally. For the last item in a stack, it emphasizes the supply is exhausted. For non-consumable equipment, it focuses on the action itself.

The system also respects the world's tone settings and current narrative context, so using a health potion in a gritty noir story feels different from using one in a lighthearted fantasy adventure.

### Journal Integration

Significant items (quest items, equipment, documents, valuables) automatically create journal entries when used. The entry includes:

- Title: "Used [Item Name]"
- Content: The AI-generated narrative
- Type: 'item_usage'
- Tags: item-usage, category tag
- Related entities: Links to the item

This creates a permanent record of important item usage moments that players can reference later. Common consumables don't create journal entries to avoid clutter.

### Testing & Development

The item usage system is fully tested through the inventory store tests and integration tests. The test harness at `/dev/game-session` lets you test item usage in context, though most of the time you'll be testing through the actual game session UI where players use items naturally during play.

## Best Practices

**Let the AI judge importance** - Don't hardcode decision weights. The AI is better at judging what actually matters in the moment based on the narrative context.

**Balance the alignments** - All three alignments (Lawful, Neutral, Chaotic) should be viable choices, not just chaotic being "the fun one." Players should feel like any alignment fits their character concept.

**Set sensible defaults** - Attribute defaults should make sense for your world's power level. A gritty noir setting and a superhero world need different baseline stats.

**Keep mechanics visually distinct** - Players shouldn't have to guess whether something is a skill check, an alignment choice, or an item usage. Visual clarity prevents confusion.

**Preserve player agency** - Always allow custom input alongside generated choices. Player agency matters more than perfect AI suggestions. Sometimes people want to do something the AI didn't think of.
