import { inferChoiceTypeFromText } from '../choiceTypeInference';
import type { AIClient } from '../types';

const mockClient = (content: string): AIClient =>
  ({ generateContent: jest.fn().mockResolvedValue({ content }) }) as unknown as AIClient;

const mockFailingClient = (error: Error): AIClient =>
  ({ generateContent: jest.fn().mockRejectedValue(error) }) as unknown as AIClient;

const jsonBlock = (obj: unknown) => '```json\n' + JSON.stringify(obj) + '\n```';

describe('inferChoiceTypeFromText', () => {
  describe('successful categorization', () => {
    const categories = [
      'diplomatic',
      'aggressive',
      'stealthy',
      'helpful',
      'selfish',
      'neutral',
    ] as const;

    test.each(categories)('correctly categorizes %s choices', async (category) => {
      const client = mockClient(jsonBlock({ choiceType: category }));
      const result = await inferChoiceTypeFromText(`Sample ${category} action`, client);
      expect(result).toBe(category);
    });

    test('handles un-fenced JSON responses', async () => {
      const client = mockClient(JSON.stringify({ choiceType: 'stealthy' }));
      const result = await inferChoiceTypeFromText('Sneak behind the statue', client);
      expect(result).toBe('stealthy');
    });

    test('normalizes uppercase or mixed-case category names', async () => {
      const client = mockClient(jsonBlock({ choiceType: 'DIPLOMATIC' }));
      const result = await inferChoiceTypeFromText('Offer peace terms', client);
      expect(result).toBe('diplomatic');
    });
  });

  describe('fallback to neutral on failure', () => {
    test('returns neutral when AI client throws an error', async () => {
      const client = mockFailingClient(new Error('Network timeout'));
      const result = await inferChoiceTypeFromText('Charge into battle', client);
      expect(result).toBe('neutral');
    });

    test('returns neutral on empty AI response content', async () => {
      const client = mockClient('');
      const result = await inferChoiceTypeFromText('Wait patiently', client);
      expect(result).toBe('neutral');
    });

    test('returns neutral on malformed JSON response', async () => {
      const client = mockClient('This is not json at all');
      const result = await inferChoiceTypeFromText('Do something', client);
      expect(result).toBe('neutral');
    });

    test('returns neutral on unknown category', async () => {
      const client = mockClient(jsonBlock({ choiceType: 'chaotic_evil' }));
      const result = await inferChoiceTypeFromText('Laugh maniacally', client);
      expect(result).toBe('neutral');
    });

    test('returns neutral without calling AI when choice text is empty or whitespace', async () => {
      const client = mockClient(jsonBlock({ choiceType: 'diplomatic' }));
      const result = await inferChoiceTypeFromText('   ', client);
      expect(result).toBe('neutral');
      expect(client.generateContent).not.toHaveBeenCalled();
    });
  });
});
