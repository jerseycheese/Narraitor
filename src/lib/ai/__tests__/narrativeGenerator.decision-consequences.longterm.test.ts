/**
 * Tests for Long-term Consequence Building
 *
 * Verifies that multiple related decisions build coherent narrative threads
 * and that story options reflect past decision patterns.
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
  narrativeTemplateManager: {
    getTemplate: jest.fn()
  }
}));
jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn()
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

describe('NarrativeGenerator - Long-term Consequence Building', () => {
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

  test('should create narrative threads that span multiple decisions', async () => {
    // ACCEPTANCE CRITERIA: Multiple related decisions should build coherent consequences
    const request: NarrativeGenerationRequest = {
      worldId: 'world-1',
      characterIds: ['char-1'],
      sessionId: 'session-1'
    };

    await narrativeGenerator.generateSegment(request);

    const narrativePrompt = mockAiClient.getPrompts()[0];

    // Check that multiple decisions are included (LLM will infer patterns)
    const promptLower = narrativePrompt.toLowerCase();
    const hasHelpDecision = promptLower.includes('help') && promptLower.includes('merchant');
    const hasNegotiateDecision = promptLower.includes('negotiate');

    expect(hasHelpDecision).toBe(true);
    expect(hasNegotiateDecision).toBe(true);

    // Check that choice types are tagged for pattern recognition
    const hasChoiceTypes = promptLower.includes('(helpful)') &&
                          promptLower.includes('(diplomatic)');

    expect(hasChoiceTypes).toBe(true);
  });

  test('should provide decision-informed story options', async () => {
    // ACCEPTANCE CRITERIA: Narrative should suggest options that reflect past decision patterns
    const request: NarrativeGenerationRequest = {
      worldId: 'world-1',
      characterIds: ['char-1'],
      sessionId: 'session-1'
    };

    await narrativeGenerator.generateSegment(request);

    const narrativePrompt = mockAiClient.getPrompts()[0];

    // The decision history section includes past choices
    const hasDecisionSection = narrativePrompt.includes('RECENT PLAYER DECISIONS');
    expect(hasDecisionSection).toBe(true);

    // Should reference decision types (helpful, diplomatic, etc.)
    const promptLower = narrativePrompt.toLowerCase();
    const hasDecisionTypes = promptLower.includes('(helpful)') ||
                            promptLower.includes('(diplomatic)') ||
                            promptLower.includes('(aggressive)') ||
                            promptLower.includes('(chaotic)');
    expect(hasDecisionTypes).toBe(true);
  });
});
