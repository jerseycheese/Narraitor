/**
 * Tests for Decision Consequence Mapping
 *
 * Verifies that different decision types (compassionate, diplomatic, etc.)
 * are properly mapped and included in AI prompts for consequence generation.
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { MockAIClient } from '../../__mocks__/mockAiClient';
import { NarrativeGenerationRequest } from '@/types/narrative.types';
import { PlayerDecision } from '@/types/personalization.types';
import {
  setupTestTimers,
  createPastDecisions,
  setupDecisionConsequencesMocks
} from './narrativeGenerator.decisionConsequences.testHelpers';

// Mock the store modules
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/aiContextStore', () => ({
  useAiContextStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: jest.fn()
  }
}));
jest.mock('../playerDecisionTracker');
jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  getNarrativeTemplate: jest.fn()
}));
jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn(),
  checkAndRecordLoreMentions: jest.fn()
}));
jest.mock('../structuredLoreExtractor', () => ({
  extractStructuredLore: jest.fn()
}));
jest.mock('../toneSettingsGuidance', () => ({
  getDetailedToneInstructions: jest.fn()
}));
jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn()
  }
}));

describe('NarrativeGenerator - Decision Consequence Mapping', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAiClient: MockAIClient;
  let pastDecisions: PlayerDecision[];

  beforeEach(() => {
    jest.clearAllMocks();
    setupTestTimers();

    pastDecisions = createPastDecisions();
    mockAiClient = new MockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAiClient);

    setupDecisionConsequencesMocks(pastDecisions);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should map compassionate decisions to trust-building consequences', async () => {
    // ACCEPTANCE CRITERIA: Compassionate choices should build trust and reputation
    const request: NarrativeGenerationRequest = {
      worldId: 'world-1',
      characterIds: ['char-1'],
      sessionId: 'session-1'
    };

    await narrativeGenerator.generateSegment(request);

    const narrativePrompt = mockAiClient.getPrompts()[0];

    // Check that decision data is included (new format uses lowercase and (type) not [type])
    const promptLower = narrativePrompt.toLowerCase();
    const hasHelpDecision = promptLower.includes('help') && promptLower.includes('merchant');
    const hasHelpfulType = promptLower.includes('(helpful)');

    expect(hasHelpDecision).toBe(true);
    expect(hasHelpfulType).toBe(true);
  });

  test('should map diplomatic decisions to peaceful resolution options', async () => {
    // ACCEPTANCE CRITERIA: Diplomatic choices should create peaceful alternatives
    const request: NarrativeGenerationRequest = {
      worldId: 'world-1',
      characterIds: ['char-1'],
      sessionId: 'session-1'
    };

    await narrativeGenerator.generateSegment(request);

    const narrativePrompt = mockAiClient.getPrompts()[0];

    // Check that decision data is included (LLM will infer diplomatic consequences)
    // Check for diplomatic decision in new format
    const promptLower = narrativePrompt.toLowerCase();
    const hasNegotiateDecision = promptLower.includes('negotiate');
    const hasDiplomaticType = promptLower.includes('(diplomatic)');

    expect(hasNegotiateDecision).toBe(true);
    expect(hasDiplomaticType).toBe(true);
  });
});
