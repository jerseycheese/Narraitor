# Skill Check Evaluator

The Skill Check Evaluator is a utility module that provides deterministic evaluation of character skill checks in the Narraitor game system. It determines whether characters can successfully perform skill-based actions, which is used by the narrative system to control choice availability.

## Overview

This module implements a simple but effective skill check system:
- **Base Skill Value**: Character's skill level in the specific skill
- **Attribute Bonus**: 10% of linked attribute value (rounded)
- **Difficulty Threshold**: Target number to meet or exceed
- **Result**: Pass (true) or Fail (false)

## Core Functions

### `evaluateSkillCheck(character, skillCheck, worldSkills)`

The main evaluation function that determines if a character passes a skill check.

**Parameters:**
- `character: Character` - The character being evaluated
- `skillCheck: SkillCheck` - The skill check parameters
- `worldSkills: WorldSkill[]` - World skill definitions for lookup

**Returns:** `boolean` - true if passed, false if failed

**Example:**
```typescript
import { evaluateSkillCheck } from '@/utils/skillCheckEvaluator';

const result = evaluateSkillCheck(
  character,
  { skillId: 'athletics', difficulty: 10 },
  worldSkills
);
```

### `findWorldSkill(skillIdentifier, worldSkills)`

Helper function to find world skill definitions by ID or name.

**Parameters:**
- `skillIdentifier: { skillId?: string, skillName?: string }` - Skill identifier
- `worldSkills: WorldSkill[]` - Array of world skills to search

**Returns:** `WorldSkill | null` - The found skill or null

## Skill Check Interface

```typescript
interface SkillCheck {
  skillId?: string;     // Preferred: unique skill ID
  skillName?: string;   // Fallback: skill name
  difficulty: number;   // Difficulty threshold (1-20 typical range)
}
```

## Evaluation Process

1. **Validation**: Ensure skill identifier is provided
2. **Skill Lookup**: Find skill definition in world skills
3. **Character Check**: Verify character has the skill and it's active
4. **Base Value**: Start with character's skill level
5. **Attribute Bonus**: Add 10% of linked attribute value (if any)
6. **Threshold Check**: Compare total against difficulty

## Attribute Bonus Calculation

The attribute bonus provides a meaningful but balanced enhancement:

| Attribute Value | Bonus | Total Impact |
|----------------|-------|--------------|
| 10             | 1     | Minor boost  |
| 15             | 2     | Moderate boost |
| 20             | 2     | Good boost   |
| 25             | 3     | Strong boost |

**Formula:** `Math.round(attributeValue * 0.1)`

## Usage Examples

### Basic Skill Check
```typescript
const skillCheck = {
  skillId: 'persuasion',
  difficulty: 12
};

const passed = evaluateSkillCheck(character, skillCheck, worldSkills);
```

### Using Skill Names (Fallback)
```typescript
const skillCheck = {
  skillName: 'Athletics',
  difficulty: 8
};

const passed = evaluateSkillCheck(character, skillCheck, worldSkills);
```

### Finding Skills
```typescript
const skill = findWorldSkill({ skillId: 'stealth' }, worldSkills);
const skillByName = findWorldSkill({ skillName: 'Stealth' }, worldSkills);
```

## Edge Cases Handled

- **Missing Skills**: Returns false if character doesn't have the skill
- **Inactive Skills**: Returns false if character has skill but it's inactive
- **No Attributes**: Works with base skill value only
- **Multiple Attributes**: Uses first attribute for bonus calculation (MVP)
- **Invalid Identifiers**: Returns false for empty or invalid skill identifiers

## Integration Points

### Narrative System
Used to filter available choices based on character capabilities:

```typescript
const availableChoices = choices.filter(choice => {
  if (choice.skillRequirement) {
    return evaluateSkillCheck(character, choice.skillRequirement, worldSkills);
  }
  return true;
});
```

### Game Session
Real-time evaluation during gameplay:

```typescript
const canAttemptAction = evaluateSkillCheck(
  currentCharacter,
  action.skillCheck,
  world.skills
);
```

## Testing

The module includes comprehensive test coverage:
- 14 focused test cases
- Basic pass/fail scenarios
- Attribute bonus calculations
- Edge case handling
- Math.round behavior verification

Run tests:
```bash
npm test -- --testPathPattern=skillCheckEvaluator.test.ts
```

## Performance Considerations

- **O(n) Lookups**: Skill and attribute finding is linear time
- **No Caching**: Each evaluation is independent (stateless)
- **Memory Efficient**: No persistent state or large object creation
- **Fast Execution**: Simple arithmetic operations only

## Future Enhancements

Potential improvements for future versions:
- Support for multiple attribute bonuses
- Skill synergy bonuses
- Circumstantial modifiers
- Cached lookups for performance
- Configurable bonus percentages

## Related Documentation

- [Character Types](../types/character.types.ts)
- [World Types](../types/world.types.ts)
- [Narrative System](../lib/ai/narrativeGenerator.ts)
- [Character Data Enrichment](../lib/utils/characterDataEnrichment.ts)