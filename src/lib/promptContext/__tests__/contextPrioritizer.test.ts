import { ContextPrioritizer } from '../contextPrioritizer';
import { ContextElement, PriorityWeights } from '../types';

describe('ContextPrioritizer', () => {
  describe('Priority Scoring', () => {
    test('should prioritize character current state over backstory', () => {
      const prioritizer = new ContextPrioritizer();
      const contextElements: ContextElement[] = [
        { type: 'character.backstory', content: 'Born in a village...', weight: 1 },
        { type: 'character.current_state', content: 'Health: 50%', weight: 3 }
      ];
      
      const prioritized = prioritizer.prioritize(contextElements, 50);
      
      expect(prioritized[0].type).toBe('character.current_state');
    });
    
    test('should prioritize recent events over historical ones', () => {
      const prioritizer = new ContextPrioritizer();
      const contextElements: ContextElement[] = [
        { type: 'event', content: 'Fought dragon', timestamp: Date.now() - 3600000 },
        { type: 'event', content: 'Found treasure', timestamp: Date.now() - 60000 }
      ];
      
      const prioritized = prioritizer.prioritize(contextElements, 100);
      
      expect(prioritized[0].content).toBe('Found treasure');
    });
    
    test('should prioritize world rules over world history', () => {
      const prioritizer = new ContextPrioritizer();
      const contextElements: ContextElement[] = [
        { type: 'world.history', content: 'Founded 1000 years ago...', weight: 1 },
        { type: 'world.rules', content: 'Magic requires mana', weight: 3 }
      ];
      
      const prioritized = prioritizer.prioritize(contextElements, 50);
      
      expect(prioritized[0].type).toBe('world.rules');
    });
  });

  describe('Token Limit Management', () => {
    test('should truncate context to fit token limit', () => {
      const prioritizer = new ContextPrioritizer();
      const contextElements: ContextElement[] = [
        { type: 'world', content: 'A'.repeat(400), tokens: 100 }, // More content to exceed limit
        { type: 'character', content: 'B'.repeat(200), tokens: 50 }
      ];
      
      const prioritized = prioritizer.prioritize(contextElements, 75);
      
      expect(prioritized).toHaveLength(1);
      expect(prioritized[0].type).toBe('character'); // Character has default weight of 4
    });
    
    test('should include partial content when element exceeds limit', () => {
      const prioritizer = new ContextPrioritizer();
      const contextElements: ContextElement[] = [
        { type: 'world', content: 'Long description...', tokens: 100 }
      ];
      
      const prioritized = prioritizer.prioritize(contextElements, 50);
      
      expect(prioritized[0].content).toContain('...');
      expect(prioritized[0].truncated).toBe(true);
    });
    
    test('should estimate tokens accurately', () => {
      const prioritizer = new ContextPrioritizer();
      
      const tokens = prioritizer.estimateTokens('Hello world');
      
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });
  });

  describe('Priority Rules', () => {
    test('should apply custom priority weights', () => {
      const customWeights: PriorityWeights = {
        'character.inventory': 5,
        'world.description': 1
      };
      const prioritizer = new ContextPrioritizer(customWeights);
      
      const contextElements: ContextElement[] = [
        { type: 'character.inventory', content: 'Sword' },
        { type: 'world.description', content: 'Fantasy realm' }
      ];
      
      const prioritized = prioritizer.prioritize(contextElements, 100);
      
      expect(prioritized[0].type).toBe('character.inventory');
    });
    
    test('should handle context type hierarchies', () => {
      const prioritizer = new ContextPrioritizer();
      
      // Create valid ContextElement objects with required content
      const element1: ContextElement = { type: 'character.attributes.strength', content: 'Test' };
      const element2: ContextElement = { type: 'character.attributes.charisma', content: 'Test' };
      
      const score1 = prioritizer.calculatePriority(element1);
      const score2 = prioritizer.calculatePriority(element2);
      
      expect(score1).toBe(score2); // Same level in hierarchy
    });
  });
});
