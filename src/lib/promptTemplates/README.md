# Prompt Template System

A system for defining, managing, and processing prompt templates for different AI use cases, ensuring consistent and appropriate content generation.

## Overview

This module provides a template system that:
- Supports different prompt types (Character, World, Narrative, etc.)
- Allows variable substitution using standardized `{{variable}}` syntax
- Provides appropriate instructions for AI based on template purpose
- Organizes templates by use case type
- Validates templates to ensure they contain required elements

## Usage Examples

### Creating and Managing Templates

```typescript
import { PromptTemplateManager, PromptType } from '../lib/promptTemplates';

// Create a template manager
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

// Get a template by ID
const template = manager.getTemplate('hero-template');
console.log(template);

// Update an existing template
manager.updateTemplate('hero-template', {
  id: 'hero-template',
  type: PromptType.CHARACTER,
  content: 'Create a hero named {{name}} with {{power}} as their main power and {{weakness}} as their weakness.',
  variables: [
    { name: 'name', description: 'Hero name' },
    { name: 'power', description: 'Hero power' },
    { name: 'weakness', description: 'Hero weakness' }
  ]
});

// Remove a template
manager.removeTemplate('hero-template');
```

### Processing Templates with Variables

```typescript
import { PromptTemplateManager, PromptType } from '../lib/promptTemplates';

const manager = new PromptTemplateManager();

// Add a character template
manager.addTemplate({
  id: 'character-template',
  type: PromptType.CHARACTER,
  content: 'Create a character named {{name}} who is {{age}} years old and has {{trait}} as their main trait.',
  variables: [
    { name: 'name', description: 'Character name' },
    { name: 'age', description: 'Character age' },
    { name: 'trait', description: 'Character trait' }
  ]
});

// Process the template with variable values
const prompt = manager.processTemplate('character-template', {
  name: 'Alice',
  age: '30',
  trait: 'curiosity'
});

// Result: "Create a character named Alice who is 30 years old and has curiosity as their main trait."
console.log(prompt);
```

### Organizing Templates by Type

```typescript
import { PromptTemplateManager, PromptType } from '../lib/promptTemplates';

const manager = new PromptTemplateManager();

// Add templates of different types
manager.addTemplate({
  id: 'character-template',
  type: PromptType.CHARACTER,
  content: '...',
  variables: []
});

manager.addTemplate({
  id: 'world-template',
  type: PromptType.WORLD,
  content: '...',
  variables: []
});

// Get all templates of a specific type
const characterTemplates = manager.getTemplatesByType(PromptType.CHARACTER);
console.log(characterTemplates);

// Get all available template types
const allTypes = manager.getAllTemplateTypes();
console.log(allTypes);

// Get all templates
const allTemplates = manager.getAllTemplates();
console.log(allTemplates);
```

## Template Validation

Templates are validated to ensure they contain all required fields and that all variable references in the content match the defined variables.

```typescript
import { PromptTemplateManager, PromptType } from '../lib/promptTemplates';

const manager = new PromptTemplateManager();

// This will throw an error because the template references {{age}} but doesn't define it
try {
  manager.addTemplate({
    id: 'invalid-template',
    type: PromptType.CHARACTER,
    content: 'Character named {{name}} who is {{age}} years old',
    variables: [
      { name: 'name', description: 'Character name' }
      // 'age' variable is missing
    ]
  });
} catch (error) {
  console.error(error.message);
  // Error: "Template references undefined variable: age"
}
```

## Test Coverage

| Aspect | Status | Notes |
|--------|--------|-------|
| Template Management | ✅ | CRUD operations on templates |
| Variable Substitution | ✅ | Variable replacement with special character handling |
| Template Organization | ✅ | Organization by type with retrieval methods |
| Template Validation | ✅ | Validation of required fields and variables |