# Character Archetypes Utility

A comprehensive utility system for generating genre-specific character archetypes that provide immediate game-ready characters for various world types.

## Core Functions

### `generateCharacterArchetypes(world, existingNames?)`

Generates 3 unique character archetypes tailored to the world's genre and attributes.

```tsx
import { generateCharacterArchetypes } from '@/lib/utils/characterArchetypes';

const world = {
  id: 'fantasy-world-1',
  name: 'Mystic Realms',
  genre: 'fantasy',
  attributes: [
    { id: 'str', name: 'Strength', minValue: 1, maxValue: 10 },
    { id: 'int', name: 'Intelligence', minValue: 1, maxValue: 10 }
  ],
  skills: [
    { id: 'combat', name: 'Combat', difficulty: 'medium' },
    { id: 'magic', name: 'Magic', difficulty: 'hard' }
  ]
};

const archetypes = await generateCharacterArchetypes(world, ['ExistingHero']);
// Returns 3 CharacterArchetype objects
```

### `generateRandomArchetype(world, existingNames?)`

Generates a single random character archetype for the world.

```tsx
import { generateRandomArchetype } from '@/lib/utils/characterArchetypes';

const randomCharacter = await generateRandomArchetype(world);
// Returns 1 CharacterArchetype object with randomized stats
```

## CharacterArchetype Interface

```tsx
interface CharacterArchetype {
  id: string;                    // Unique identifier
  name: string;                  // Character name (e.g., "Aelric the Brave")
  description: string;           // Brief character description
  level: number;                 // Character level (always 1 for new characters)
  
  attributes: Array<{
    id: string;                  // Matches world attribute IDs
    name: string;                // Attribute display name
    value: number;               // Assigned value based on archetype
  }>;
  
  skills: Array<{
    id: string;                  // Matches world skill IDs  
    name: string;                // Skill display name
    level: number;               // Skill level based on archetype
  }>;
  
  background: {
    description: string;         // Detailed background story
    personality: string;         // Character personality traits
    motivation: string;          // Primary motivation/goal
    fears: string[];            // Character fears and weaknesses
    physicalDescription: string; // Physical appearance
  };
}
```

## Genre Templates

### Fantasy Archetypes

#### Warrior
```tsx
{
  name: "Aelric the Brave",
  description: "A stalwart warrior trained in combat",
  primaryAttributes: ["Strength", "Constitution", "Dexterity"],
  primarySkills: ["Combat", "Athletics", "Intimidation"],
  personality: "Brave and steadfast, values honor above all",
  motivation: "To protect the innocent and uphold justice"
}
```

#### Mage  
```tsx
{
  name: "Lyra Spellweaver", 
  description: "A scholar of the mystical arts",
  primaryAttributes: ["Intelligence", "Wisdom", "Charisma"],
  primarySkills: ["Magic", "Investigation", "Arcana"],
  personality: "Curious and methodical, driven by knowledge",
  motivation: "To unlock the secrets of ancient magic"
}
```

#### Scout
```tsx
{
  name: "Kael Shadowstep",
  description: "A nimble scout and tracker", 
  primaryAttributes: ["Dexterity", "Perception", "Wisdom"],
  primarySkills: ["Stealth", "Survival", "Investigation"],
  personality: "Independent and observant, prefers solitude",
  motivation: "To explore uncharted territories"
}
```

### Sci-fi Archetypes

#### Pilot
```tsx
{
  name: "Nova Stardust",
  description: "An ace starship pilot",
  primaryAttributes: ["Dexterity", "Intelligence", "Perception"],
  primarySkills: ["Piloting", "Technology", "Navigation"],
  personality: "Adventurous and confident, thrives on danger",
  motivation: "To explore the far reaches of space"
}
```

#### Engineer
```tsx
{
  name: "Zara Techwright",
  description: "A brilliant systems engineer",
  primaryAttributes: ["Intelligence", "Constitution", "Dexterity"], 
  primarySkills: ["Technology", "Repair", "Investigation"],
  personality: "Methodical and innovative, loves solving problems",
  motivation: "To build technology that helps humanity"
}
```

#### Medic
```tsx
{
  name: "Dr. Marcus Healer",
  description: "A dedicated field medic",
  primaryAttributes: ["Wisdom", "Intelligence", "Charisma"],
  primarySkills: ["Medicine", "Science", "Empathy"],
  personality: "Compassionate and dedicated, puts others first", 
  motivation: "To save lives and reduce suffering"
}
```

### Additional Genre Support

