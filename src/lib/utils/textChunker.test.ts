import { chunkNarrativeText, type TextChunk, type ChunkingOptions } from './textChunker';

describe('textChunker', () => {
  describe('chunkNarrativeText', () => {
    it('splits text into chunks at sentence boundaries', () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence.';
      const options: ChunkingOptions = { minWordsPerChunk: 1 }; // Allow single sentences

      const chunks = chunkNarrativeText(text, options);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('This is the first sentence.');
      expect(chunks[1].content).toBe('This is the second sentence.');
      expect(chunks[2].content).toBe('This is the third sentence.');
    });

    it('handles question marks and exclamation points as sentence boundaries', () => {
      const text = 'What is happening? Something amazing! Look at this.';
      const options: ChunkingOptions = { minWordsPerChunk: 1 }; // Allow single sentences

      const chunks = chunkNarrativeText(text, options);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('What is happening?');
      expect(chunks[1].content).toBe('Something amazing!');
      expect(chunks[2].content).toBe('Look at this.');
    });

    it('combines short sentences to meet minimum word count', () => {
      const text = 'Hi. Hello. How are you today? I am doing well now. Thank you for asking me. What about you?';
      const options: ChunkingOptions = { minWordsPerChunk: 5 };

      const chunks = chunkNarrativeText(text, options);

      // Should combine short sentences to meet minimum (except last chunk which may be short)
      chunks.slice(0, -1).forEach(chunk => {
        const wordCount = chunk.content.trim().split(/\s+/).length;
        expect(wordCount).toBeGreaterThanOrEqual(5);
      });

      // Verify we got fewer chunks than sentences due to combining
      expect(chunks.length).toBeLessThan(6); // Less than the 6 original sentences
    });

    it('splits long paragraphs even within sentences if needed', () => {
      // Create a very long sentence (over 150 words)
      const longWords = Array(160).fill('word').join(' ');
      const text = `${longWords}.`;
      const options: ChunkingOptions = { maxWordsPerChunk: 150 };

      const chunks = chunkNarrativeText(text, options);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        const wordCount = chunk.content.trim().split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(150);
      });
    });

    it('handles dialogue formatting correctly', () => {
      const text = '"Hello there," she said. "How are you today?" He smiled. "I\'m doing great!"';

      const chunks = chunkNarrativeText(text);

      expect(chunks.length).toBeGreaterThan(0);
      // Dialogue should be preserved in chunks
      expect(chunks.some(chunk => chunk.content.includes('"Hello there,"'))).toBe(true);
    });

    it('handles paragraph breaks (double newlines)', () => {
      const text = 'First paragraph here.\n\nSecond paragraph here. It has multiple sentences.\n\nThird paragraph.';
      const options: ChunkingOptions = { minWordsPerChunk: 1 }; // Allow single sentences/paragraphs

      const chunks = chunkNarrativeText(text, options);

      // Should respect paragraph boundaries
      expect(chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('assigns unique IDs to each chunk', () => {
      const text = 'Sentence one. Sentence two. Sentence three.';

      const chunks = chunkNarrativeText(text);

      const ids = chunks.map(chunk => chunk.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(chunks.length);
    });

    it('tracks start and end indices correctly', () => {
      const text = 'First. Second. Third.';

      const chunks = chunkNarrativeText(text);

      chunks.forEach(chunk => {
        const extracted = text.substring(chunk.startIndex, chunk.endIndex);
        expect(extracted.trim()).toBe(chunk.content.trim());
      });
    });

    it('handles empty or very short text', () => {
      expect(chunkNarrativeText('')).toEqual([]);
      expect(chunkNarrativeText('   ')).toEqual([]);

      const shortText = 'Hi.';
      const chunks = chunkNarrativeText(shortText);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Hi.');
    });

    it('handles text without sentence terminators', () => {
      const text = 'This is a paragraph without any sentence endings';

      const chunks = chunkNarrativeText(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(text);
    });

    it('respects mobile target with smaller chunks', () => {
      const text = Array(100).fill('word').map((w, i) => i % 10 === 9 ? `${w}.` : w).join(' ');
      const options: ChunkingOptions = { isMobile: true, maxWordsPerChunk: 80 };

      const chunks = chunkNarrativeText(text, options);

      chunks.forEach(chunk => {
        const wordCount = chunk.content.trim().split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(80);
      });
    });

    it('handles abbreviations without incorrect splitting', () => {
      const text = 'Dr. Smith went to the market. Ms. Jones followed him. They bought items.';

      const chunks = chunkNarrativeText(text);

      // Should not split on "Dr." or "Ms."
      expect(chunks.some(chunk => chunk.content.includes('Dr. Smith'))).toBe(true);
      expect(chunks.some(chunk => chunk.content.includes('Ms. Jones'))).toBe(true);
    });

    it('marks the last chunk as complete', () => {
      const text = 'First sentence. Second sentence.';

      const chunks = chunkNarrativeText(text);

      chunks.slice(0, -1).forEach(chunk => {
        expect(chunk.isComplete).toBe(false);
      });
      expect(chunks[chunks.length - 1].isComplete).toBe(true);
    });
  });
});
