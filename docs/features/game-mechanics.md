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

Personality-driven narrative variety through character alignments: Lawful, Neutral, and Chaotic.

### Alignment Types

**Lawful**
- **Philosophy**: Rule-following, honor-bound, methodical approaches
- **Visual**: Blue accent with structured appearance
- **Examples**: Following protocols, seeking official help, respecting authority

**Neutral**
- **Philosophy**: Balanced, pragmatic, situational responses
- **Visual**: Gray accent with standard appearance
- **Examples**: Investigating, gathering information, practical solutions

**Chaotic**
- **Philosophy**: Unpredictable, creative, rule-breaking approaches
- **Visual**: Red accent with dynamic appearance
- **Examples**: Unconventional tactics, creative solutions, dramatic actions

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

Consequence-based gameplay where skill requirements are displayed but not evaluated until after the player commits to an action.

### Philosophy: Consequence Over Gating

Players see skill requirements on choices (e.g., "Sneak past guards [Stealth 8+]") but can attempt any action regardless of their skill level. The outcome is determined by their character's actual skill:

**Success** - Character has sufficient skill level, the action succeeds naturally in the narrative
**Failure** - Character lacks sufficient skill, the action fails or backfires with story consequences

### No Game Mechanics in Narrative

The AI never mentions skill names, skill levels, or game mechanics in the narrative. Outcomes are shown purely through what happens in the story:

- ❌ Wrong: "Your Mechanics skill, while only at level two, allows you to salvage a few components"
- ✅ Right: "Your hands fumble with the radio's internals. Despite your best efforts, wires snap and components crack under your inexperienced touch"

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

### Skill Evaluation Flow

1. **Choice Display**: Player sees options with skill badges showing requirements
2. **Player Selection**: Player chooses an action (not blocked by requirements)
3. **Skill Check**: System evaluates character's skill level against requirement
4. **Tag Generation**: Creates `skill-success:skillId` or `skill-failure:skillId` tag
5. **AI Guidance**: Tags guide AI to generate success or failure narrative
6. **Story Outcome**: Narrative reflects what actually happens, no mechanics mentioned

### Badge Display

```typescript
// Neutral badge showing requirement, no pass/fail colors
<Badge variant="skill-requirement">
  Stealth 8+
</Badge>
```

### AI Context Tags

The system adds contextual tags to guide narrative generation:

```typescript
// Success scenario
currentTags: ['skill-success:stealth']
// AI generates: "You slip past the guards unnoticed..."

// Failure scenario
currentTags: ['skill-failure:stealth']
// AI generates: "Your foot catches on loose gravel, alerting the nearest guard..."
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

Foundation system for character capabilities and world configuration.

### Attribute Ranges

**Fixed Range (MVP)**: 1-10 for all attributes
- **1**: Extremely low value (minimal capability)
- **5-6**: Average value (normal human capability)
- **10**: Extremely high value (peak human or beyond)

### Default Values

Default values represent "normal" in the game world:
- Influence starting character creation
- Guide NPC generation
- Set relative difficulty of challenges
- Can be set anywhere within 1-10 range

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

Attributes are configurable per world:
- **Name**: Custom attribute names (Strength, Arcane Power, etc.)
- **Description**: Explains the attribute's purpose
- **Default Value**: What's considered "normal" in this world
- **Range**: Fixed 1-10 for MVP, expandable later

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

- **Decision Weight**: Border styling and shadows indicate importance
- **Choice Alignment**: Left border colors show personality alignment
- **Custom Input**: Prominent textarea for player creativity
- **Context Summary**: Clear explanation of decision stakes

## Testing & Development

### Manual Testing Routes
- `/dev/game-session` - Test all mechanics in context
- `/dev/choice-selector` - Test individual choice components
- `/dev/world-creation-wizard` - Test attribute configuration

### Test Scenarios
1. **Decision Weights**: Minor, major, and critical choices
2. **Alignments**: All three alignment types in various contexts
3. **Attributes**: Different attribute configurations and ranges
4. **Integration**: Combined systems working together

## Best Practices

1. **Weight Assignment**: Use AI to determine appropriate decision weights
2. **Alignment Balance**: Ensure all three alignments are viable options
3. **Attribute Defaults**: Set meaningful defaults for world context
4. **Visual Clarity**: Maintain clear visual distinction between mechanics
5. **Player Agency**: Always allow custom input alongside generated choices