The system supports multiple additional genres with appropriate archetype templates:

- **Western**: Gunslinger, Sheriff, Prospector
- **Historical**: Knight, Merchant, Scholar  
- **Horror**: Investigator, Survivor, Medium
- **Mystery**: Detective, Reporter, Psychologist
- **Cyberpunk**: Hacker, Corporate, Street Samurai

## Attribute and Skill Assignment

### Attribute Distribution Algorithm

```tsx
// Primary attributes get higher values (6-9)
// Secondary attributes get medium values (4-6) 
// Other attributes get lower values (2-4)

const assignAttributes = (template, worldAttributes) => {
  const assignments = {};
  
  template.primaryAttributes.forEach(attrName => {
    const worldAttr = findWorldAttribute(attrName, worldAttributes);
    assignments[worldAttr.id] = randomBetween(6, 9);
  });
  
  // Additional logic for secondary and remaining attributes...
};
```

### Skill Level Assignment

```tsx
// Primary skills get levels 5-8
// Secondary skills get levels 2-5
// Other skills get levels 1-3

const assignSkills = (template, worldSkills) => {
  const assignments = {};
  
  template.primarySkills.forEach(skillName => {
    const worldSkill = findWorldSkill(skillName, worldSkills);
    assignments[worldSkill.id] = randomBetween(5, 8);
  });
  
  // Additional logic for secondary and remaining skills...
};
```

## Error Handling

### Unsupported Genre Fallback

```tsx
// When world.genre is not recognized, falls back to generic archetypes
if (!GENRE_TEMPLATES[world.genre]) {
  console.warn(`Unknown genre "${world.genre}", using generic templates`);
  return generateGenericArchetypes(world, existingNames);
}
```

### Missing World Data

```tsx
// Validates required world properties
const validateWorld = (world) => {
  if (!world.attributes?.length) {
    throw new Error('World must have at least one attribute');
  }
  if (!world.skills?.length) {
    throw new Error('World must have at least one skill');
  }
  if (!world.genre) {
    throw new Error('World must specify a genre');
  }
};
```

### Name Uniqueness

```tsx
// Ensures generated names don't conflict with existing characters
const generateUniqueName = (baseName, existingNames = []) => {
  let name = baseName;
  let counter = 1;
  
  while (existingNames.includes(name)) {
    name = `${baseName} ${getRomanNumeral(counter)}`;
    counter++;
  }
  
  return name;
};
```

## Performance Considerations

### Caching Strategy

```tsx
// Templates are cached to avoid repeated processing
const templateCache = new Map();

const getGenreTemplate = (genre) => {
  if (!templateCache.has(genre)) {
    templateCache.set(genre, processGenreTemplate(genre));
  }
  return templateCache.get(genre);
};
```

### Batch Generation

```tsx
// Multiple archetypes generated efficiently in single operation
const generateMultipleArchetypes = async (world, count = 3) => {
  const templates = getGenreTemplates(world.genre);
  return Promise.all(
    templates.slice(0, count).map(template => 
      createArchetypeFromTemplate(template, world)
    )
  );
};
```

## Integration Examples

### WorldCreationWizard Integration

```tsx
import { generateCharacterArchetypes } from '@/lib/utils/characterArchetypes';

// In QuickStartStep component
useEffect(() => {
  const loadArchetypes = async () => {
    try {
      const archetypes = await generateCharacterArchetypes(world);
      setArchetypes(archetypes);
    } catch (error) {
      setError('Failed to generate character options');
    }
  };
  
  loadArchetypes();
}, [world]);
```

### Character Store Integration

```tsx
import { generateRandomArchetype } from '@/lib/utils/characterArchetypes';
import { useCharacterStore } from '@/state/characterStore';

const { createCharacter } = useCharacterStore();

const handleQuickStart = async () => {
  const archetype = await generateRandomArchetype(world);
  const characterId = createCharacter(archetype, world.id);
  startGameSession(world.id, characterId);
};
```

## Testing

### Unit Tests

```bash
npm test src/lib/utils/__tests__/characterArchetypes.test.ts
```

### Test Coverage

- ✅ Genre template validation
- ✅ Attribute assignment algorithms  
- ✅ Skill level distribution
- ✅ Name uniqueness enforcement
- ✅ Error handling for invalid inputs
- ✅ Performance with large datasets

## Related Utilities

- **Character Store**: State management for created characters
- **World Validation**: Ensures world data meets archetype requirements
- **Name Generator**: Creates unique character names
- **Stat Calculator**: Handles attribute and skill calculations