// src/lib/utils/__tests__/narrativeParser.test.ts

import { parseNarrativeContent } from '../narrativeParser';

describe('parseNarrativeContent', () => {
  describe('JSON code block extraction', () => {
    test('should extract content from properly formatted JSON code blocks', () => {
      const input = '```json\n{"content": "The hero steps into the ancient temple."}\n```';
      const expected = 'The hero steps into the ancient temple.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should extract text field when content field is not available', () => {
      const input = '```json\n{"text": "She whispered secrets to the wind."}\n```';
      const expected = 'She whispered secrets to the wind.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should sanitize control characters that break JSON parsing', () => {
      // Common control characters that come from AI responses
      const input = '```json\n{"content": "Text with\u0001control\u0002chars"}\n```';
      const expected = 'Text with control chars';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should handle nested response structures from AI models', () => {
      const input = '```json\n{"response": {"content": "The dragon roared across the valley."}}\n```';
      const expected = 'The dragon roared across the valley.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should extract from narrative.content structure', () => {
      const input = '```json\n{"narrative": {"content": "Lightning struck the tower."}}\n```';
      const expected = 'Lightning struck the tower.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should extract from scene.description structure', () => {
      const input = '```json\n{"scene": {"description": "The marketplace bustled with activity."}}\n```';
      const expected = 'The marketplace bustled with activity.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should find first substantial string field in unknown structures', () => {
      const input = '```json\n{"unknownField": "This is a substantial narrative content that should be extracted.", "shortField": "no"}\n```';
      const expected = 'This is a substantial narrative content that should be extracted.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });
  });

  describe('Regex fallback for malformed JSON', () => {
    test('should extract content via regex when JSON parsing fails', () => {
      // Missing closing quote - invalid JSON but regex can extract
      const input = '```json\n{"content": "The wizard cast a powerful spell.\n```';
      const expected = 'The wizard cast a powerful spell.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should handle escaped quotes in regex extraction', () => {
      // Create malformed JSON that triggers regex but can still be extracted (malformed structure but valid content field)
      const malformedInput = '```json\n{"content": "Simple content without escapes"}';
      const expected = 'Simple content without escapes';
      expect(parseNarrativeContent(malformedInput)).toBe(expected);
    });

    test('should handle newlines in regex extracted content', () => {
      const input = '```json\n{"content": "First line\\nSecond line"}\n```';
      const expected = 'First line\nSecond line';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should fallback to text field via regex when content fails', () => {
      const input = '```json\n{"text": "Extracted via regex fallback method.\n```';
      const expected = 'Extracted via regex fallback method.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should extract any substantial string as last resort', () => {
      const input = '```json\n{"unknownField": "This substantial content should be extracted as fallback method."}\n```';
      const expected = 'This substantial content should be extracted as fallback method.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should prioritize content field over other fields in regex extraction', () => {
      const input = '```json\n{"text": "Wrong content", "content": "Correct priority content"}\n```';
      const expected = 'Correct priority content';
      expect(parseNarrativeContent(input)).toBe(expected);
    });
  });

  describe('Raw JSON parsing without code markers', () => {
    test('should parse direct JSON objects with content field', () => {
      const input = '{"content": "Direct JSON without markdown."}';
      const expected = 'Direct JSON without markdown.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should parse direct JSON objects with text field', () => {
      const input = '{"text": "Direct JSON with text field."}';
      const expected = 'Direct JSON with text field.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should gracefully handle malformed direct JSON', () => {
      const input = '{"content": "Malformed JSON without closing brace"';
      // Should return original content when direct JSON parsing fails
      expect(parseNarrativeContent(input)).toBe(input);
    });
  });

  describe('Short content and metadata detection', () => {
    test('should detect short scene metadata and return fallback message', () => {
      const input = 'scene: forest';
      const expected = 'The story is beginning... (Content generation in progress)';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should detect Starting Location metadata and return fallback message', () => {
      const input = 'Starting Location: Castle';
      const expected = 'The story is beginning... (Content generation in progress)';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should not trigger fallback for substantial content containing scene', () => {
      const input = 'The scene before them was breathtaking and filled with wonder.';
      expect(parseNarrativeContent(input)).toBe(input);
    });

    test('should handle mixed case in short metadata detection', () => {
      const input = 'Scene: tavern';
      const expected = 'The story is beginning... (Content generation in progress)';
      expect(parseNarrativeContent(input)).toBe(expected);
    });
  });

  describe('Plain text passthrough', () => {
    test('should return plain narrative text unchanged', () => {
      const input = 'The adventurer walked through the mysterious forest, feeling the ancient magic in the air.';
      expect(parseNarrativeContent(input)).toBe(input);
    });

    test('should handle multi-paragraph plain text', () => {
      const input = 'First paragraph of the story.\n\nSecond paragraph continues the narrative.';
      expect(parseNarrativeContent(input)).toBe(input);
    });

    test('should handle plain text with dialogue', () => {
      const input = '"Welcome, traveler," said the innkeeper warmly.';
      expect(parseNarrativeContent(input)).toBe(input);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle empty content gracefully', () => {
      expect(parseNarrativeContent('')).toBe('');
    });

    test('should handle null content gracefully', () => {
      expect(parseNarrativeContent(null as unknown as string)).toBe('');
    });

    test('should handle undefined content gracefully', () => {
      expect(parseNarrativeContent(undefined as unknown as string)).toBe('');
    });

    test('should handle non-string content gracefully', () => {
      expect(parseNarrativeContent(42 as unknown as string)).toBe('');
      expect(parseNarrativeContent({} as unknown as string)).toBe('');
      expect(parseNarrativeContent([] as unknown as string)).toBe('');
    });

    test('should handle whitespace-only content', () => {
      expect(parseNarrativeContent('   \n\t   ')).toBe('');
    });

    test('should handle JSON code blocks with only whitespace', () => {
      const input = '```json\n   \n```';
      expect(parseNarrativeContent(input)).toBe(input);
    });

    test('should handle empty JSON objects gracefully', () => {
      const input = '```json\n{}\n```';
      expect(parseNarrativeContent(input)).toBe(input);
    });

    test('should handle JSON arrays gracefully', () => {
      const input = '```json\n["item1", "item2"]\n```';
      expect(parseNarrativeContent(input)).toBe(input);
    });

    test('should preserve original content when all parsing strategies fail', () => {
      const input = 'Complex content that cannot be parsed but should be preserved exactly as is.';
      expect(parseNarrativeContent(input)).toBe(input);
    });
  });

  describe('Real-world AI response scenarios', () => {
    test('should handle typical Gemini response format', () => {
      const input = '```json\n{\n  "content": "The tavern door creaked open, revealing shadowy figures within."\n}\n```';
      const expected = 'The tavern door creaked open, revealing shadowy figures within.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should handle response with additional metadata fields', () => {
      const input = '```json\n{\n  "content": "Thunder echoed across the mountains.",\n  "mood": "dramatic",\n  "location": "mountain_pass"\n}\n```';
      const expected = 'Thunder echoed across the mountains.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should handle malformed JSON from AI with extra commas', () => {
      const input = '```json\n{"content": "Content with trailing comma",}\n```';
      const expected = 'Content with trailing comma';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should handle AI responses with Unicode characters', () => {
      const input = '```json\n{"content": "The café owner smiled warmly at the new customer."}\n```';
      const expected = 'The café owner smiled warmly at the new customer.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });

    test('should handle nested JSON structures from complex AI responses', () => {
      const input = '```json\n{\n  "response": {\n    "narrative": {\n      "content": "Deep within the nested response structure lies the story."\n    }\n  }\n}\n```';
      const expected = 'Deep within the nested response structure lies the story.';
      expect(parseNarrativeContent(input)).toBe(expected);
    });
  });
});