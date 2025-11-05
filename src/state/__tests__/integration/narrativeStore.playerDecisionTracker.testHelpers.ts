/**
 * Test helpers for narrativeStore.playerDecisionTracker integration tests
 */

import { PlayerDecisionTracker } from '../../../lib/ai/playerDecisionTracker';
import { useNarrativeStore } from '../../narrativeStore';
import { DecisionOption } from '../../../types/narrative.types';
import { ChoiceTypePreference } from '../../../types/personalization.types';
import { getTimestamp } from '@/lib/utils/timestamp';

/**
 * Creates a test instance of PlayerDecisionTracker isolated from global state
 */
export const createTestTracker = () => new PlayerDecisionTracker({
  storageKey: 'test_integration_decisions',
  maxDecisionsPerSession: 20,
  maxTotalDecisions: 100
});

/**
 * Resets the narrative store to initial state
 */
export const resetNarrativeStore = () => {
  useNarrativeStore.setState({
    segments: {},
    sessionSegments: {},
    decisions: {},
    sessionDecisions: {},
    endedSessions: {},
    currentEnding: null,
    isGeneratingEnding: false,
    endingError: null,
    loading: false,
    error: null
  });
};

/**
 * Sets up fake timers with standard test time
 */
export const setupTestTimers = () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
};

/**
 * Cleans up after tests
 */
export const cleanupTests = (tracker: PlayerDecisionTracker) => {
  tracker.clearDecisions();
  jest.useRealTimers();
};

/**
 * Common test IDs
 */
export const TEST_IDS = {
  session: {
    integration: 'integration-session-1',
    party: 'party-session',
    robust: 'robust-session',
    minimal: 'minimal-context-session',
    rapid: 'rapid-session',
    pattern: (num: number) => `session-${num}`
  },
  character: {
    player: 'player-character',
    companion: 'companion-char',
    merchant: 'merchant-desperate',
    guard: 'temple-guardian',
    test: 'test-character',
    speed: 'speed-character',
    consistent: 'consistent-character'
  },
  world: {
    fantasy: 'fantasy-world',
    adventure: 'adventure-world',
    pattern: 'pattern-world',
    speed: 'speed-world',
    unknown: 'unknown-world'
  }
};

/**
 * Creates a marketplace scene segment
 */
export const createMarketplaceSegment = (sessionId: string, worldId: string) => ({
  worldId,
  content: 'You enter the bustling marketplace of Rivertown, filled with merchants and travelers.',
  type: 'scene' as const,
  metadata: {
    tags: ['marketplace', 'social', 'entry'],
    location: 'Rivertown Marketplace',
    mood: 'neutral'
  },
  updatedAt: getTimestamp(),
  timestamp: new Date()
});

/**
 * Creates a merchant encounter segment
 */
export const createMerchantEncounterSegment = (sessionId: string, worldId: string, characterId: string) => ({
  worldId,
  content: 'A distressed merchant approaches you, wringing his hands nervously.',
  type: 'dialogue' as const,
  characterIds: [characterId, 'merchant-desperate'],
  metadata: {
    tags: ['encounter', 'merchant', 'distress'],
    location: 'Rivertown Marketplace'
  },
  updatedAt: getTimestamp(),
  timestamp: new Date()
});

/**
 * Creates a merchant plea segment
 */
export const createMerchantPleaSegment = (sessionId: string, worldId: string, characterId: string) => ({
  worldId,
  content: '"Please, adventurer! Bandits stole my entire shipment on the road from Millhaven!"',
  type: 'dialogue' as const,
  characterIds: [characterId, 'merchant-desperate'],
  metadata: {
    tags: ['plea', 'backstory', 'quest-hook']
  },
  updatedAt: getTimestamp(),
  timestamp: new Date()
});

/**
 * Creates a temple scene segment
 */
export const createTempleSegment = (sessionId: string, worldId: string, playerCharacterId: string, companionCharacterId: string) => ({
  worldId,
  content: 'Your party stands before the ancient sealed door of the lost temple.',
  type: 'scene' as const,
  characterIds: [playerCharacterId, companionCharacterId, 'temple-guardian'],
  metadata: {
    tags: ['temple', 'party', 'ancient', 'mystery'],
    location: 'Temple of Forgotten Wisdom',
    mood: 'mysterious'
  },
  updatedAt: getTimestamp(),
  timestamp: new Date()
});

/**
 * Creates standard merchant help decision options
 */
export const createMerchantHelpOptions = (): DecisionOption[] => [
  {
    id: 'help-free',
    text: 'Offer to help recover the goods for free, out of the goodness of your heart'
  },
  {
    id: 'help-payment',
    text: 'Agree to help, but demand fair payment for the dangerous work'
  },
  {
    id: 'negotiate-terms',
    text: 'Negotiate the terms carefully before committing to anything'
  },
  {
    id: 'decline-politely',
    text: 'Politely decline and suggest he contact the town guard instead'
  },
  {
    id: 'ignore-walk-away',
    text: 'Ignore his pleas and walk away to continue your own business'
  }
];

/**
 * Creates bandit camp decision options
 */
export const createBanditCampOptions = (): DecisionOption[] => [
  { id: 'sneak-stealth', text: 'Sneak in quietly and recover the goods without fighting' },
  { id: 'negotiate-bandits', text: 'Approach openly and try to negotiate the return of the goods' },
  { id: 'attack-direct', text: 'Charge in with weapons drawn and fight them head-on' },
  { id: 'retreat-plan', text: 'Retreat and come back with town guards for backup' }
];

/**
 * Records a decision in the tracker with standard parameters
 */
export const recordDecisionInTracker = (
  tracker: PlayerDecisionTracker,
  prompt: string,
  choiceText: string,
  choiceType: ChoiceTypePreference,
  sessionId: string,
  worldId: string,
  context: {
    location?: string;
    situation?: string;
    charactersPresent?: string[];
  }
) => {
  tracker.recordDecision(
    prompt,
    choiceText,
    choiceType,
    sessionId,
    worldId,
    context
  );
};
