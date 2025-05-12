import { PromptContextManager } from '../../promptContextManager';
import { PromptTemplateManager, PromptType } from '../../../promptTemplates';
import { WorldContext, CharacterContext } from '../../types';

// Test helpers
const createMockWorld = (overrides = {}): WorldContext => ({
  id: 'world-1',
  name: 'Eldoria',
  genre: 'fantasy',
  description: 'A magical realm',
  attributes: [
    { id: 'attr-1', name: 'Strength', description: 'Physical power' }
  ],
  skills: [
    { id: 'skill-1', name: 'Swordsmanship', description: 'Blade mastery' }
  ],
  ...overrides
});

const createMockCharacter = (overrides = {}): CharacterContext => ({
  id: 'char-1',
  name: 'Hero',
  level: 5,
  description: 'Brave adventurer',
  attributes: [
    { attributeId: 'attr-1', name: 'Strength', value: 8 }
  ],
  skills: [
    { skillId: 'skill-1', name: 'Swordsmanship', value: 3 }
  ],
  ...overrides
});

describe('PromptContextManager - Integration', () => {
  describe('Complete Context Generation', () => {
    test('should generate context for narrative prompts', () => {
      const manager = new PromptContextManager();
      const world = createMockWorld();
      const character = createMockCharacter();
      
      const context = manager.generateContext({
        promptType: 'narrative',
        world,
        character,
        recentEvents: ['Found magical artifact'],
        tokenLimit: 500
      });
      
      expect(context).toContain('Genre: fantasy');
      expect(context).toContain('Character: Hero');
      expect(context).toContain('Found magical artifact');
      expect(context.length).toBeLessThan(2000); // Rough char estimate
    });
    
    test('should generate context for decision prompts', () => {
      const manager = new PromptContextManager();
      const world = createMockWorld();
      const character = createMockCharacter();
      
      const context = manager.generateContext({
        promptType: 'decision',
        world,
        character,
        currentSituation: 'Facing a dragon',
        tokenLimit: 300
      });
      
      expect(context).toContain('Current Situation: Facing a dragon');
      expect(context).toContain('Attributes:'); // Relevant for decisions
    });
    
    test('should update context when data changes', () => {
      const manager = new PromptContextManager();
      const world = createMockWorld();
      const character = createMockCharacter();
      
      const context1 = manager.generateContext({ world, character });
      
      // Ensure attributes exists before modifying
      if (character.attributes && character.attributes.length > 0) {
        character.attributes[0].value = 10; // Change attribute
      }
      
      const context2 = manager.generateContext({ world, character });
      
      expect(context1).not.toBe(context2);
      expect(context2).toContain('10');
    });
  });

  describe('Template Integration', () => {
    test('should work with existing prompt templates', () => {
      const templateManager = new PromptTemplateManager();
      const contextManager = new PromptContextManager();
      
      const template = {
        id: 'narrative-1',
        type: PromptType.NARRATIVE,
        content: '{{context}}\n\nGenerate narrative for: {{situation}}',
        variables: [
          { name: 'context', description: 'World and character context' },
          { name: 'situation', description: 'Current situation' }
        ]
      };
      
      templateManager.addTemplate(template);
      
      const context = contextManager.generateContext({
        world: createMockWorld(),
        character: createMockCharacter()
      });
      
      const processed = templateManager.processTemplate('narrative-1', {
        context,
        situation: 'Entering dark forest'
      });
      
      expect(processed).toContain('Genre:');
      expect(processed).toContain('Character:');
      expect(processed).toContain('Entering dark forest');
    });
    
    test('should handle context in different prompt types', () => {
      const contextManager = new PromptContextManager();
      
      // Create with events to see prioritization differences
      const narrativeContext = contextManager.generateContext({
        promptType: 'narrative',
        world: createMockWorld(),
        character: createMockCharacter(),
        recentEvents: ['Event 1', 'Event 2'],
        tokenLimit: 50 // Very low limit to force prioritization
      });
      
      const decisionContext = contextManager.generateContext({
        promptType: 'decision',
        world: createMockWorld(),
        character: createMockCharacter(),
        recentEvents: ['Event 1', 'Event 2'],
        tokenLimit: 50 // Very low limit to force prioritization
      });
      
      // Both should have content
      expect(narrativeContext).toBeDefined();
      expect(decisionContext).toBeDefined();
      expect(narrativeContext.length).toBeGreaterThan(0);
      expect(decisionContext.length).toBeGreaterThan(0);
      
      // For narrative, events have highest priority (5)
      // For decision, character has highest priority (5)
      // So the ordering should be different when space is limited
      expect(narrativeContext).toContain('Recent Events'); // Events prioritized in narrative
      expect(decisionContext).toContain('Character: Hero'); // Character prioritized in decision
    });
  });

  describe('Error Handling', () => {
    test('should handle missing world data gracefully', () => {
      const manager = new PromptContextManager();
      
      const context = manager.generateContext({
        world: null,
        character: createMockCharacter()
      });
      
      expect(context).toContain('Character:');
      expect(context).not.toContain('undefined');
    });
    
    test('should handle missing character data gracefully', () => {
      const manager = new PromptContextManager();
      
      const context = manager.generateContext({
        world: createMockWorld(),
        character: null
      });
      
      expect(context).toContain('Genre:');
      expect(context).not.toContain('undefined');
    });
    
    test('should handle invalid token limits', () => {
      const manager = new PromptContextManager();
      
      const context = manager.generateContext({
        world: createMockWorld(),
        character: createMockCharacter(),
        tokenLimit: -1
      });
      
      expect(context).toBeTruthy();
      expect(context.length).toBeGreaterThan(0);
    });
  });
});
