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

  // Helper to convert Character to PersonalizationCharacter format
  const convertToPersonalizationCharacter = (character: Character) => ({
    id: character.id,
    name: character.name,
    background: typeof character.background === 'object' ? character.background.history || '' : character.background,
    attributes: character.attributes,
    skills: character.skills,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt
  });

  beforeEach(() => {
    personalizationEngine = new PersonalizationEngine();
    tracker = new PlayerDecisionTracker({ storageKey: 'test_personalization_decisions' });
    tracker.clearDecisions();

    mockCharacter = {
      id: 'char-1',
      name: 'Alex Archer',
      worldId: 'world-1',
      description: 'A skilled archaeologist seeking ancient mysteries',
      background: {
        history: 'Experienced archaeologist with a mysterious past',
        personality: 'Curious and determined',
        goals: ['Discover ancient secrets'],
        fears: ['Failure'],
        relationships: []
      },
      attributes: [
        { attributeId: 'attr-intelligence', value: 8 },
        { attributeId: 'attr-dexterity', value: 6 }
      ],
      skills: [
        { skillId: 'skill-1', level: 8, experience: 100, isActive: true },
        { skillId: 'skill-2', level: 5, experience: 50, isActive: true }
      ],
      derivedStats: [],
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 100,
        categories: [],
        itemOrder: [],
      },
      status: {
        health: 100,
        maxHealth: 100,
        conditions: []
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    mockWorld = {
      id: 'world-1',
      name: 'Ancient Mysteries',
      description: 'A world of archaeological discoveries',
      genre: 'mystery',
        settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 40
      },
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
      convertToPersonalizationCharacter(mockCharacter),
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
      convertToPersonalizationCharacter(mockCharacter),
      decisions,
      [],
      []
    );

    expect(behaviorAnalysis.detectedTraits).toContain('diplomatic');
  });
});