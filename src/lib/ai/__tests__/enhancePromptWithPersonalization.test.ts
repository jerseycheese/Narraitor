import { enhancePromptWithPersonalization } from '../narrativeGenerator.prompt.personalization';
import { playerDecisionTracker } from '../playerDecisionTracker';
import { PersonalizationEngine } from '../personalizationEngine';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';

// Mock the stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/aiContextStore');

describe('enhancePromptWithPersonalization Integration', () => {
  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    settings: {},
  };

  const mockCharacter = {
    id: 'char-1',
    name: 'Hero',
    background: 'A hero',
    attributes: [],
    skills: [],
    derivedStats: [],
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  let personalizationEngine: PersonalizationEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    playerDecisionTracker.clearDecisions();
    personalizationEngine = new PersonalizationEngine();

    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: { 'world-1': mockWorld },
      worldStates: { 'world-1': {} },
    });

    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: { 'char-1': mockCharacter },
    });
    
    (useAiContextStore.getState as jest.Mock).mockReturnValue({
      buildContextForSession: jest.fn().mockResolvedValue({
        activeGoals: [],
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('uses session-specific decisions when sessionId is provided', async () => {
    // Setup: Real tracker with decisions in session-1
    playerDecisionTracker.recordDecision(
      'Prompt 1',
      'Choice 1',
      'diplomatic',
      'session-1',
      'world-1'
    );
    
    // Call
    const result = await enhancePromptWithPersonalization(
      'Base prompt',
      'world-1',
      ['char-1'],
      personalizationEngine,
      'session-1'
    );

    // Assert
    expect(result).toContain('choice 1');
    expect(result).toContain('diplomatic');
  });

  test('falls back to world decisions when session has no decisions', async () => {
    // Setup: Real tracker with decisions in session-2 (different session)
    playerDecisionTracker.recordDecision(
      'Prompt 2',
      'Choice 2',
      'aggressive',
      'session-2',
      'world-1'
    );
    
    // Call with session-1 (empty)
    const result = await enhancePromptWithPersonalization(
      'Base prompt',
      'world-1',
      ['char-1'],
      personalizationEngine,
      'session-1'
    );

    // Assert
    expect(result).toContain('choice 2');
    expect(result).toContain('aggressive');
  });

  test('uses world-wide decisions when sessionId is undefined', async () => {
    // Setup: Real tracker with world decisions
    playerDecisionTracker.recordDecision(
      'Prompt 3',
      'Choice 3',
      'stealthy',
      'session-3',
      'world-1'
    );
    
    // Call without sessionId
    const result = await enhancePromptWithPersonalization(
      'Base prompt',
      'world-1',
      ['char-1'],
      personalizationEngine,
      undefined
    );

    // Assert
    expect(result).toContain('choice 3');
    expect(result).toContain('stealthy');
  });

  test('enforces decision limit of 10', async () => {
    // Setup: Tracker with 15 decisions
    jest.useFakeTimers();
    const baseTime = new Date('2025-01-01T00:00:00.000Z');
    for (let i = 0; i < 15; i++) {
      jest.setSystemTime(new Date(baseTime.getTime() + i * 1000));
      playerDecisionTracker.recordDecision(
        `Prompt ${i}`,
        `Choice ${i}`,
        'neutral',
        'session-1',
        'world-1'
      );
    }
    
    // Call
    const result = await enhancePromptWithPersonalization(
      'Base prompt',
      'world-1',
      ['char-1'],
      personalizationEngine,
      'session-1'
    );

    // Assert
    // formatDecisions lowercases the input choice text
    expect(result).toContain('choice 14');
    expect(result).toContain('choice 5');
    
    // This assertion will FAIL until I implement the change (limit 15 -> 10)
    // Currently limit is 15, so it contains choice 4.
    expect(result).not.toContain('choice 4');
  });

  test('handles empty decision list gracefully', async () => {
    // Setup: Empty tracker
    
    // Call
    const result = await enhancePromptWithPersonalization(
      'Base prompt',
      'world-1',
      ['char-1'],
      personalizationEngine,
      'session-1'
    );

    // Assert
    expect(result).toContain('Base prompt');
  });
});
