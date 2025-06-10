# SkillEditor Component

The SkillEditor component provides a comprehensive interface for creating and editing skills within a world, including the ability to link skills to multiple attributes.

## Features

- **Multi-Attribute Linking**: Skills can be connected to one or more attributes via checkbox selection
- **Skill Validation**: Prevents duplicate names and validates value ranges
- **Skill Limit Enforcement**: Enforces a maximum of 12 skills per world
- **Delete Confirmation**: Shows warnings when deleting skills linked to multiple attributes
- **Form State Management**: Clears validation errors when user makes changes

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
| `worldId` | `EntityID` | ✅ | ID of the world the skill belongs to |
| `mode` | `'create' \| 'edit'` | ✅ | Whether to create a new skill or edit existing |
| `skillId` | `EntityID` | ⚠️ | Required for edit mode - ID of skill to edit |
| `onSave` | `(skill: WorldSkill) => void` | ✅ | Called when skill is saved |
| `onDelete` | `(skillId: EntityID) => void` | ❌ | Called when skill is deleted (edit mode only) |
| `onCancel` | `() => void` | ✅ | Called when user cancels |
| `existingAttributes` | `WorldAttribute[]` | ❌ | Available attributes for linking (default: []) |
| `existingSkills` | `WorldSkill[]` | ❌ | Existing skills for validation (default: []) |

## Data Structure Changes

This component works with the updated `WorldSkill` interface that supports multiple attribute connections:

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

## Validation Rules

- **Name**: Required (1-100 characters), must be unique within the world
- **Description**: Required (1-500 characters)
- **Attribute Links**: At least one attribute must be selected
- **Value Ranges**: minValue must be less than maxValue
- **Base Value**: Must be between minValue and maxValue
- **Skill Limit**: Configurable maximum skills per world (default: 12)

## Testing

The component includes comprehensive tests covering:
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

Manual testing available at `/dev/skill-editor` route for interactive testing with realistic data.