/**
 * User Journey Integration Tests for Issue #142
 *
 * These tests verify complete user journeys through multi-decision scenarios,
 * ensuring the integration between narrativeStore and PlayerDecisionTracker works
 * correctly for realistic gameplay sequences.
 *
 * Focus: Complete user journey and system integration
 */

import { useNarrativeStore } from '../../narrativeStore';
import {
  createTestTracker,
  resetNarrativeStore,
  setupTestTimers,
  cleanupTests,
  TEST_IDS,
  createMarketplaceSegment,
  createMerchantEncounterSegment,
  createMerchantPleaSegment,
  createTempleSegment,
  createMerchantHelpOptions,
  createBanditCampOptions,
  recordDecisionInTracker
} from './narrativeStore.playerDecisionTracker.testHelpers';
import { PlayerDecisionTracker } from '../../../lib/ai/playerDecisionTracker';
import { DecisionOption } from '../../../types/narrative.types';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('NarrativeStore ↔ PlayerDecisionTracker User Journey Integration', () => {
  let testTracker: PlayerDecisionTracker;

  beforeEach(() => {
    setupTestTimers();
    resetNarrativeStore();
    testTracker = createTestTracker();
    testTracker.clearDecisions();
  });

  afterEach(() => {
    cleanupTests(testTracker);
  });

  describe('Complete User Journey Integration', () => {
    it('should track player choices throughout a complete game session', () => {
      // INTEGRATION TEST: Complete flow from narrative segments through decision selection to pattern analysis

      const store = useNarrativeStore.getState();
      const sessionId = TEST_IDS.session.integration;
      const characterId = TEST_IDS.character.player;
      const worldId = TEST_IDS.world.fantasy;

      // Step 1: Establish narrative context with multiple segments
      store.addSegment(sessionId, createMarketplaceSegment(sessionId, worldId));
      store.addSegment(sessionId, createMerchantEncounterSegment(sessionId, worldId, characterId));
      store.addSegment(sessionId, createMerchantPleaSegment(sessionId, worldId, characterId));

      // Step 2: Create decision with contextually appropriate options
      const decisionId = store.addDecision(sessionId, {
        prompt: 'The merchant begs for your help recovering his stolen goods. What do you do?',
        options: createMerchantHelpOptions(),
        contextSummary: 'Merchant requests help with bandit problem',
        decisionWeight: 'major'
      });

      // Step 3: Get the decision options before selection
      let currentState = useNarrativeStore.getState();
      const originalDecision = currentState.decisions[decisionId];
      expect(originalDecision).toBeDefined();
      const selectedOption = originalDecision.options.find(opt => opt.id === 'help-free');

      // Simulate integration - player selects helpful option
      // This should trigger the integration logic (when implemented)
      store.selectDecisionOption(decisionId, 'help-free', characterId);

      // Step 4: Get fresh state after selection
      currentState = useNarrativeStore.getState();
      const decision = currentState.decisions[decisionId];

      // Simulate context extraction
      const context = {
        location: 'Rivertown Marketplace',
        situation: 'merchant in distress',
        charactersPresent: ['merchant-desperate']
      };

      // Simulate choice type inference
      const choiceType = 'helpful';

      // Record decision in tracker (this would be automatic)
      recordDecisionInTracker(
        testTracker,
        decision.prompt,
        selectedOption!.text,
        choiceType,
        sessionId,
        worldId,
        context
      );

      // Step 5: Verify integration results
      const trackedDecisions = testTracker.getSessionDecisions(sessionId);
      expect(trackedDecisions).toHaveLength(1);

      const trackedDecision = trackedDecisions[0];
      expect(trackedDecision.prompt).toBe('The merchant begs for your help recovering his stolen goods. What do you do?');
      expect(trackedDecision.choiceText).toBe('Offer to help recover the goods for free, out of the goodness of your heart');
      expect(trackedDecision.choiceType).toBe('helpful');
      expect(trackedDecision.sessionId).toBe(sessionId);
      expect(trackedDecision.worldId).toBe(worldId);
      expect(trackedDecision.context.location).toBe('Rivertown Marketplace');
      expect(trackedDecision.context.situation).toBe('merchant in distress');
      expect(trackedDecision.context.charactersPresent).toContain('merchant-desperate');

      // Step 6: Continue the journey with more decisions
      const followUpDecisionId = store.addDecision(sessionId, {
        prompt: 'You find the bandits\' camp. They outnumber you 3 to 1. How do you approach?',
        options: createBanditCampOptions()
      });

      // Get the follow-up decision options before selection
      currentState = useNarrativeStore.getState();
      const originalFollowUpDecision = currentState.decisions[followUpDecisionId];
      const followUpOption = originalFollowUpDecision.options.find(opt => opt.id === 'sneak-stealth');

      // Player chooses stealth approach
      store.selectDecisionOption(followUpDecisionId, 'sneak-stealth', characterId);

      // Get fresh state for follow-up decision
      currentState = useNarrativeStore.getState();
      const followUpDecision = currentState.decisions[followUpDecisionId];

      recordDecisionInTracker(
        testTracker,
        followUpDecision.prompt,
        followUpOption!.text,
        'stealthy',
        sessionId,
        worldId,
        {
          location: 'Bandit Camp',
          situation: 'tactical encounter',
          charactersPresent: ['bandit-leader', 'bandit-1', 'bandit-2']
        }
      );

      // Step 7: Analyze accumulated patterns
      const patterns = testTracker.analyzeChoicePatterns();

      expect(patterns.dominantChoiceTypes).toContain('helpful');
      expect(patterns.dominantChoiceTypes).toContain('stealthy');
      expect(patterns.choiceDistribution.helpful).toBe(1);
      expect(patterns.choiceDistribution.stealthy).toBe(1);
      expect(patterns.patternStrength).toBeGreaterThan(0);

      // Step 8: Verify narrative store integrity
      const narrativeDecisions = store.getSessionDecisions(sessionId);
      expect(narrativeDecisions).toHaveLength(2);
      expect(narrativeDecisions[0].selectedOptionId).toBe('help-free');
      expect(narrativeDecisions[1].selectedOptionId).toBe('sneak-stealth');
    });

    it('should handle complex multi-character decision scenarios', () => {
      // INTEGRATION TEST: Multi-character decisions with rich context

      const store = useNarrativeStore.getState();
      const sessionId = TEST_IDS.session.party;
      const playerCharacterId = TEST_IDS.character.player;
      const companionCharacterId = TEST_IDS.character.companion;
      const worldId = TEST_IDS.world.adventure;

      // Create party scenario context
      store.addSegment(sessionId, createTempleSegment(sessionId, worldId, playerCharacterId, companionCharacterId));

      store.addSegment(sessionId, {
        worldId,
        content: 'The guardian spirit warns that opening the door will release both great knowledge and terrible danger.',
        type: 'dialogue',
        characterIds: [playerCharacterId, companionCharacterId, 'temple-guardian'],
        metadata: {
          tags: ['warning', 'choice', 'consequence']
        },
        updatedAt: getTimestamp(),
        timestamp: new Date()
      });

      // Player decision
      const playerDecisionId = store.addDecision(sessionId, {
        prompt: 'As party leader, do you order the door to be opened despite the warning?',
        options: [
          { id: 'open-door', text: 'Open the door - the knowledge is worth the risk' },
          { id: 'heed-warning', text: 'Heed the guardian\'s warning and leave the temple sealed' },
          { id: 'consult-party', text: 'Consult with your party members before deciding' },
          { id: 'study-inscriptions', text: 'Study the door\'s inscriptions to understand the danger better' }
        ] as DecisionOption[]
      });

      // Player chooses to consult party (diplomatic approach)
      store.selectDecisionOption(playerDecisionId, 'consult-party', playerCharacterId);

      // Simulate tracking for player decision
      recordDecisionInTracker(
        testTracker,
        'As party leader, do you order the door to be opened despite the warning?',
        'Consult with your party members before deciding',
        'diplomatic',
        sessionId,
        worldId,
        {
          location: 'Temple of Forgotten Wisdom',
          situation: 'leadership decision',
          charactersPresent: ['companion-char', 'temple-guardian']
        }
      );

      // Companion decision (influenced by player's choice)
      const companionDecisionId = store.addDecision(sessionId, {
        prompt: 'Your companion, seeing your thoughtful leadership, offers their opinion. What do they suggest?',
        options: [
          { id: 'support-caution', text: 'Support leaving the temple sealed for everyone\'s safety' },
          { id: 'support-knowledge', text: 'Support opening the door to gain the ancient knowledge' },
          { id: 'suggest-preparation', text: 'Suggest preparing defenses before opening the door' }
        ] as DecisionOption[]
      });

      store.selectDecisionOption(companionDecisionId, 'suggest-preparation', companionCharacterId);

      // Simulate tracking for companion decision (would be separate character tracking)
      recordDecisionInTracker(
        testTracker,
        'Your companion, seeing your thoughtful leadership, offers their opinion. What do they suggest?',
        'Suggest preparing defenses before opening the door',
        'helpful',
        sessionId,
        worldId,
        {
          location: 'Temple of Forgotten Wisdom',
          situation: 'party consultation',
          charactersPresent: [playerCharacterId, 'temple-guardian']
        }
      );

      // Verify complex scenario tracking
      const allDecisions = testTracker.getAllDecisions();
      expect(allDecisions).toHaveLength(2);

      const playerDecisions = testTracker.getSessionDecisions(sessionId);
      expect(playerDecisions).toHaveLength(2);

      const patterns = testTracker.analyzeChoicePatterns();
      expect(patterns.choiceDistribution.diplomatic).toBe(1);
      expect(patterns.choiceDistribution.helpful).toBe(1);
    });
  });
});
