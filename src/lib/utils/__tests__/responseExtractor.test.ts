// src/lib/utils/__tests__/responseExtractor.test.ts

import { ResponseExtractor } from '../responseExtractor';

describe('ResponseExtractor', () => {
  let extractor: ResponseExtractor;

  beforeEach(() => {
    extractor = new ResponseExtractor();
  });

  describe('extractJSON', () => {
    it('extracts valid JSON from code block', () => {
      const response = '```json\n{"name": "test", "value": 123}\n```';
      const result = extractor.extractJSON(response);
      
      expect(result.data).toEqual({ name: 'test', value: 123 });
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('handles malformed JSON gracefully', () => {
      const response = '```json\n{"name": "test", "value":}\n```';
      const result = extractor.extractJSON(response);
      
      expect(result.data).toBeNull();
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('returns null for missing JSON block', () => {
      const response = 'No JSON here';
      const result = extractor.extractJSON(response);
      
      expect(result.data).toBeNull();
      expect(result.errors).toContain('No JSON block found');
    });
  });

  describe('extractKeyValuePairs', () => {
    it('extracts simple key-value pairs', () => {
      const response = 'name: John\nage: 30\ncity: New York';
      const result = extractor.extractKeyValuePairs(response);
      
      expect(result.data).toEqual({
        name: 'John',
        age: '30',
        city: 'New York'
      });
    });

    it('handles empty response', () => {
      const result = extractor.extractKeyValuePairs('');
      
      expect(result.data).toEqual({});
      expect(result.confidence).toBe(0);
    });
  });

  describe('extractList', () => {
    it('extracts bulleted list items', () => {
      const response = '- Item 1\n- Item 2\n- Item 3';
      const result = extractor.extractList(response);
      
      expect(result.data).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('extracts numbered list items', () => {
      const response = '1. First item\n2. Second item\n3. Third item';
      const result = extractor.extractList(response);
      
      expect(result.data).toEqual(['First item', 'Second item', 'Third item']);
    });
  });

  describe('error handling', () => {
    it('provides clear error messages', () => {
      const result = extractor.extractJSON('invalid content');
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('No JSON block found');
    });

    it('includes extraction metadata', () => {
      const result = extractor.extractJSON('```json\n{"test": true}\n```');
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.patternUsed).toBe('json-block');
    });
  });
});