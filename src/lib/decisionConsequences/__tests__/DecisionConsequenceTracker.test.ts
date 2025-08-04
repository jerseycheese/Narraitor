import { DecisionConsequenceTracker } from '../DecisionConsequenceTracker';
import { narrativeStore } from '@/state/narrativeStore';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { Decision, DecisionImpact, Consequence } from '@/types/narrative.types';

// Mock stores
jest.mock('@/state/narrativeStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/worldStore');

describe('DecisionConsequenceTracker', () => {
  let tracker: DecisionConsequenceTracker;
  const mockDecision: Decision = {
    id: 'decision-1',
    prompt: 'What do you do?',
    options: [
      { id: 'option-1', text: 'Help the villager', tags: ['helpful', 'good'] },
      { id: 'option-2', text: 'Ignore them', tags: ['selfish', 'neutral'] }
    ],
    selectedOptionId: 'option-1'
  };

  beforeEach(() => {
    tracker = new DecisionConsequenceTracker();
    jest.clearAllMocks();
  });

  describe('recordDecisionImpact', () => {
    it('should record a decision impact with consequences', () => {
      const sessionId = 'session-1';
      const worldId = 'world-1';
      const context = {
        situation: 'Village encounter',
        characters: ['char-1'],
        tags: ['social', 'moral']
      };

      const consequences: Consequence[] = [
        {
          id: 'consequence-1',
          type: 'relationship',
          action: 'modify',
          targetId: 'villager-1',
          value: 10,
          description: 'Villager gratitude increased',
          timing: 'immediate',
          importance: 'moderate',
          relatedDecisionId: 'decision-1'
        }
      ];

      const impact = tracker.recordDecisionImpact({
        decision: mockDecision,
        sessionId,
        worldId,
        context,
        consequences,
        location: 'Village Square'
      });

      expect(impact).toBeDefined();
      expect(impact.decisionId).toBe('decision-1');
      expect(impact.selectedOptionId).toBe('option-1');
      expect(impact.consequences).toHaveLength(1);
      expect(impact.importance).toBe('moderate');
    });

    it('should calculate importance based on consequence types', () => {
      const criticalConsequences: Consequence[] = [
        {
          id: 'consequence-1',
          type: 'world_state',
          action: 'set',
          targetId: 'kingdom-war',
          value: true,
          timing: 'immediate',
          importance: 'critical',
          relatedDecisionId: 'decision-1'
        }
      ];

      const impact = tracker.recordDecisionImpact({
        decision: mockDecision,
        sessionId: 'session-1',
        worldId: 'world-1',
        context: { situation: 'War declaration', characters: [], tags: [] },
        consequences: criticalConsequences
      });

      expect(impact.importance).toBe('critical');
    });
  });

  describe('applyImmediateConsequences', () => {
    it('should apply immediate consequences to character attributes', () => {
      const mockCharacterStore = characterStore as jest.Mocked<typeof characterStore>;
      const updateCharacterAttribute = jest.fn();
      mockCharacterStore.getState = jest.fn().mockReturnValue({
        updateCharacterAttribute
      });

      const consequences: Consequence[] = [
        {
          id: 'consequence-1',
          type: 'attribute',
          action: 'modify',
          targetId: 'heroism',
          value: 2,
          timing: 'immediate',
          importance: 'moderate',
          relatedDecisionId: 'decision-1'
        }
      ];

      tracker.applyImmediateConsequences(consequences, 'char-1', 'session-1');

      expect(updateCharacterAttribute).toHaveBeenCalledWith('char-1', 'heroism', 2);
    });

    it('should update world state for world_state consequences', () => {
      const mockWorldStore = worldStore as jest.Mocked<typeof worldStore>;
      const updateWorldState = jest.fn();
      mockWorldStore.getState = jest.fn().mockReturnValue({
        updateWorldState
      });

      const consequences: Consequence[] = [
        {
          id: 'consequence-1',
          type: 'world_state',
          action: 'set',
          targetId: 'village-saved',
          value: true,
          timing: 'immediate',
          importance: 'significant',
          relatedDecisionId: 'decision-1'
        }
      ];

      tracker.applyImmediateConsequences(consequences, 'char-1', 'session-1');

      expect(updateWorldState).toHaveBeenCalledWith('village-saved', true);
    });
  });

  describe('getRelevantPastDecisions', () => {
    it('should return decisions relevant to current context', () => {
      const pastImpacts: DecisionImpact[] = [
        {
          id: 'impact-1',
          decisionId: 'decision-1',
          selectedOptionId: 'option-1',
          sessionId: 'session-1',
          worldId: 'world-1',
          timestamp: new Date(),
          context: {
            situation: 'Village encounter',
            characters: ['villager-1'],
            tags: ['social', 'helpful']
          },
          consequences: [],
          importance: 'moderate',
          narrativeSummary: 'Helped a villager in need',
          futureReferences: ['villager remembers your kindness']
        }
      ];

      tracker.pastDecisionImpacts = pastImpacts;

      const relevant = tracker.getRelevantPastDecisions({
        location: 'Village Square',
        tags: ['social'],
        characters: ['villager-1'],
        maxDecisions: 5
      });

      expect(relevant).toHaveLength(1);
      expect(relevant[0].id).toBe('impact-1');
    });

    it('should prioritize critical and significant decisions', () => {
      const pastImpacts: DecisionImpact[] = [
        {
          id: 'impact-1',
          decisionId: 'decision-1',
          selectedOptionId: 'option-1',
          sessionId: 'session-1',
          worldId: 'world-1',
          timestamp: new Date(Date.now() - 1000),
          context: { situation: 'Minor choice', characters: [], tags: [] },
          consequences: [],
          importance: 'minor',
          narrativeSummary: 'Made a small choice',
          futureReferences: []
        },
        {
          id: 'impact-2',
          decisionId: 'decision-2',
          selectedOptionId: 'option-2',
          sessionId: 'session-1',
          worldId: 'world-1',
          timestamp: new Date(),
          context: { situation: 'Major choice', characters: [], tags: [] },
          consequences: [],
          importance: 'critical',
          narrativeSummary: 'Made a critical decision',
          futureReferences: ['this will change everything']
        }
      ];

      tracker.pastDecisionImpacts = pastImpacts;

      const relevant = tracker.getRelevantPastDecisions({
        tags: [],
        characters: [],
        maxDecisions: 1
      });

      expect(relevant).toHaveLength(1);
      expect(relevant[0].importance).toBe('critical');
    });
  });

  describe('generateNarrativeContext', () => {
    it('should create context for narrative generation including past decisions', () => {
      const pastImpacts: DecisionImpact[] = [
        {
          id: 'impact-1',
          decisionId: 'decision-1',
          selectedOptionId: 'option-1',
          sessionId: 'session-1',
          worldId: 'world-1',
          timestamp: new Date(),
          context: {
            situation: 'Village encounter',
            characters: ['villager-1'],
            tags: ['social']
          },
          consequences: [],
          importance: 'moderate',
          narrativeSummary: 'Helped a villager in distress',
          futureReferences: ['villager gratitude', 'reputation for kindness']
        }
      ];

      tracker.pastDecisionImpacts = pastImpacts;

      const context = tracker.generateNarrativeContext({
        sessionId: 'session-1',
        worldId: 'world-1',
        currentLocation: 'Village Square',
        currentTags: ['social', 'reputation']
      });

      expect(context.pastDecisions).toHaveLength(1);
      expect(context.pastDecisions[0].narrativeSummary).toBe('Helped a villager in distress');
      expect(context.contextSummary).toContain('helped a villager');
    });
  });
});