---
title: World Management
tags: [world, management, editing, deletion, configuration]
created: 2025-06-26
updated: 2025-06-26
---

# World Management

This world creation is where users define the rules and tone for their narrative experiences. The challenge was making this flexible enough for any fictional universe while keeping it approachable for users who just want to jump in and play.

## How World Configuration Works

**Basic Setup** - Name, description, genre, and visual theme. This gives the AI context about what kind of stories to generate.

**Custom Attributes** - These are the core characteristics that matter in your world. Want "Force Sensitivity" for Star Wars? "Sanity" for Lovecraft? You define what's important. Range is 1-10 for simplicity.

**World-Specific Skills** - Abilities that make sense for your setting. "Lightsaber Combat" for Star Wars, "Occult Knowledge" for horror settings. Range is 1-5 to keep character creation manageable.

**Tone Settings** - This controls how the AI generates content:
- **Content rating** from G to NC-17 with clear content guidelines
- **Narrative style** - serious, humorous, dramatic, mysterious, action-packed
- **Language complexity** and **pacing** to match your preferences

**Constraints** - Up to 6 attributes and 12 skills max. This keeps character creation from becoming overwhelming while allowing enough customization for most settings.

## World Creation

Multi-step wizard with AI assistance for creating new worlds.

### Creation Flow
1. **World Type**: Choose Original, Set Within, or Inspired By
2. **Basic Info**: Name, description, genre selection
3. **AI Suggestions**: Review and accept/reject AI-generated attributes and skills
4. **Customization**: Manual editing of accepted suggestions
5. **Review**: Final world configuration review

### AI Integration
```typescript
// AI analyzes world description and generates suggestions
const suggestions = await generateWorldSuggestions({
  description: "A mystical fantasy realm with ancient magic",
  genre: "fantasy",
  worldType: "original"
});

// User reviews and selects suggestions
const selectedSuggestions = userReviewSuggestions(suggestions);

// Create world with AI suggestions and user customizations
const world = createWorld({
  ...basicInfo,
  attributes: selectedSuggestions.attributes,
  skills: selectedSuggestions.skills
});
```

## World Editing

Complete editing interface for modifying existing worlds after creation.

### Editing Features
- **Basic Information**: Name, description, theme modifications
- **Attributes**: Add, edit, remove world attributes
- **Skills**: Add, edit, remove skills and attribute linkings
- **Settings**: Configure world limits and point pools

### Architecture
```
/world/[id]/edit (page)
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
2. Navigate to `/world/[id]/edit` route
3. Load existing world data into forms
4. Make modifications with live validation
5. Save changes with optimistic updates
6. Return to world list or continue editing

## World Deletion

Safe world deletion with confirmation dialog to prevent accidental loss.

### Deletion Components

**DeleteConfirmationDialog**
- Location: `/src/components/DeleteConfirmationDialog`
- Reusable modal dialog with cancel/confirm actions
- Shows world name for verification
- Supports keyboard navigation (Escape to cancel)

**WorldCard Integration**
- Delete button on world cards
- Triggers confirmation dialog before deletion
- Visual feedback during deletion process

### User Flow
1. User clicks delete button on world card
2. Confirmation dialog displays with world name
3. User options:
   - Click "Cancel" to abort
   - Click "Delete" to confirm
   - Press Escape to cancel
   - Click outside dialog to cancel
4. If confirmed, world is deleted from store
5. World list updates immediately
6. Deletion persists between sessions

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

## World Templates

Pre-configured worlds for quick start and inspiration.

### Template Types
- **Genre Templates**: Fantasy, Western, Sci-Fi, Modern, Historical
- **Custom Templates**: User-saved world configurations
- **AI-Generated**: Smart templates based on user input

### Template Features
- Complete attribute and skill configurations
- Genre-appropriate tone settings
- Thematic descriptions and naming
- Ready-to-use world foundations

## Data Management

### Persistence
- **IndexedDB Storage**: All worlds persisted locally
- **Automatic Saving**: Changes saved immediately
- **State Synchronization**: Zustand store with persistence middleware

### Validation
- **Attribute Limits**: Maximum 6 attributes per world
- **Skill Limits**: Maximum 12 skills per world
- **Range Validation**: Attributes 1-10, skills 1-5
- **Required Fields**: Name and description mandatory

### Export/Import
```typescript
// Export world configuration
const exportWorld = (worldId: string) => {
  const world = worlds[worldId];
  const exportData = {
    ...world,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  downloadJSON(exportData, `${world.name}.json`);
};

// Import world configuration
const importWorld = (worldData: WorldExport) => {
  const worldId = createWorld({
    ...worldData,
    id: generateUniqueId('world'),
    createdAt: new Date().toISOString()
  });
  return worldId;
};
```

## Testing & Development

### Manual Testing
- `/dev/world-creation-wizard` - Test world creation flow
- `/dev/world-editor` - Test editing interface
- `/dev` - Test world list and management

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