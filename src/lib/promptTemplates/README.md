# Prompt Template System

So this is the system for managing AI prompt templates across the app. The basic idea is that instead of hardcoding prompts everywhere, you define reusable templates with variables, and the system handles substituting the actual values when you need to generate content.

## Why This Exists

When you're working with AI for character generation, world building, or narrative content, you end up with a lot of similar prompts scattered throughout the codebase. This gets messy fast, and it's hard to maintain consistency. The template system centralizes all that logic and makes it easy to tweak prompts without hunting through dozens of files.

## How It Works

The system is pretty straightforward. You create templates with `{{variable}}` placeholders, define what variables are needed, and then process the template with actual values when you need it. It also does some validation to make sure you don't reference variables that don't exist.

Here's a basic example:

```typescript
import { PromptTemplateManager } from '@/lib/promptTemplates/promptTemplateManager';
import { PromptType } from '@/lib/promptTemplates/types';

const manager = new PromptTemplateManager();

// Add a character template
manager.addTemplate({
  id: 'hero-template',
  type: PromptType.CHARACTER,
  content: 'Create a hero named {{name}} with {{power}} as their main power.',
  variables: [
    { name: 'name', description: 'Hero name' },
    { name: 'power', description: 'Hero power' }
  ]
});

// Use it later
const prompt = manager.processTemplate('hero-template', {
  name: 'Alice',
  power: 'telekinesis'
});
// Result: "Create a hero named Alice with telekinesis as their main power."
```

## Managing Templates

The manager handles all the CRUD operations you'd expect. You can add templates, update them, remove them, and organize them by type:

```typescript
// Get a specific template
const template = manager.getTemplate('hero-template');

// Update an existing one
manager.updateTemplate('hero-template', {
  id: 'hero-template',
  type: PromptType.CHARACTER,
  content: 'Create a hero named {{name}} with {{power}} and {{weakness}}.',
  variables: [
    { name: 'name', description: 'Hero name' },
    { name: 'power', description: 'Hero power' },
    { name: 'weakness', description: 'Hero weakness' }
  ]
});

// Remove it entirely
manager.removeTemplate('hero-template');
```

## Organizing by Type

Templates are categorized by what they're used for - character generation, world building, narrative content, etc. This makes it easier to find the right template and keeps things organized:

```typescript
// Get all character templates
const characterTemplates = manager.getTemplatesByType(PromptType.CHARACTER);

// See what types are available
const allTypes = manager.getAllTemplateTypes();

// Get everything if you need it
const allTemplates = manager.getAllTemplates();
```

## Template Validation

The system validates templates to catch common mistakes. If you reference a variable in your template content but forget to define it in the variables array, it'll throw an error:

```typescript
// This will fail because {{age}} isn't defined
try {
  manager.addTemplate({
    id: 'invalid-template',
    type: PromptType.CHARACTER,
    content: 'Character named {{name}} who is {{age}} years old',
    variables: [
      { name: 'name', description: 'Character name' }
      // Missing 'age' variable definition
    ]
  });
} catch (error) {
  console.error(error.message);
  // Error: "Template references undefined variable: age"
}
```

## Variable Substitution

When you process a template, the system finds all the `{{variable}}` placeholders and replaces them with the values you provide. It handles special characters properly and will throw an error if you're missing any required variables.

```typescript
const prompt = manager.processTemplate('character-template', {
  name: 'Alice',
  age: '30',
  trait: 'curiosity'
});
```

## Different Template Types

The system supports different prompt types for different use cases:

- **CHARACTER**: For generating character descriptions, backstories, motivations
- **WORLD**: For creating world descriptions, locations, cultures
- **NARRATIVE**: For story content, scene descriptions, dialogue
- **CHOICE**: For generating decision options and consequences

Each type can have its own conventions and variable patterns, which helps keep prompts consistent within their domain.

## Integration with AI Services

This system is designed to work with the AI integration layer. Instead of building prompts manually everywhere, you grab a template, fill in the variables, and send it off to the AI service. This makes it much easier to experiment with different prompt formulations and maintain consistency across the app.

The templates themselves are just strings - the magic happens in how you use them with the actual AI calls.
