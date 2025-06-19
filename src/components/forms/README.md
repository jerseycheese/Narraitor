# Form Components

This directory contains reusable form components used throughout the Narraitor application. These components were originally created for the world editing feature but are designed to be reusable for other entities.

## Available Components

### WorldBasicInfoForm
Handles basic information editing:
- Name input
- Description textarea
- Theme input

```tsx
<WorldBasicInfoForm 
  world={worldData} 
  onChange={(updates) => handleChange(updates)} 
/>
```

### WorldAttributesForm
Manages attribute lists with limit enforcement:
- Add/remove attributes with maxAttributes limit
- Edit attribute properties
- Category management
- Dependency warnings for linked skills
- Accessible UI with proper ARIA labels

```tsx
<WorldAttributesForm 
  attributes={attributes} 
  skills={skills}
  worldId={worldId}
  maxAttributes={world.settings.maxAttributes}
  onChange={(newAttributes) => handleAttributesChange(newAttributes)} 
/>
```

### WorldSkillsForm
Manages skill lists:
- Add/remove skills
- Link skills to attributes
- Difficulty settings

```tsx
<WorldSkillsForm 
  skills={skills}
  attributes={attributes}
  worldId={worldId}
  onChange={(newSkills) => handleSkillsChange(newSkills)} 
/>
```

### WorldSettingsForm
Configures numeric settings:
- Maximum limits
- Point pools
- Other numeric configurations

```tsx
<WorldSettingsForm 
  settings={settings}
  onChange={(newSettings) => handleSettingsChange(newSettings)} 
/>
```

## Design Principles

1. **Controlled Components**: All forms use controlled inputs
2. **Flexible Change Handlers**: Accept partial updates
3. **Type Safety**: Full TypeScript support
4. **Accessibility**: Proper labels and ARIA attributes
5. **Responsive**: Work on all screen sizes

## Testing

All components include comprehensive test coverage:
- Unit tests for user interactions
- Prop validation tests
- Edge case handling

## Future Plans

These components can be generalized for:
- Character editing
- Item management
- Campaign settings
- Any entity with similar data structures