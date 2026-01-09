import { ChoiceGenerator } from '../choiceGenerator';
import { AIClient } from '../types';
import { NarrativeContext } from '@/types/narrative.types';

// Mock the AIClient
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

// Mock the worldStore
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn().mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          name: 'Test World',
          description: 'A test world',
          genre: 'fantasy'
        }
      },
      currentWorldId: 'world-1'
    })
  }
}));

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({ getCharacterItems: () => [] })
  }
}));

jest.mock('@/lib/promptTemplates/narrativeTemplateManager', () => ({
  narrativeTemplateManager: {
    getTemplate: jest.fn().mockReturnValue(() => 'prompt')
  }
}));

describe('ChoiceGenerator Deduplication', () => {
  let choiceGenerator: ChoiceGenerator;
  
  beforeEach(() => {
    jest.clearAllMocks();
    choiceGenerator = new ChoiceGenerator(mockAIClient);
  });

  it('filters out semantically similar choices', async () => {
    // Mock response with duplicates (Similarity > 0.7)
    // "Attack the dragon" tokens: {attack, the, dragon}
    // "Attack the dragon!" tokens: {attack, the, dragon} (punctuation removed) -> Sim: 1.0
    // "Attack the dragon now" tokens: {attack, the, dragon, now} -> Sim: 3/4 = 0.75 (> 0.7)
    
    const mockResponse = {
      content: `Decision: Action?
      Options:
      1. [NEUTRAL] Attack the dragon
      2. [NEUTRAL] Attack the dragon!
      3. [NEUTRAL] Attack the dragon now
      4. [CHAOTIC] Run away
      5. [LAWFUL] Negotiate with it`,
      finishReason: 'STOP'
    };
    
    mockAIClient.generateContent.mockResolvedValueOnce(mockResponse);
    
    const result = await choiceGenerator.generateChoices({
      worldId: 'world-1',
      narrativeContext: {} as NarrativeContext,
      characterIds: ['char-1'],
      maxOptions: 3 // Request top 3
    });
    
    expect(result.options).toHaveLength(3);
    
    // Option 1: "Attack the dragon" (Kept)
    expect(result.options[0].text).toBe('Attack the dragon');
    
    // Option 2: "Attack the dragon!" (Filtered - 100% similar)
    // Option 3: "Attack the dragon now" (Filtered - 75% similar)
    
    // Option 4: "Run away" (Kept - distinct)
    expect(result.options[1].text).toBe('Run away');
    
    // Option 5: "Negotiate with it" (Kept - distinct)
    expect(result.options[2].text).toBe('Negotiate with it');
  });
});
