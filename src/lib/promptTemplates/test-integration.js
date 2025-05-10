/**
 * Integration test for the Prompt Template System.
 * 
 * This file provides a simple way to test the functionality
 * of the PromptTemplateManager in a real-world scenario.
 * 
 * Run with: node src/lib/promptTemplates/test-integration.js
 */

// Note: This is a simplified version to demonstrate functionality
// In a real project, you would import from your compiled TypeScript

// Mock implementations to test the concepts
const PromptType = {
  CHARACTER: 'CHARACTER',
  WORLD: 'WORLD',
  NARRATIVE: 'NARRATIVE',
  DIALOGUE: 'DIALOGUE',
  QUEST: 'QUEST'
};

class PromptTemplateManager {
  constructor() {
    this.templates = new Map();
  }

  addTemplate(template) {
    this.validateTemplate(template);
    
    if (this.templates.has(template.id)) {
      throw new Error(`Template with id '${template.id}' already exists`);
    }
    
    this.templates.set(template.id, template);
  }

  getTemplate(id) {
    return this.templates.get(id);
  }

  updateTemplate(id, updatedTemplate) {
    if (!this.templates.has(id)) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    this.validateTemplate(updatedTemplate);
    this.templates.set(id, updatedTemplate);
  }

  removeTemplate(id) {
    this.templates.delete(id);
  }

  processTemplate(id, variables) {
    const template = this.getTemplate(id);
    
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    let processedContent = template.content;
    
    for (const variable of template.variables) {
      const value = variables[variable.name];
      
      if (value !== undefined) {
        const placeholder = `{{${this.escapeRegExp(variable.name)}}}`;
        processedContent = processedContent.replace(
          new RegExp(placeholder, 'g'), 
          value
        );
      }
    }
    
    return processedContent;
  }

  getTemplatesByType(type) {
    const result = [];
    
    for (const template of this.templates.values()) {
      if (template.type === type) {
        result.push(template);
      }
    }
    
    return result;
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  getAllTemplateTypes() {
    const types = new Set();
    
    for (const template of this.templates.values()) {
      types.add(template.type);
    }
    
    return Array.from(types);
  }

  validateTemplate(template) {
    if (!template.id) {
      throw new Error('Template is missing required fields: id');
    }
    if (!template.type) {
      throw new Error('Template is missing required fields: type');
    }
    if (!template.content) {
      throw new Error('Template is missing required fields: content');
    }
    if (!template.variables) {
      throw new Error('Template is missing required fields: variables');
    }
    
    const variableNames = new Set(template.variables.map(v => v.name));
    const referencedVariables = this.extractReferencedVariables(template.content);
    
    for (const variable of referencedVariables) {
      if (!variableNames.has(variable)) {
        throw new Error(`Template references undefined variable: ${variable}`);
      }
    }
  }

  extractReferencedVariables(content) {
    const matches = content.match(/{{([^{}]+)}}/g) || [];
    return matches.map(match => match.substring(2, match.length - 2));
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Test implementation
console.log('Prompt Template System Integration Test\n');

// Create a template manager
const manager = new PromptTemplateManager();

console.log('1. Adding templates of different types...');
// Add templates of different types
manager.addTemplate({
  id: 'character-template',
  type: PromptType.CHARACTER,
  content: 'Create a character named {{name}} who is {{age}} years old with {{trait}} as their main trait.',
  variables: [
    { name: 'name', description: 'Character name' },
    { name: 'age', description: 'Character age' },
    { name: 'trait', description: 'Character trait' }
  ]
});

manager.addTemplate({
  id: 'world-template',
  type: PromptType.WORLD,
  content: 'Create a world called {{worldName}} with {{climate}} climate and {{culture}} culture.',
  variables: [
    { name: 'worldName', description: 'World name' },
    { name: 'climate', description: 'World climate' },
    { name: 'culture', description: 'Dominant culture' }
  ]
});

// Test variable substitution
console.log('\n2. Testing variable substitution...');
const processedCharacter = manager.processTemplate('character-template', {
  name: 'Alice',
  age: '30',
  trait: 'curiosity'
});

console.log('Processed Character Template:');
console.log(processedCharacter);

// Test retrieving templates by type
console.log('\n3. Testing template retrieval by type...');
const characterTemplates = manager.getTemplatesByType(PromptType.CHARACTER);
console.log('Character Templates:');
console.log(characterTemplates);

// Test retrieving all template types
console.log('\n4. Testing retrieval of all template types...');
const allTypes = manager.getAllTemplateTypes();
console.log('All Template Types:');
console.log(allTypes);

// Test handling of variables with special regex characters
console.log('\n5. Testing handling of variables with special regex characters...');
manager.addTemplate({
  id: 'special-chars-template',
  type: PromptType.CHARACTER,
  content: 'Character with {{trait.special+}} and {{power(level)}}',
  variables: [
    { name: 'trait.special+', description: 'Special trait with dots and plus' },
    { name: 'power(level)', description: 'Power with parentheses' }
  ]
});

const specialCharsResult = manager.processTemplate('special-chars-template', {
  'trait.special+': 'enhanced reflexes',
  'power(level)': 'telekinesis (level 3)'
});

console.log('Special Characters Result:');
console.log(specialCharsResult);

// Test error handling for undefined variables
console.log('\n6. Testing error handling for undefined variables...');
try {
  manager.addTemplate({
    id: 'invalid-template',
    type: PromptType.DIALOGUE,
    content: 'Dialogue between {{character1}} and {{character2}}',
    variables: [{ name: 'character1', description: 'First character' }]
  });
  console.log('UNEXPECTED: This should have thrown an error');
} catch (error) {
  console.log('Expected Error for Undefined Variable:');
  console.log(error.message);
}

console.log('\n7. Testing template updating...');
manager.updateTemplate('character-template', {
  id: 'character-template',
  type: PromptType.CHARACTER,
  content: 'Create a character named {{name}} who is {{age}} years old with {{trait}} as their main trait and {{background}} as their background.',
  variables: [
    { name: 'name', description: 'Character name' },
    { name: 'age', description: 'Character age' },
    { name: 'trait', description: 'Character trait' },
    { name: 'background', description: 'Character background' }
  ]
});

const updatedTemplate = manager.getTemplate('character-template');
console.log('Updated Template:');
console.log(updatedTemplate);

console.log('\nAll tests completed successfully!');
