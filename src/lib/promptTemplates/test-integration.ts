/**
 * Integration test for the Prompt Template System.
 * 
 * This file provides a simple way to test the functionality
 * of the PromptTemplateManager in a real-world scenario.
 * 
 * Run with: npx ts-node src/lib/promptTemplates/test-integration.ts
 */

import { PromptTemplateManager, PromptType } from './index';

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
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log('An unknown error occurred:', error);
  }
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
