import { validateLoreConsistency } from '../loreConsistencyValidator';
import type { LoreValidationContext } from '@/types/lore.types';
import { GoogleGenAI } from '@google/genai';

// Mock GoogleGenAI
jest.mock('@google/genai');

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('loreConsistencyValidator', () => {
  const mockContext: LoreValidationContext = {
    characters: [
      {
        id: 'char1',
        name: 'Aria',
        background: 'A brave warrior from the north',
        personality: 'Bold and courageous',
        physicalDescription: 'Tall with red hair',
      },
    ],
    worldRules: [
      {
        rule: 'magic-system',
        description: 'Magic requires physical energy and drains the user',
        importance: 'high',
      },
    ],
    historicalEvents: [
      {
        description: 'The Great War ended 10 years ago',
        timestamp: '2015-01-01',
        characterIds: ['char1'],
      },
    ],
    locations: [
      {
        name: 'Ironforge',
        type: 'city',
        description: 'A fortified mountain city',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  describe('API key handling', () => {
    it('should skip validation when API key is missing', async () => {
      const result = await validateLoreConsistency('Some narrative content', mockContext);

      expect(result.validated).toBe(false);
      expect(result.isConsistent).toBe(true);
      expect(result.contradictions).toEqual([]);
      expect(result.severity).toBe('none');
    });

    it('should proceed with validation when API key is present', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: true,
          contradictions: [],
          severity: 'none',
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Consistent narrative', mockContext);

      expect(result.validated).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('contradiction detection', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should detect character contradictions', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: false,
          contradictions: [
            {
              category: 'character',
              severity: 'major',
              description: 'Character acts cowardly despite being described as bold and courageous',
              conflictingLore: 'Bold and courageous',
              narrativeExcerpt: 'Aria fled in terror from the small creature',
            },
          ],
          severity: 'major',
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency(
        'Aria fled in terror from the small creature',
        mockContext
      );

      expect(result.isConsistent).toBe(false);
      expect(result.contradictions).toHaveLength(1);
      expect(result.contradictions[0].category).toBe('character');
      expect(result.severity).toBe('major');
    });

    it('should detect world rule violations', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: false,
          contradictions: [
            {
              category: 'world-rule',
              severity: 'breaking',
              description: 'Unlimited magic use contradicts established magic system',
              conflictingLore: 'Magic requires physical energy and drains the user',
              narrativeExcerpt: 'She cast spell after spell without any sign of exhaustion',
            },
          ],
          severity: 'breaking',
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency(
        'She cast spell after spell without any sign of exhaustion',
        mockContext
      );

      expect(result.isConsistent).toBe(false);
      expect(result.contradictions[0].category).toBe('world-rule');
      expect(result.severity).toBe('breaking');
    });

    it('should pass consistent narratives', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: true,
          contradictions: [],
          severity: 'none',
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency(
        'Aria bravely faced the challenge, her red hair flowing in the wind',
        mockContext
      );

      expect(result.isConsistent).toBe(true);
      expect(result.contradictions).toHaveLength(0);
      expect(result.severity).toBe('none');
    });
  });

  describe('response parsing', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should parse valid JSON response', async () => {
      const validResponse = {
        isConsistent: false,
        contradictions: [
          {
            category: 'location',
            severity: 'moderate',
            description: 'Location mismatch',
            conflictingLore: 'Ironforge is in the mountains',
            narrativeExcerpt: 'The coastal city of Ironforge',
          },
        ],
        severity: 'moderate',
        confidence: 'medium',
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify(validResponse),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      expect(result.isConsistent).toBe(false);
      expect(result.contradictions).toHaveLength(1);
    });

    it('should handle JSON with extra text', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: `Here is the validation result:
        {
          "isConsistent": true,
          "contradictions": [],
          "severity": "none",
          "confidence": "high"
        }
        That's the result.`,
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      expect(result.isConsistent).toBe(true);
      expect(result.validated).toBe(true);
    });

    it('should fail open on malformed JSON', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'This is not valid JSON at all',
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      // Should fail open and accept narrative with validated:false
      expect(result.isConsistent).toBe(true);
      expect(result.validated).toBe(false); // Parse error means validation didn't succeed
      expect(result.contradictions).toHaveLength(0);
    });

    it('should fail open on schema validation error with invalid contradiction', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: false,
          contradictions: [
            {
              category: 'character',
              severity: 'minor',
              description: 'Minor issue',
              conflictingLore: 'Some lore',
              narrativeExcerpt: 'Some excerpt',
            },
            // Invalid contradiction - will fail schema validation
            {
              category: 'invalid',
              severity: 'minor',
            },
          ],
          severity: 'minor',
          confidence: 'medium',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      // Should fail open when schema validation fails
      expect(result.isConsistent).toBe(true);
      expect(result.contradictions).toHaveLength(0);
      expect(result.validated).toBe(false); // Schema error means validation didn't succeed
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should fail open on API error', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      // Should fail open and accept narrative
      expect(result.isConsistent).toBe(true);
      expect(result.validated).toBe(false);
      expect(result.contradictions).toHaveLength(0);
    });

    it('should fail open on network timeout', async () => {
      const mockGenerateContent = jest.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      expect(result.isConsistent).toBe(true);
      expect(result.validated).toBe(false);
    });
  });

  describe('Zod schema validation', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should validate severity enum values', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: false,
          contradictions: [],
          severity: 'invalid-severity', // Invalid value
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      // Should fall back to accepting narrative on schema validation failure
      expect(result.isConsistent).toBe(true);
      expect(result.validated).toBe(false); // Schema error means validation didn't succeed
    });

    it('should validate contradiction category enum', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: false,
          contradictions: [
            {
              category: 'invalid-category',
              severity: 'minor',
              description: 'Test',
              conflictingLore: 'Test',
              narrativeExcerpt: 'Test',
            },
          ],
          severity: 'minor',
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      // Should filter out invalid contradictions in partial parse
      expect(result.contradictions).toHaveLength(0);
    });
  });

  describe('performance', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should track processing time', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          isConsistent: true,
          contradictions: [],
          severity: 'none',
          confidence: 'high',
        }),
      });

      (GoogleGenAI as jest.Mock).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));

      const result = await validateLoreConsistency('Some content', mockContext);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });
});
