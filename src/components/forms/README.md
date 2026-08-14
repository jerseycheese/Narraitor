# Form Components

These components started life as part of the world editing feature, but we built them to be reusable from the beginning. The challenge was creating form components that could handle complex data structures (like worlds with attributes, skills, and settings) while still being flexible enough to work with other entities later.

We wanted to avoid the classic mistake of building super-specific forms that only work in one place, so these components are building blocks you can use for any similar data editing needs.

## Available Components

### WorldBasicInfoForm
This one handles the simple stuff that every entity needs:
- Name input (with validation)
- Description textarea (expandable)
- Theme input (for setting the overall vibe)

```tsx
<WorldBasicInfoForm 
  world={worldData} 
  onChange={(updates) => handleChange(updates)} 
/>
```

### WorldAttributesForm
This one's more complex because attributes can get pretty involved:
- Add/remove attributes (but respects the maxAttributes limit)
- Edit all the attribute properties inline
- Organize attributes by category
- Shows warnings when you try to delete attributes that have skills linked to them
- Fully accessible with proper ARIA labels for screen readers

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
Skills are where the RPG mechanics really come alive:
- Add/remove skills as needed
- Link skills to specific attributes (so strength-based skills connect to the strength attribute)
- Set difficulty levels for each skill

```tsx
<WorldSkillsForm 
  skills={skills}
  attributes={attributes}
  worldId={worldId}
  onChange={(newSkills) => handleSkillsChange(newSkills)} 
/>
```

### WorldSettingsForm
This handles all the numeric configuration stuff:
- Maximum limits (like how many attributes a character can have)
- Point pools (for character creation budgets)
- Other numeric settings that control how the world works

```tsx
<WorldSettingsForm 
  settings={settings}
  onChange={(newSettings) => handleSettingsChange(newSettings)} 
/>
```

## Design Principles

Here's what makes these components work well together:

1. **Controlled Components**: All forms use controlled inputs, so the parent component always knows what's happening
2. **Flexible Change Handlers**: They accept partial updates, which means you can change just one field without worrying about the rest
3. **Type Safety**: Full TypeScript support means you'll catch mistakes at build time, not runtime
4. **Accessibility**: Proper labels and ARIA attributes are baked in
5. **Responsive**: They work on phones, tablets, and desktops without extra configuration

## Testing

We've got solid test coverage on these:
- Unit tests for all the user interactions (clicking, typing, etc.)
- Prop validation tests to catch configuration mistakes
- Edge case handling for when things go wrong

## Future Plans

The nice thing about building these as reusable components is that we can use them for other entities down the road:
- Character editing forms (probably 80% similar to world editing)
- Item management (similar patterns for attributes and properties)
- Campaign settings (lots of numeric configuration like WorldSettingsForm)
- Pretty much any entity that has similar data structures