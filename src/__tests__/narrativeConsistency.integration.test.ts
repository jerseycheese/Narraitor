// src/__tests__/narrativeConsistency.integration.test.ts

import { useGoalStore } from '../state/goalStore';
import { useNarrativeStore } from '../state/narrativeStore';
import { useAiContextStore } from '../state/aiContextStore';
import { goalExtractor } from '../lib/ai/goalExtractor';
import { NarrativeGenerator } from '../lib/ai/narrativeGenerator';
import { AIClient } from '../lib/ai/types';
import { GoalType, GoalPriority, GoalStatus } from '../types/goal.types';

// Mock AI services
jest.mock('../lib/ai/goalExtractor');
jest.mock('../lib/ai/narrativeGenerator');
jest.mock('../lib/ai/geminiClient');

describe('Narrative Consistency Integration Tests', () => {
  beforeEach(() => {
    // Reset all stores
    useGoalStore.setState({
      goals: {},
      sessionGoals: {},
      activeGoalIds: [],
      error: null,
      loading: false,
    });

    useNarrativeStore.setState({
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      endedSessions: {},
      currentEnding: null,
      isGeneratingEnding: false,
      endingError: null,
      error: null,
      loading: false,
    });

    useAiContextStore.setState({
      contexts: {},
      contextHistory: {},
      activeContextId: null,
      loading: false,
      error: null,
    });

    jest.clearAllMocks();
  });

  describe('Core Problem: "Investigating the Hole" Scenario', () => {
    test('should track immediate narrative objectives and never forget them', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';
      const worldId = 'world-789';

      // ===== STEP 1: Player discovers the hole =====
      
      // Mock goal extraction finding the investigation objective
      const mockDiscoveryExtraction = {
        newGoals: [{
          sessionId,
          characterId,
          worldId,
          title: 'Investigate the mysterious hole',
          description: 'Found a strange hole in the wall that needs investigation',
          type: 'exploration' as GoalType,
          priority: 'high' as GoalPriority,
          status: 'active' as GoalStatus,
          mentionCount: 1,
          contextSummary: 'Player discovered mysterious hole in wall and needs to investigate',
          keywords: ['hole', 'wall', 'mysterious', 'investigate'],
          originSegmentId: 'segment-discovery',
        }],
        updatedGoals: [],
        completedGoals: [],
        confidence: 0.9,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockDiscoveryExtraction);

      // Add discovery segment
      useNarrativeStore.getState().addSegment(sessionId, {
        worldId,
        content: 'You notice a strange hole in the stone wall. It\'s about the size of your fist and seems to lead into darkness. Something about it feels important.',
        type: 'scene',
        metadata: {
          tags: ['discovery', 'mystery', 'hole'],
          mood: 'mysterious',
        },
        updatedAt: new Date().toISOString(),
        timestamp: new Date(),
      });

      // Wait for automatic goal processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify goal was extracted and stored
      const activeGoals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].title).toBe('Investigate the mysterious hole');
      
      const investigationGoalId = activeGoals[0].id;

      // ===== STEP 2: Player goes to tell someone =====

      // Mock goal extraction updating the existing goal
      const mockTravelExtraction = {
        newGoals: [],
        updatedGoals: [{
          goalId: investigationGoalId,
          updates: {
            mentionCount: 2,
            progressNotes: ['Decided to get Sarah to help investigate'],
            lastMentionedAt: new Date(),
          }
        }],
        completedGoals: [],
        confidence: 0.85,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockTravelExtraction);

      const travelSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId,
        content: 'You decide to find Sarah and tell her about the hole. She might know what to make of it. You head toward the main hall where you last saw her.',
        type: 'action',
        metadata: {
          tags: ['travel', 'companion', 'hole'],
          mood: 'neutral',
        },
        updatedAt: new Date().toISOString(),
        timestamp: new Date(),
      });

      // Wait for automatic goal processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // ===== STEP 3: Generate next narrative with goal context =====

      // Mock narrative generation that includes goal context
      const mockNarrativeGeneration = {
        content: 'You find Sarah in the main hall, studying an old map. When you tell her about the hole, her eyes widen with interest. "That sounds like one of the ancient passages mentioned in these texts," she says, rolling up the map. "We should definitely investigate it together."',
        segmentType: 'dialogue' as const,
        metadata: {
          characterIds: [characterId, 'sarah-npc'],
          location: 'main hall',
          mood: 'intrigued' as const,
          tags: ['dialogue', 'hole', 'investigation', 'partnership'],
        },
        choices: [
          {
            text: 'Return to the hole immediately with Sarah',
            outcome: 'immediate_investigation',
            tags: ['urgent', 'investigation'],
          },
          {
            text: 'Ask Sarah what she knows about ancient passages',
            outcome: 'gather_information',
            tags: ['information', 'lore'],
          }
        ]
      };

      // Mock the NarrativeGenerator class
      const mockGenerateSegment = jest.fn().mockResolvedValue(mockNarrativeGeneration);
      (NarrativeGenerator as jest.MockedClass<typeof NarrativeGenerator>).mockImplementation(() => ({
        generateSegment: mockGenerateSegment,
      } as unknown as NarrativeGenerator));

      // Build AI context including goal information
      const aiContext = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        maxTokens: 1000,
      });

      // Verify goal context is included
      expect(aiContext.goalContext).toContain('mysterious hole');
      expect(aiContext.goalContext).toContain('investigate');
      expect(aiContext.activeGoals).toHaveLength(1);
      expect(aiContext.activeGoals[0].title).toBe('Investigate the mysterious hole');

      // Create mock instance for this specific test
      const narrativeGeneratorInstance = new NarrativeGenerator({} as AIClient);
      
      // Generate narrative with goal context
      const generationResult = await narrativeGeneratorInstance.generateSegment({
        worldId,
        sessionId,
        characterIds: [characterId],
        narrativeContext: {
          worldId,
          currentSceneId: travelSegmentId,
          characterIds: [characterId],
          previousSegments: useNarrativeStore.getState().getSessionSegments(sessionId),
          currentTags: ['travel', 'companion', 'hole'],
          sessionId,
          recentSegments: [useNarrativeStore.getState().segments[travelSegmentId]],
        },
        // Goal context would be included here by the narrative generator
      });

      // Verify the generated narrative maintains goal awareness
      expect(generationResult.content).toContain('hole');
      expect(generationResult.content).toContain('investigate');
      expect(generationResult.choices?.some(choice => 
        choice.text.toLowerCase().includes('hole') || 
        choice.text.toLowerCase().includes('investigate')
      )).toBe(true);

      // ===== STEP 4: Player returns to investigate =====

      // Mock goal progress update
      const mockReturnExtraction = {
        newGoals: [],
        updatedGoals: [{
          goalId: investigationGoalId,
          updates: {
            mentionCount: 3,
            progressNotes: ['Brought Sarah back to investigate the hole', 'Ready to explore together'],
            lastMentionedAt: new Date(),
          }
        }],
        completedGoals: [],
        confidence: 0.95,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockReturnExtraction);

      const returnSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId,
        content: generationResult.content,
        type: 'dialogue',
        metadata: generationResult.metadata,
        updatedAt: new Date().toISOString(),
        timestamp: new Date(),
      });

      await useGoalStore.getState().processSegmentForGoals(returnSegmentId, characterId);

      // ===== FINAL VERIFICATION =====

      // The goal should still be active and properly tracked
      const finalGoals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(finalGoals).toHaveLength(1);
      
      const finalGoal = finalGoals[0];
      expect(finalGoal.id).toBe(investigationGoalId);
      expect(finalGoal.title).toBe('Investigate the mysterious hole');
      expect(finalGoal.status).toBe('active');
      expect(finalGoal.mentionCount).toBe(3);
      expect(finalGoal.progressNotes).toContain('Brought Sarah back to investigate the hole');

      // Goal should be consistently included in AI context
      const finalContext = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });
      expect(finalContext.goalContext).toContain('mysterious hole');
      expect(finalContext.activeGoals[0].mentionCount).toBe(3);

      // Narrative should maintain consistency
      const allSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
      expect(allSegments).toHaveLength(3);
      expect(allSegments.every(segment => 
        segment.content.toLowerCase().includes('hole') ||
        segment.metadata.tags.includes('hole')
      )).toBe(true);
    });
  });

  describe('Goal Lifecycle Management', () => {
    test('should properly complete goals when objectives are achieved', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create an active goal
      const goalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Find the missing key',
        description: 'Locate the key to unlock the treasure chest',
        type: 'quest' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 2,
        keywords: ['key', 'treasure', 'chest', 'unlock'],
      });

      // Mock goal completion detection
      const mockCompletionExtraction = {
        newGoals: [],
        updatedGoals: [{
          goalId,
          updates: {
            status: 'completed' as GoalStatus,
            completionMethod: 'achieved',
            completedAt: new Date(),
          }
        }],
        completedGoals: [goalId],
        confidence: 0.98,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockCompletionExtraction);

      // Add completion narrative
      const completionSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'You find the ornate key hidden beneath the loose floorboard. Perfect! This should open the treasure chest.',
        type: 'action',
        metadata: {
          tags: ['success', 'key', 'discovery'],
          mood: 'emotional',
        },
      });

      await useGoalStore.getState().processSegmentForGoals(completionSegmentId, characterId);

      // Verify goal completion
      const completedGoal = useGoalStore.getState().goals[goalId];
      expect(completedGoal.status).toBe('completed');
      expect(completedGoal.completionMethod).toBe('achieved');
      expect(completedGoal.completedAt).toBeDefined();

      // Goal should no longer be in active list
      const activeGoals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(activeGoals.find(g => g.id === goalId)).toBeUndefined();

      // AI context should not include completed goals in active context
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });
      expect(context.activeGoals.find(g => g.id === goalId)).toBeUndefined();
    });

    test('should handle goal abandonment when context changes', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create goal that will become impossible
      const goalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Meet the merchant at the market',
        description: 'Arranged to meet the merchant for a trade',
        type: 'social' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        keywords: ['merchant', 'market', 'trade', 'meeting'],
      });

      // Mock goal abandonment detection
      const mockAbandonmentExtraction = {
        newGoals: [],
        updatedGoals: [{
          goalId,
          updates: {
            status: 'abandoned' as GoalStatus,
            completionMethod: 'superseded',
            completedAt: new Date(),
            progressNotes: ['Market was destroyed in the fire'],
          }
        }],
        completedGoals: [goalId],
        confidence: 0.9,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockAbandonmentExtraction);

      // Add narrative showing market destruction
      const destructionSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'You arrive at the market square to find it completely destroyed by fire. The merchant stalls are nothing but ash and debris. There\'s no trace of the merchant you were supposed to meet.',
        type: 'scene',
        metadata: {
          tags: ['destruction', 'fire', 'market', 'loss'],
          mood: 'emotional',
        },
        updatedAt: new Date().toISOString(),
        timestamp: new Date(),
      });

      await useGoalStore.getState().processSegmentForGoals(destructionSegmentId, characterId);

      // Verify goal abandonment
      const abandonedGoal = useGoalStore.getState().goals[goalId];
      expect(abandonedGoal.status).toBe('abandoned');
      expect(abandonedGoal.completionMethod).toBe('superseded');
      expect(abandonedGoal.progressNotes).toContain('Market was destroyed in the fire');

      // Should not be in active goals
      const activeGoals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      expect(activeGoals.find(g => g.id === goalId)).toBeUndefined();
    });
  });

  describe('Multi-Goal Scenario Handling', () => {
    test('should handle multiple concurrent goals with proper prioritization', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create multiple goals with different priorities
      const survivalGoalId = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Find water source',
        description: 'Running low on water, need to find a source soon',
        type: 'survival' as GoalType,
        priority: 'critical' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'CRITICAL: Player desperately needs water',
      });

      useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Deliver message to the council',
        description: 'Important message must reach the council',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player has important message for council',
      });

      useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Check on friend\'s shop',
        description: 'Promised to visit friend\'s new shop',
        type: 'social' as GoalType,
        priority: 'low' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        contextSummary: 'Player should visit friend when convenient',
      });

      // Build AI context with limited tokens
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
        maxTokens: 150, // Allow for critical and high priority goals, exclude low priority
      });

      // Should have critical goals identified correctly
      expect(context.criticalGoals).toHaveLength(1);
      expect(context.criticalGoals[0].id).toBe(survivalGoalId);
      
      // With token limits, should prioritize critical and high-priority goals
      expect(context.goalContext).toContain('water');
      
      // Check that goals are ordered by priority
      const goalLines = context.goalContext.split('\n').filter(line => line.trim() && !line.includes('ACTIVE GOALS'));
      expect(goalLines.length).toBeGreaterThan(0);
      
      // First goal should be the critical one
      expect(goalLines[0]).toContain('water');

      // Active goals should be sorted by priority
      expect(context.activeGoals[0].priority).toBe('critical');
      expect(context.activeGoals[1].priority).toBe('high');
    });

    test('should handle goal conflicts and dependencies', async () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create conflicting goals
      const goal1Id = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Negotiate peace with the rebels',
        description: 'Try to end the conflict through diplomacy',
        type: 'social' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        keywords: ['peace', 'rebels', 'diplomacy'],
      });

      const goal2Id = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Capture rebel leader',
        description: 'Military orders to capture the rebel leader',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 1,
        keywords: ['capture', 'rebel', 'military'],
      });

      // Mock extraction detecting conflict
      const mockConflictExtraction = {
        newGoals: [],
        updatedGoals: [
          {
            goalId: goal1Id,
            updates: {
              status: 'blocked' as GoalStatus,
              progressNotes: ['Conflict with military orders - cannot pursue both'],
            }
          },
          {
            goalId: goal2Id,
            updates: {
              mentionCount: 2,
              progressNotes: ['Military orders take precedence'],
            }
          }
        ],
        completedGoals: [],
        confidence: 0.8,
      };

      (goalExtractor.extractGoalsFromNarrative as jest.Mock).mockResolvedValue(mockConflictExtraction);

      const conflictSegmentId = useNarrativeStore.getState().addSegment(sessionId, {
        worldId: 'world-789',
        content: 'Your commanding officer pulls you aside. "Orders have changed," he says grimly. "We need that rebel leader captured, not negotiated with. This comes from the top."',
        type: 'dialogue',
        metadata: {
          tags: ['orders', 'conflict', 'military'],
          mood: 'tense',
        },
        updatedAt: new Date().toISOString(),
        timestamp: new Date(),
      });

      await useGoalStore.getState().processSegmentForGoals(conflictSegmentId, characterId);

      // Verify goal state changes
      const peacefulGoal = useGoalStore.getState().goals[goal1Id];
      const militaryGoal = useGoalStore.getState().goals[goal2Id];

      expect(peacefulGoal.status).toBe('blocked');
      expect(peacefulGoal.progressNotes).toContain('Conflict with military orders - cannot pursue both');
      expect(militaryGoal.mentionCount).toBe(2);
      expect(militaryGoal.progressNotes).toContain('Military orders take precedence');

      // AI context should reflect the priority change
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });
      expect(context.activeGoals.find(g => g.id === goal2Id)).toBeDefined();
      expect(context.activeGoals.find(g => g.id === goal1Id)).toBeUndefined(); // Blocked goals excluded
    });
  });

  describe('Persistence and Recovery', () => {
    test('should maintain goal consistency across session reloads', () => {
      const sessionId = 'session-123';
      const characterId = 'char-456';

      // Create goals
      const goalId1 = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Long-term quest',
        description: 'This quest spans multiple sessions',
        type: 'quest' as GoalType,
        priority: 'high' as GoalPriority,
        status: 'active' as GoalStatus,
        mentionCount: 5,
        progressNotes: ['Started the quest', 'Found first clue'],
      });

      const goalId2 = useGoalStore.getState().createGoal({
        sessionId,
        characterId,
        title: 'Completed objective',
        description: 'This was finished',
        type: 'exploration' as GoalType,
        priority: 'medium' as GoalPriority,
        status: 'completed' as GoalStatus,
        mentionCount: 3,
        completedAt: new Date(),
        completionMethod: 'achieved',
      });

      // Simulate store persistence/reload by saving and restoring state
      const savedState = useGoalStore.getState();
      
      // Reset store
      useGoalStore.setState({
        goals: {},
        sessionGoals: {},
        activeGoalIds: [],
        error: null,
        loading: false,
      });

      // Restore state (simulating persistence load)
      useGoalStore.setState(savedState);

      // Verify data integrity
      const restoredActiveGoals = useGoalStore.getState().getActiveGoalsBySession(sessionId);
      const restoredGoal1 = useGoalStore.getState().goals[goalId1];
      const restoredGoal2 = useGoalStore.getState().goals[goalId2];

      expect(restoredActiveGoals).toHaveLength(1);
      expect(restoredActiveGoals[0].id).toBe(goalId1);
      expect(restoredGoal1.progressNotes).toContain('Found first clue');
      expect(restoredGoal2.status).toBe('completed');
      expect(restoredGoal2.completedAt).toBeDefined();

      // AI context should work correctly after restoration
      const context = useAiContextStore.getState().buildContextForSession(sessionId, {
        includeGoals: true,
      });
      expect(context.activeGoals).toHaveLength(1);
      expect(context.activeGoals[0].title).toBe('Long-term quest');
    });
  });
});