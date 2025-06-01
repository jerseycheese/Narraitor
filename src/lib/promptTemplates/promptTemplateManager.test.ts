import { PromptTemplateManager } from './promptTemplateManager';
import { PromptType } from './types';

describe('PromptTemplateManager', () => {
  // Test Group 1: Template Management
  describe('Template Management', () => {
    test('should create and retrieve a template', () => {
      const manager = new PromptTemplateManager();
      const template = {
        id: 'test-template',
        type: PromptType.CHARACTER,
        content: 'Template with {{variable}}',
        variables: [{ name: 'variable', description: 'Test variable' }]
      };
      
      manager.addTemplate(template);
      const result = manager.getTemplate('test-template');
      
      expect(result).toEqual(template);
    });
    
    test('should prevent duplicate template ids', () => {
      const manager = new PromptTemplateManager();
      const template = {
        id: 'duplicate-id',
        type: PromptType.CHARACTER,
        content: 'Original template',
        variables: []
      };
      
      manager.addTemplate(template);
      
      expect(() => {
        manager.addTemplate({...template, content: 'Duplicate template'});
      }).toThrow(/already exists/);
    });
    
    test('should update an existing template', () => {
      const manager = new PromptTemplateManager();
      const template = {
        id: 'update-template',
        type: PromptType.CHARACTER,
        content: 'Original content',
        variables: []
      };
      
      manager.addTemplate(template);
      
      const updatedTemplate = {
        ...template,
        content: 'Updated content'
      };
      
      manager.updateTemplate('update-template', updatedTemplate);
      const result = manager.getTemplate('update-template');
      
      expect(result?.content).toBe('Updated content');
    });
    
    test('should remove a template', () => {
      const manager = new PromptTemplateManager();
      const template = {
        id: 'remove-template',
        type: PromptType.CHARACTER,
        content: 'Content to remove',
        variables: []
      };
      
      manager.addTemplate(template);
      manager.removeTemplate('remove-template');
      
      expect(manager.getTemplate('remove-template')).toBeUndefined();
    });
  });
  
  // Test Group 2: Variable Substitution
  describe('Variable Substitution', () => {
    test('should substitute variables in template content', () => {
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
      
      expect(result).toBe('Create a character named Alice who is 30 years old.');
    });
    
    test('should handle missing variable values', () => {
      const manager = new PromptTemplateManager();
      const template = {
        id: 'missing-var-template',
        type: PromptType.CHARACTER,
        content: 'Character {{name}} with {{attribute}}',
        variables: [
          { name: 'name', description: 'Character name' },
          { name: 'attribute', description: 'Character attribute' }
        ]
      };
      
      manager.addTemplate(template);
      
      const result = manager.processTemplate('missing-var-template', {
        name: 'Bob'
        // attribute is missing
      });
      
      expect(result).toBe('Character Bob with {{attribute}}');
    });
    
    test('should handle variable names with special regex characters', () => {
      const manager = new PromptTemplateManager();
      const template = {
        id: 'special-chars-template',
        type: PromptType.CHARACTER,
        content: 'Character with {{trait.special+}} trait',
        variables: [
          { name: 'trait.special+', description: 'Special trait with regex chars' }
        ]
      };
      
      manager.addTemplate(template);
      
      const result = manager.processTemplate('special-chars-template', {
        'trait.special+': 'magical'
      });
      
      expect(result).toBe('Character with magical trait');
    });
  });
  
  // Test Group 3: Template Organization
  describe('Template Organization', () => {
    test('should retrieve templates by type', () => {
      const manager = new PromptTemplateManager();
      
      const template1 = {
        id: 'character-template',
        type: PromptType.CHARACTER,
        content: 'Character template',
        variables: []
      };
      
      const template2 = {
        id: 'world-template',
        type: PromptType.WORLD,
        content: 'World template',
        variables: []
      };
      
      manager.addTemplate(template1);
      manager.addTemplate(template2);
      
      const characterTemplates = manager.getTemplatesByType(PromptType.CHARACTER);
      const worldTemplates = manager.getTemplatesByType(PromptType.WORLD);
      
      expect(characterTemplates.length).toBe(1);
      expect(characterTemplates[0].id).toBe('character-template');
      
      expect(worldTemplates.length).toBe(1);
      expect(worldTemplates[0].id).toBe('world-template');
    });
    
    test('should return empty array for non-existent type', () => {
      const manager = new PromptTemplateManager();
      const emptyResults = manager.getTemplatesByType(PromptType.QUEST);
      expect(emptyResults).toEqual([]);
      expect(emptyResults.length).toBe(0);
    });
    
    test('should get all templates', () => {
      const manager = new PromptTemplateManager();
      
      manager.addTemplate({
        id: 'template-1',
        type: PromptType.CHARACTER,
        content: 'Content 1',
        variables: []
      });
      
      manager.addTemplate({
        id: 'template-2',
        type: PromptType.WORLD,
        content: 'Content 2',
        variables: []
      });
      
      const allTemplates = manager.getAllTemplates();
      
      expect(allTemplates.length).toBe(2);
    });
    
    test('should get all template types', () => {
      const manager = new PromptTemplateManager();
      
      manager.addTemplate({
        id: 'template-1',
        type: PromptType.CHARACTER,
        content: 'Content 1',
        variables: []
      });
      
      manager.addTemplate({
        id: 'template-2',
        type: PromptType.WORLD,
        content: 'Content 2',
        variables: []
      });
      
      const types = manager.getAllTemplateTypes();
      
      expect(types.length).toBe(2);
      expect(types).toContain(PromptType.CHARACTER);
      expect(types).toContain(PromptType.WORLD);
    });
  });
  
  // Test Group 4: Template Validation
  describe('Template Validation', () => {
    test('should validate template with required fields', () => {
      const manager = new PromptTemplateManager();
      const validTemplate = {
        id: 'valid-template',
        type: PromptType.CHARACTER,
        content: 'Content with {{var}}',
        variables: [{ name: 'var', description: 'Test variable' }]
      };
      
      expect(() => {
        manager.validateTemplate(validTemplate);
      }).not.toThrow();
    });
    
    test('should throw error for template missing required fields', () => {
      const manager = new PromptTemplateManager();
      const invalidTemplate = {
        id: 'invalid-template',
        content: 'Some content'
      };
      
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        manager.validateTemplate(invalidTemplate as any);
      }).toThrow(/missing required fields/);
    });
    
    test('should validate that referenced variables are defined', () => {
      const manager = new PromptTemplateManager();
      const invalidTemplate = {
        id: 'variable-mismatch',
        type: PromptType.CHARACTER,
        content: 'Template with {{name}} and {{age}}',
        variables: [
          { name: 'name', description: 'Character name' }
          // 'age' variable is used but not defined
        ]
      };
      
      expect(() => {
        manager.validateTemplate(invalidTemplate);
      }).toThrow(/undefined variable/);
    });
  });
});