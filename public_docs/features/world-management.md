---
title: World Management
tags: [world, management, editing, deletion, configuration]
created: 2025-06-26
updated: 2026-07-21
---

# World Management

World creation is where the magic starts - it's where players define the rules and tone that make their narrative experience unique. The challenge was building something flexible enough for any fictional universe (Star Wars, Lovecraft, your own weird sci-fi thing) while keeping it simple enough that someone can just jump in and start playing.

So whether you want "Force Sensitivity" for Star Wars or "Sanity" for horror games, the system adapts to what you need while keeping character creation from becoming a spreadsheet nightmare.

## The Building Blocks of Your World

**Basic Setup** - Name, description, genre, and visual theme. This is like giving the AI a style guide for your universe so it knows whether to write like Star Trek or Game of Thrones.

**Custom Attributes** - Here's where you define what makes your world special. These are the core characteristics that actually matter in your setting. Want "Force Sensitivity" for Star Wars? "Sanity" for Lovecraft horror? "Cybernetic Integration" for your cyberpunk game? You define what's important. We keep the range simple (1-10) because nobody wants to calculate the difference between level 47 and level 53.

**World-Specific Skills** - The abilities that make sense in your setting. "Lightsaber Combat" for Star Wars, "Occult Knowledge" for horror, "Zero-G Maneuvering" for space opera. Range is 1-5 to keep character creation from turning into homework.

**Tone Settings** - This is how you tell the AI what kind of story you want:
- **Content rating** from G to NC-17 with clear guidelines about what that means
- **Narrative style** - whether you want serious drama, comedy, action-packed adventure, mysterious investigation, whatever fits your mood
- **Language complexity** and **pacing** so the AI matches how you like your stories told

**Attribute and Skill Caps** - We cap things at 6 attributes and 12 skills max. This prevents choice paralysis while still giving you enough customization for pretty much any setting you can think of.

## Creating New Worlds

The world creation wizard walks you through everything step by step, with AI assistance to speed things up. You never start from a blank form wondering what attributes a cyberpunk world should have.

### How the Wizard Works
1. **Pick Your Starting Point**: Original creation, setting it within an existing universe, or inspired by something you love
2. **Basic Info**: Give it a name, description, and genre - this is where you paint the big picture
3. **AI Does the Heavy Lifting**: The AI suggests attributes and skills based on your description. You can accept, reject, or modify any of them
4. **Make It Yours**: Edit the suggestions to match your vision exactly
5. **Final Review**: Make sure everything looks right before you start creating characters

### AI Integration
```typescript
// AI analyzes world description and generates suggestions
const analysis = await analyzeWorldDescriptionClient(
  "A mystical fantasy realm with ancient magic"
);

// User reviews and selects suggestions
const selectedSuggestions = userReviewSuggestions(analysis);

// Create world with AI suggestions and user customizations
const world = createWorld({
  ...basicInfo,
  attributes: selectedSuggestions.attributes,
  skills: selectedSuggestions.skills
});
```

## Editing Your Worlds

Sometimes you create a world and then realize you want to tweak things. Maybe you forgot that "Hacking" skill for your cyberpunk setting, or you want to bump up the content rating. The editing interface lets you change anything about your world after creation.

### What You Can Change
- **Basic Information**: Name, description, theme - maybe you want a darker tone or different genre emphasis
- **Attributes**: Add new ones, edit existing ones, remove the ones that aren't working out
- **Skills**: Add, edit, remove skills and change which attributes they're linked to
- **Settings**: Adjust world limits and point pools if your game balance needs tweaking

### Architecture
```
/worlds/[id]/edit (page)
  └── WorldEditor (component)
      ├── WorldBasicInfoForm
      ├── WorldAttributesForm
      ├── WorldSkillsForm
      └── WorldSettingsForm
```

