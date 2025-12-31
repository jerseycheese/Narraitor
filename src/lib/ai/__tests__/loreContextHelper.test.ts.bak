/**
 * Tests for lore context helper
 */

import { getLoreContextForPrompt } from '../loreContextHelper';
import { useLoreStore } from '@/state/loreStore';

// Mock the lore store
jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn()
  }
}));

describe('loreContextHelper', () => {
  let mockGetLoreContext: jest.Mock;
  let mockGetFacts: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLoreContext = jest.fn();
    mockGetFacts = jest.fn();

    (useLoreStore.getState as jest.Mock).mockReturnValue({
      getLoreContext: mockGetLoreContext,
      getFacts: mockGetFacts
    });
  });

  describe('getLoreContextForPrompt', () => {
    it('should return empty string when no facts exist', () => {
      mockGetLoreContext.mockReturnValue({
        facts: [],
        factCount: 0
      });

      const result = getLoreContextForPrompt('world-123');

      expect(result).toBe('');
      expect(mockGetLoreContext).toHaveBeenCalledWith('world-123', undefined);
    });

    it('should format lore facts for AI prompt inclusion', () => {
      mockGetLoreContext.mockReturnValue({
        facts: [
          'characters: hero_name = Sir Gareth',
          'locations: tavern_location = The Prancing Pony',
          'rules: magic_rule = Magic requires sacrifice'
        ],
        factCount: 3
      });

      const result = getLoreContextForPrompt('world-123');

      expect(result).toBe(`
Established World Facts:
characters: hero_name = Sir Gareth
locations: tavern_location = The Prancing Pony
rules: magic_rule = Magic requires sacrifice
`);
    });

    it('should include multiple facts in structured format', () => {
      const facts = [
        'characters: protagonist = Lyra the Bold',
        'characters: villain = Dark Lord Malachar',
        'locations: kingdom = Aetheria'
      ];

      mockGetLoreContext.mockReturnValue({
        facts,
        factCount: facts.length
      });

      const result = getLoreContextForPrompt('world-456');

      expect(result).toContain('Established World Facts:');
      expect(result).toContain('characters: protagonist = Lyra the Bold');
      expect(result).toContain('characters: villain = Dark Lord Malachar');
      expect(result).toContain('locations: kingdom = Aetheria');
    });

    it('should handle world IDs correctly', () => {
      mockGetLoreContext.mockReturnValue({
        facts: ['characters: test = value'],
        factCount: 1
      });

      getLoreContextForPrompt('specific-world-id');

      expect(mockGetLoreContext).toHaveBeenCalledWith('specific-world-id', undefined);
    });
  });
});