# SkillEditor Component

Skills are where world building gets really interesting. This component handles creating and editing skills, but the tricky part is that skills can link to multiple attributes now - think "Persuasion" linking to both "Charisma" and "Intelligence".

## What Makes This Complex

The challenge was supporting multi-attribute skill linking without making the UI confusing. In the old system, each skill was tied to exactly one attribute. Simple, but limiting. Now a skill like "Stealth" might use both "Dexterity" and "Intelligence" (for knowing where guards patrol), so we needed checkboxes instead of a dropdown.

## Key Features

- **Multi-Attribute Linking**: Skills connect to one or more attributes via checkbox selection
- **Validation**: Prevents duplicate names and validates value ranges
- **Skill Limits**: Enforces a maximum of 12 skills per world (because nobody wants to manage 50 skills)
- **Delete Safety**: Shows warnings when deleting skills linked to multiple attributes
- **Clean Error Handling**: Clears validation errors when user starts making changes

## Usage

```tsx
import { SkillEditor } from '@/components/world/SkillEditor';

// Create mode
<SkillEditor
  worldId={worldId}
  mode="create"
  onSave={handleSave}
  onCancel={handleCancel}
  existingAttributes={attributes}
  existingSkills={skills}
/>

// Edit mode
<SkillEditor
  worldId={worldId}
  mode="edit"
  skillId={skillId}
  onSave={handleSave}
  onDelete={handleDelete}
  onCancel={handleCancel}
  existingAttributes={attributes}
  existingSkills={skills}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `worldId` | `EntityID` | Yes | ID of the world the skill belongs to |
| `mode` | `'create' \| 'edit'` | Yes | Whether to create a new skill or edit existing |
| `skillId` | `EntityID` | Conditional | Required for edit mode - ID of skill to edit |
| `onSave` | `(skill: WorldSkill) => void` | Yes | Called when skill is saved |
| `onDelete` | `(skillId: EntityID) => void` | No | Called when skill is deleted (edit mode only) |
| `onCancel` | `() => void` | Yes | Called when user cancels |
| `existingAttributes` | `WorldAttribute[]` | No | Available attributes for linking (default: []) |
| `existingSkills` | `WorldSkill[]` | No | Existing skills for validation (default: []) |

## The Data Structure Evolution

Here's the big change: we moved from single attribute linking to multi-attribute support. The updated `WorldSkill` interface now has an array of attribute IDs instead of just one:

```typescript
interface WorldSkill extends NamedEntity {
  worldId: EntityID;
  attributeIds?: EntityID[]; // NEW: Array of linked attribute IDs
  difficulty: SkillDifficulty;
  category?: string;
  baseValue: number;
  minValue: number;
  maxValue: number;
}
```

## Validation Logic

The validation rules are pretty straightforward, but there are a few gotchas:

- **Name**: Required (1-100 characters), must be unique within the world
- **Description**: Required (1-500 characters)
- **Attribute Links**: At least one attribute must be selected (this catches people sometimes)
- **Value Ranges**: minValue must be less than maxValue (seems obvious, but you'd be surprised)
- **Base Value**: Must be between minValue and maxValue
- **Skill Limit**: Configurable maximum skills per world (default: 12, because managing more gets unwieldy)

## Testing

The component includes tests covering:
- Create and edit modes
- Multi-attribute selection
- Validation scenarios
- Error handling
- Delete confirmation flows
- Edge cases and limits

Run tests with:
```bash
npm test -- --testPathPattern="SkillEditor.test.tsx"
```

## Storybook Stories

View component variations in Storybook:
```bash
npm run storybook
# Navigate to "Narraitor/World/SkillEditor"
```

## Test Harness

`SkillEditor.stories.tsx` covers interactive testing with realistic data.