### Form Components
Reusable form components located in `/src/components/forms/`:
- `WorldBasicInfoForm` - Name, description, theme editing
- `WorldAttributesForm` - Attribute management with validation
- `WorldSkillsForm` - Skill management with attribute linking
- `WorldSettingsForm` - World configuration and limits

### State Management
```typescript
// Uses worldStore for persistence
const { updateWorld, worlds } = useWorldStore();

// Optimistic UI updates
const handleSave = (worldData: Partial<World>) => {
  updateWorld(worldId, worldData);
  // UI updates immediately, persisted to IndexedDB
};
```

### Navigation Flow
1. Access via "Edit" button on world cards
2. Navigate to `/worlds/[id]/edit` route
3. Load existing world data into forms
4. Make modifications with live validation
5. Save changes with optimistic updates
6. Return to world list or continue editing

## Deleting Worlds (Safely)

We all create worlds we later decide we don't want. The deletion system makes sure you don't accidentally lose something important while still making it easy to clean up your world list.

### How It Protects You

**The Confirmation Dialog**
- Shows up as a modal with the world name clearly displayed - no guessing what you're about to delete
- Multiple ways to cancel: click "Cancel", press Escape, or click outside the dialog
- Only proceeds if you explicitly click "Delete"

**Where It Shows Up**
- Delete button appears on each world card
- Shows visual feedback while the deletion is happening
- Updates your world list immediately so there's no confusion

### The Deletion Process
1. You click the delete button on a world card
2. Dialog pops up showing the exact world name you're about to delete
3. You have multiple ways to back out or confirm
4. If you confirm, the world disappears from your list immediately
5. The deletion saves permanently - no recovering deleted worlds from the recycle bin

The goal is making deletion feel safe and predictable. You should never be surprised by what gets deleted or when.

### Implementation
```typescript
const handleDelete = (worldId: string) => {
  setDeleteDialogOpen(true);
  setWorldToDelete(worldId);
};

const confirmDelete = () => {
  if (worldToDelete) {
    deleteWorld(worldToDelete);
    setDeleteDialogOpen(false);
    setWorldToDelete(null);
  }
};

// Store action
const { deleteWorld } = useWorldStore();
```

### Safety Features
- **Confirmation Required**: No accidental deletions
- **World Name Display**: Clear identification of deletion target
- **Multiple Cancellation Options**: Easy to abort deletion
- **Immediate UI Update**: No confusion about deletion status

## Behind the Scenes Data Handling

### How Your Worlds Get Saved
- **Local Storage**: Everything saves to your browser's IndexedDB - no server required, works offline
- **Instant Saving**: Changes save as you make them, no "save" button needed
- **State Management**: Uses Zustand with persistence so your worlds survive browser restarts

### What Gets Validated
The system enforces some sensible limits to keep things manageable:
- **Attribute Limits**: 6 attributes max per world - enough for complexity without overwhelming character creation
- **Skill Limits**: 12 skills max per world - plenty of variety without choice paralysis  
- **Value Ranges**: Attributes 1-10, skills 1-5 for easy mental math
- **Required Fields**: Name and description are mandatory because worlds need context

### Export/Import
There isn't any. Worlds live in the browser's IndexedDB with no way to get one out as a file or
bring one back in, so a world doesn't travel between browsers or devices.

## Testing & Development

### Manual Testing
- `/dev/world-generation` - Test AI world generation end to end
- `/worlds/[id]/edit` - Test the production editing route with seeded or real local data

### Storybook Stories
- `WorldBasicInfoForm` - Form component testing
- `DeleteConfirmationDialog` - Dialog component testing
- `WorldCard` - World display and actions

### Test Coverage
- Unit tests for form validation
- Integration tests for creation/editing flow
- Store tests for CRUD operations
- Component tests for user interactions

## Best Practices

1. **Validation**: Enforce limits and required fields
2. **User Feedback**: Clear error messages and loading states
3. **Data Safety**: Confirmation dialogs for destructive actions
4. **Performance**: Optimistic updates for better UX
5. **Accessibility**: Keyboard navigation and screen reader support
