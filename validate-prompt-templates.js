/**
 * Simple validation script for prompt templates
 * Run with: node validate-prompt-templates.js
 */

// Note: This is a simplified version that demonstrates the essential functionality.
// In a real project, you would import from your compiled TypeScript.

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

// Simple test function that runs tests and reports results
function runTests() {
  const tests = [
    testTemplateCreation,
    testVariableSubstitution,
    testSpecialCharacters,
    testTemplateRetrieval,
    testTemplateValidation
  ];
  
  let passed = 0;
  let failed = 0;
  
  console.log('Running Prompt Template System Tests');
  console.log('====================================');
  
  for (const test of tests) {
    try {
      test();
      console.log(`✅ PASSED: ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAILED: ${test.name}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\nTest Results:');
  console.log(`${passed} tests passed, ${failed} tests failed`);
  
  return failed === 0;
}

// Test functions
function testTemplateCreation() {
  const manager = new PromptTemplateManager();
  
  // Test adding a template
  const template = {
    id: 'test-template',
    type: PromptType.CHARACTER,
    content: 'Template content',
    variables: []
  };
  
  manager.addTemplate(template);
  const result = manager.getTemplate('test-template');
  
  if (!result || result.id !== 'test-template') {
    throw new Error('Failed to add and retrieve template');
  }
  
  // Test duplicate prevention
  try {
    manager.addTemplate({...template});
    throw new Error('Should have prevented duplicate template');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
    // This is expected
  }
  
  // Test updating a template
  manager.updateTemplate('test-template', {
    ...template,
    content: 'Updated content'
  });
  
  const updated = manager.getTemplate('test-template');
  if (updated.content !== 'Updated content') {
    throw new Error('Failed to update template');
  }
  
  // Test removing a template
  manager.removeTemplate('test-template');
  if (manager.getTemplate('test-template')) {
    throw new Error('Failed to remove template');
  }
}

function testVariableSubstitution() {
  const manager = new PromptTemplateManager();
  
  const template = {
    id: 'var-template',
    type: PromptType.CHARACTER,
    content: 'Create a character named {{name}} who is {{age}} years old.',
    variables: [
      { name: 'name', description: 'Character name' },
      { name: 'age', description: 'Character age' }
    ]
  };
  
  manager.addTemplate(template);
  
  const result = manager.processTemplate('var-template', {
    name: 'Alice',
    age: '30'
  });
  
  if (result !== 'Create a character named Alice who is 30 years old.') {
    throw new Error('Variable substitution failed');
  }
  
  // Test with missing variables
  const resultWithMissingVar = manager.processTemplate('var-template', {
    name: 'Bob'
    // age is missing
  });
  
  if (resultWithMissingVar !== 'Create a character named Bob who is {{age}} years old.') {
    throw new Error('Missing variable handling failed');
  }
}

function testSpecialCharacters() {
  const manager = new PromptTemplateManager();
  
  const template = {
    id: 'special-chars',
    type: PromptType.CHARACTER,
    content: 'Character with {{trait.special+}} and {{power(level)}}',
    variables: [
      { name: 'trait.special+', description: 'Special trait with dots and plus' },
      { name: 'power(level)', description: 'Power with parentheses' }
    ]
  };
  
  manager.addTemplate(template);
  
  const result = manager.processTemplate('special-chars', {
    'trait.special+': 'enhanced reflexes',
    'power(level)': 'telekinesis (level 3)'
  });
  
  if (result !== 'Character with enhanced reflexes and telekinesis (level 3)') {
    throw new Error('Special character handling failed');
  }
}

function testTemplateRetrieval() {
  const manager = new PromptTemplateManager();
  
  manager.addTemplate({
    id: 'character-template',
    type: PromptType.CHARACTER,
    content: 'Character template',
    variables: []
  });
  
  manager.addTemplate({
    id: 'world-template',
    type: PromptType.WORLD,
    content: 'World template',
    variables: []
  });
  
  // Test retrieving by type
  const characterTemplates = manager.getTemplatesByType(PromptType.CHARACTER);
  if (characterTemplates.length !== 1 || characterTemplates[0].id !== 'character-template') {
    throw new Error('Type-based template retrieval failed');
  }
  
  // Test getting all types
  const types = manager.getAllTemplateTypes();
  if (types.length !== 2 || !types.includes(PromptType.CHARACTER) || !types.includes(PromptType.WORLD)) {
    throw new Error('Getting all template types failed');
  }
  
  // Test getting all templates
  const allTemplates = manager.getAllTemplates();
  if (allTemplates.length !== 2) {
    throw new Error('Getting all templates failed');
  }
}

function testTemplateValidation() {
  const manager = new PromptTemplateManager();
  
  // Valid template
  const validTemplate = {
    id: 'valid-template',
    type: PromptType.CHARACTER,
    content: 'Content with {{var}}',
    variables: [{ name: 'var', description: 'Test variable' }]
  };
  
  // Should not throw
  manager.validateTemplate(validTemplate);
  
  // Test missing fields
  const invalidTemplate = {
    id: 'invalid-template',
    content: 'Some content'
    // Missing type and variables
  };
  
  try {
    manager.validateTemplate(invalidTemplate);
    throw new Error('Should have detected missing fields');
  } catch (error) {
    if (!error.message.includes('missing required fields')) {
      throw error;
    }
    // This is expected
  }
  
  // Test undefined variable references
  const templateWithMissingVarDef = {
    id: 'undefined-var-ref',
    type: PromptType.CHARACTER,
    content: 'Template with {{name}} and {{undefined}}',
    variables: [
      { name: 'name', description: 'Character name' }
      // 'undefined' variable is missing
    ]
  };
  
  try {
    manager.validateTemplate(templateWithMissingVarDef);
    throw new Error('Should have detected undefined variable reference');
  } catch (error) {
    if (!error.message.includes('undefined variable')) {
      throw error;
    }
    // This is expected
  }
}

// Run the tests
const success = runTests();

// Exit with appropriate code for CI systems
process.exit(success ? 0 : 1);
