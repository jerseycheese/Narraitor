---
title: Game Mechanics
tags: [mechanics, choices, attributes, alignment, decisions]
created: 2025-06-26
updated: 2025-06-26
---

# Game Mechanics

This the gameplay here focuses on meaningful choices rather than complex mechanics. The insight was that players needed to understand which decisions actually matter for the story versus routine choices that just move things along.

## Decision Weight System

The AI analyzes each choice and assigns a visual weight so you can see what's actually important:

**Minor Decisions** - Routine stuff that doesn't dramatically affect the story. Subtle styling, no borders. Things like "What will you have for breakfast?" or casual conversation options.

**Major Decisions** - Important story moments with amber borders and shadows. These affect character relationships, story direction, or significant plot points. Like "The dragon offers you a deal. How do you respond?"

**Critical Decisions** - Life-changing moments with prominent red borders. These are climactic choices that determine major story outcomes. "The kingdom's fate hangs in the balance. What is your final choice?"

**Smart Context** - Instead of just repeating the story, the AI generates context that explains why the decision matters:
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

```typescript
const alignmentStyles = {
  lawful: 'border-l-4 border-blue-500 bg-blue-50/30',
  neutral: 'border-l-4 border-gray-400 bg-gray-50/30', 
  chaotic: 'border-l-4 border-red-500 bg-red-50/30'
};
```

## Skill Check System

The skill system here focuses on consequences rather than blocking players from actions. When you see a choice like "Sneak past guards [Stealth 8+]", you can attempt it regardless of your character's actual Stealth level. The key difference is what happens next: your character's skill level determines whether the action succeeds or fails in the story.

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

The flow is pretty straightforward. Players see choices with skill badges showing requirements (like "Stealth 8+"), pick one, then the system evaluates whether their character's skill level meets the requirement. Based on that check, it creates either a `skill-success:stealth` or `skill-failure:stealth` tag. These tags then guide the AI to generate appropriate narrative - success means the action works out, failure means it goes wrong in the story.

The skill badges themselves stay neutral - just showing the requirement without any green/red pass/fail colors. This keeps the focus on the story choice rather than turning it into a stats check.

```typescript
// Badge just shows the requirement
<Badge variant="skill-requirement">
  Stealth 8+
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

There are a few dev routes set up for testing these mechanics. `/dev/game-session` lets you test everything in context, `/dev/choice-selector` focuses on individual choice components, and `/dev/world-creation-wizard` handles attribute configuration.

When testing, try out different decision weights (minor, major, critical), all three alignment types in various situations, different attribute configurations, and how these systems work together.

## Best Practices

Let the AI determine decision weights rather than hardcoding them - it's better at judging what actually matters in the moment. Make sure all three alignments are viable options, not just chaotic being "the fun one." Set meaningful attribute defaults that make sense for your world's power level. Keep visual distinctions clear between different mechanics so players aren't confused. Always allow custom input alongside generated choices - player agency matters more than perfect AI suggestions.