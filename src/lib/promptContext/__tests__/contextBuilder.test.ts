import { ContextBuilder } from '../contextBuilder';
import { WorldContext, CharacterContext } from '../types';

describe('ContextBuilder', () => {
  describe('World Context', () => {
    test('should include world genre and description', () => {
      const builder = new ContextBuilder();
      const world: WorldContext = {
        id: 'world-1',
        genre: 'fantasy',
        description: 'A magical realm with dragons and wizards',
        name: 'Eldoria'
      };
      
      const context = builder.buildWorldContext(world);
      
      expect(context).toContain('Genre: fantasy');
      expect(context).toContain('World: Eldoria');
      expect(context).toContain('A magical realm with dragons and wizards');
    });
    
    test('should include world attributes in structured format', () => {
      const builder = new ContextBuilder();
      const world: WorldContext = {
        id: 'world-1',
        attributes: [
          { id: 'attr-1', name: 'Strength', description: 'Physical power' },
          { id: 'attr-2', name: 'Intelligence', description: 'Mental capacity' }
        ]
      };
      
      const context = builder.buildWorldContext(world);
      
      expect(context).toContain('Attributes:');
      expect(context).toContain('- Strength: Physical power');
      expect(context).toContain('- Intelligence: Mental capacity');
    });
    
    test('should include world skills linked to attributes', () => {
      const builder = new ContextBuilder();
      const world: WorldContext = {
        id: 'world-1',
        skills: [
          { 
            id: 'skill-1', 
            name: 'Swordsmanship', 
            description: 'Mastery of blade combat',
            relatedAttributes: ['attr-1']
          }
        ]
      };
      
      const context = builder.buildWorldContext(world);
      
      expect(context).toContain('Skills:');
      expect(context).toContain('- Swordsmanship: Mastery of blade combat');
    });
  });

  describe('Character Context', () => {
    test('should include character basic information', () => {
      const builder = new ContextBuilder();
      const character: CharacterContext = {
        id: 'char-1',
        name: 'Gandalf',
        description: 'A wise old wizard',
        level: 15
      };
      
      const context = builder.buildCharacterContext(character);
      
      expect(context).toContain('Character: Gandalf');
      expect(context).toContain('Level: 15');
      expect(context).toContain('A wise old wizard');
    });
    
    test('should include character attributes with values', () => {
      const builder = new ContextBuilder();
      const character: CharacterContext = {
        id: 'char-1',
        attributes: [
          { attributeId: 'attr-1', name: 'Strength', value: 7 },
          { attributeId: 'attr-2', name: 'Intelligence', value: 18 }
        ]
      };
      
      const context = builder.buildCharacterContext(character);
      
      expect(context).toContain('Attributes:');
      expect(context).toContain('- Strength: 7');
      expect(context).toContain('- Intelligence: 18');
    });
    
    test('should include character skills with values', () => {
      const builder = new ContextBuilder();
      const character: CharacterContext = {
        id: 'char-1',
        skills: [
          { skillId: 'skill-1', name: 'Fire Magic', value: 5 }
        ]
      };
      
      const context = builder.buildCharacterContext(character);
      
      expect(context).toContain('Skills:');
      expect(context).toContain('- Fire Magic: 5');
    });
    
    test('should include character key inventory items', () => {
      const builder = new ContextBuilder();
      const character: CharacterContext = {
        id: 'char-1',
        inventory: [
          { id: 'item-1', name: 'Staff of Power', equipped: true },
          { id: 'item-2', name: 'Health Potion', quantity: 3 }
        ]
      };
      
      const context = builder.buildCharacterContext(character);
      
      expect(context).toContain('Key Items:');
      expect(context).toContain('- Staff of Power (equipped)');
      expect(context).toContain('- Health Potion x3');
    });
  });

  describe('Context Formatting', () => {
    test('should format context in structured sections', () => {
      const builder = new ContextBuilder();
      const world: WorldContext = { id: 'world-1', genre: 'fantasy' };
      const character: CharacterContext = { id: 'char-1', name: 'Hero' };
      
      const context = builder.buildCombinedContext(world, character);
      
      expect(context).toMatch(/=== WORLD CONTEXT ===/);
      expect(context).toMatch(/=== CHARACTER CONTEXT ===/);
    });
    
    test('should handle missing or optional data gracefully', () => {
      const builder = new ContextBuilder();
      const world: WorldContext = { id: 'world-1' }; // minimal data
      
      const context = builder.buildWorldContext(world);
      
      expect(context).toBeDefined();
      expect(context).toBe(''); // Empty string is expected when no data
      expect(context).not.toContain('undefined');
      expect(context).not.toContain('null');
    });
    
    test('should use consistent markdown formatting', () => {
      const builder = new ContextBuilder();
      const world: WorldContext = {
        id: 'world-1',
        attributes: [{ id: 'attr-1', name: 'Strength' }]
      };
      
      const context = builder.buildWorldContext(world);
      
      expect(context).toMatch(/^#+ /m); // Has headers
      expect(context).toMatch(/^- /m);  // Has lists
    });
  });
});
