/**
 * Simplified tests for NarrativeGenerator personalization integration
 * Focus on core functionality without complex mocking
 */

import { PersonalizationEngine } from '../personalizationEngine';
import { PlayerDecisionTracker } from '../playerDecisionTracker';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

describe('NarrativeGenerator Personalization - Core Tests', () => {
  let personalizationEngine: PersonalizationEngine;
  let tracker: PlayerDecisionTracker;
  let mockCharacter: Character;
  let mockWorld: World;

  beforeEach(() => {
    personalizationEngine = new PersonalizationEngine();
    tracker = new PlayerDecisionTracker({ storageKey: 'test_personalization_decisions' });
    tracker.clearDecisions();
    
    mockCharacter = {
      id: 'char-1',
      name: 'Alex Archer',
      background: 'Experienced archaeologist with a mysterious past',
      attributes: { Intelligence: 8, Dexterity: 6 },
      skills: [
        { name: 'Investigation', level: 8, worldSkillId: 'skill-1' },
        { name: 'Athletics', level: 5, worldSkillId: 'skill-2' }
      ],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    mockWorld = {
      id: 'world-1',
      name: 'Ancient Mysteries',
      description: 'A world of archaeological discoveries',
      genre: 'mystery',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      attributes: [],
      skills: []
    };
  });

  test('personalization engine integrates with decision tracker', () => {
    // Record some decisions
    tracker.recordDecision(
      'What do you do?',
      'Help the stranger',
      'helpful',
      'session-1',
      'world-1'
    );
    
    tracker.recordDecision(
      'How do you respond?',
      'Negotiate peacefully',
      'diplomatic',
      'session-1',
      'world-1'
    );

    // Get decisions for personalization
    const decisions = tracker.getWorldDecisions('world-1');
    expect(decisions).toHaveLength(2);
    
    // Create personalized context
    const context = personalizationEngine.createPersonalizedContext(
      mockCharacter,
      mockWorld,
      decisions,
      [],
      [],
      []
    );
    
    expect(context.character.personality).toBeDefined();
    expect(context.playerPreferences).toBeDefined();
    
    // Generate enhancement
    const enhancement = personalizationEngine.generateNarrativeEnhancement(context);
    expect(enhancement).toContain('Alex Archer');
    expect(enhancement).toMatch(/helpful|diplomatic/i);
  });


  test('decision patterns influence personalization', () => {
    // Record consistent diplomatic choices
    for (let i = 0; i < 5; i++) {
      tracker.recordDecision(
        `Situation ${i}`,
        'Negotiate',
        'diplomatic',
        'session-1',
        'world-1'
      );
    }
    
    const decisions = tracker.getWorldDecisions('world-1');
    const analysis = tracker.analyzeChoicePatterns(decisions);
    
    expect(analysis.dominantChoiceTypes[0]).toBe('diplomatic');
    expect(analysis.patternStrength).toBeGreaterThan(50);
    
    // Use in personalization
    const behaviorAnalysis = personalizationEngine.analyzePlayerBehavior(
      mockCharacter,
      mockWorld,
      decisions,
      [],
      []
    );
    
    expect(behaviorAnalysis.detectedTraits).toContain('diplomatic');
  });
});