// src/components/Narrative/__tests__/NarrativeDisplay.readable-storytelling.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';

describe('NarrativeDisplay Readable Storytelling (Issue #231)', () => {
  const createMockSegment = (
    content: string,
    type: NarrativeSegment['type'] = 'scene'
  ): NarrativeSegment => ({
    id: 'test-segment',
    content,
    type,
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      characterIds: [],
      tags: [],
      mood: 'neutral'
    }
  });

  describe('Paragraph Break Display', () => {
    test('should display narrative text with proper paragraph breaks', () => {
      const narrativeWithParagraphs = 'The forest was silent.\n\nA twig snapped behind them.\n\nThey turned slowly.';
      const segment = createMockSegment(narrativeWithParagraphs);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Should display the content with paragraph structure intact
      const displayedContent = screen.getByText(/forest was silent/)
        .closest('.narrative-segment')
        ?.textContent;
      
      expect(displayedContent).toContain('The forest was silent.');
      expect(displayedContent).toContain('A twig snapped behind them.');
      expect(displayedContent).toContain('They turned slowly.');
    });

    test('should maintain readability with whitespace-pre-wrap formatting', () => {
      const formattedNarrative = 'First paragraph.\n\nSecond paragraph with details.\n\nFinal paragraph.';
      const segment = createMockSegment(formattedNarrative);
      
      render(<NarrativeDisplay segment={segment} />);
      
      const contentElement = screen.getByText(/First paragraph/)
        .closest('p');
      
      // Should have whitespace-pre-wrap class for proper line break handling
      expect(contentElement).toHaveClass('whitespace-pre-wrap');
    });

    test('should handle different segment types with consistent paragraph formatting', () => {
      const dialogueContent = 'He entered the room.\n\n"Welcome," she said.\n\nHe nodded in response.';
      const dialogueSegment = createMockSegment(dialogueContent, 'dialogue');
      
      render(<NarrativeDisplay segment={dialogueSegment} />);
      
      const content = screen.getByText(/He entered the room/);
      expect(content).toBeInTheDocument();
      expect(content.closest('p')).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Dialogue Display Formatting', () => {
    test('should display dialogue content with proper visual formatting', () => {
      const dialogueContent = '"Welcome to the tavern," said the barkeeper. "What can I get you?"';
      const segment = createMockSegment(dialogueContent, 'dialogue');
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Should display dialogue content
      expect(screen.getByText(/Welcome to the tavern/)).toBeInTheDocument();
      expect(screen.getByText(/What can I get you/)).toBeInTheDocument();
    });

    test('should apply dialogue-specific styling for readability', () => {
      const dialogueContent = '"The path ahead is dangerous," warned the guide.';
      const segment = createMockSegment(dialogueContent, 'dialogue');
      
      render(<NarrativeDisplay segment={segment} />);
      
      const narrativeContainer = screen.getByText(/path ahead is dangerous/)
        .closest('.narrative-segment');
      
      // Should have dialogue-specific styling
      expect(narrativeContainer).toHaveClass('border-l-4', 'border-blue-400', 'bg-blue-50');
    });

    test('should display dialogue with proper text emphasis', () => {
      const dialogueContent = '"This is very important," she emphasized.';
      const segment = createMockSegment(dialogueContent, 'dialogue');
      
      render(<NarrativeDisplay segment={segment} />);
      
      const textElement = screen.getByText(/This is very important/)
        .closest('p');
      
      // Should have italic text formatting for dialogue
      expect(textElement).toHaveClass('italic');
    });
  });

  describe('Visual Organization for Different Segment Types', () => {
    test('should display action segments with appropriate visual emphasis', () => {
      const actionContent = 'The hero leaped across the chasm with incredible speed.';
      const segment = createMockSegment(actionContent, 'action');
      
      render(<NarrativeDisplay segment={segment} />);
      
      const container = screen.getByText(/hero leaped across/)
        .closest('.narrative-segment');
      const textElement = screen.getByText(/hero leaped across/)
        .closest('p');
      
      // Should have action-specific styling
      expect(container).toHaveClass('border-2', 'border-orange-300', 'bg-orange-50');
      expect(textElement).toHaveClass('font-medium');
    });

    test('should display scene segments with readable default formatting', () => {
      const sceneContent = 'The ancient library stretched before them, filled with countless books.';
      const segment = createMockSegment(sceneContent, 'scene');
      
      render(<NarrativeDisplay segment={segment} />);
      
      const container = screen.getByText(/ancient library stretched/)
        .closest('.narrative-segment');
      const textElement = screen.getByText(/ancient library stretched/)
        .closest('p');
      
      // Should have scene-specific (default) styling
      expect(container).toHaveClass('bg-white', 'border', 'border-gray-200');
      expect(textElement).toHaveClass('text-gray-800');
    });

    test('should display transition segments with appropriate subtle formatting', () => {
      const transitionContent = 'Hours passed as they traveled through the wilderness...';
      const segment = createMockSegment(transitionContent, 'transition');
      
      render(<NarrativeDisplay segment={segment} />);
      
      const container = screen.getByText(/Hours passed as they traveled/)
        .closest('.narrative-segment');
      const textElement = screen.getByText(/Hours passed as they traveled/)
        .closest('p');
      
      // Should have transition-specific styling
      expect(container).toHaveClass('bg-gray-100', 'border', 'border-gray-300');
      expect(textElement).toHaveClass('text-gray-600', 'text-sm', 'italic');
    });
  });

  describe('Consistent Formatting Across All Segments', () => {
    test('should maintain consistent readability formatting regardless of content length', () => {
      const shortContent = 'Brief scene.';
      const longContent = 'This is a much longer narrative segment that contains multiple sentences and should maintain the same formatting consistency as shorter content. The formatting should remain readable and well-organized throughout the entire text, ensuring that users can easily follow the story regardless of the segment length.';
      
      const shortSegment = createMockSegment(shortContent);
      const longSegment = createMockSegment(longContent);
      
      const { rerender } = render(<NarrativeDisplay segment={shortSegment} />);
      
      let textElement = screen.getByText(/Brief scene/)
        .closest('p');
      expect(textElement).toHaveClass('text-l', 'leading-relaxed', 'whitespace-pre-wrap');
      
      rerender(<NarrativeDisplay segment={longSegment} />);
      
      textElement = screen.getByText(/This is a much longer narrative/)
        .closest('p');
      expect(textElement).toHaveClass('text-l', 'leading-relaxed', 'whitespace-pre-wrap');
    });

    test('should display location metadata consistently for context', () => {
      const segmentWithLocation = createMockSegment(
        'The marketplace was bustling with activity.',
        'scene'
      );
      segmentWithLocation.metadata.location = 'Grand Bazaar';
      
      render(<NarrativeDisplay segment={segmentWithLocation} />);
      
      // Should display location for context
      expect(screen.getByText('Grand Bazaar')).toBeInTheDocument();
      
      const locationElement = screen.getByText('Grand Bazaar');
      expect(locationElement).toHaveClass('text-sm', 'text-gray-500');
    });

    test('should maintain visual hierarchy with segment type labels', () => {
      const actionSegment = createMockSegment('Combat ensued.', 'action');
      
      render(<NarrativeDisplay segment={actionSegment} />);
      
      // Should display segment type label
      expect(screen.getByText('action')).toBeInTheDocument();
      
      const labelElement = screen.getByText('action');
      expect(labelElement).toHaveClass('text-xs', 'uppercase', 'font-semibold');
    });
  });

  describe('Integration with Content Parsing', () => {
    test('should handle JSON-wrapped content while maintaining formatting', () => {
      const jsonContent = '{"content": "The wizard spoke carefully.\\n\\n\"Magic requires precision,\" he explained."}';
      const segment = createMockSegment(jsonContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Should extract and display the content properly
      expect(screen.getByText(/wizard spoke carefully/)).toBeInTheDocument();
      expect(screen.getByText(/Magic requires precision/)).toBeInTheDocument();
    });

    test('should handle malformed content gracefully while preserving readability', () => {
      const malformedContent = 'Content with strange characters \u0000 and formatting issues.';
      const segment = createMockSegment(malformedContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Should still display content in readable format
      expect(screen.getByText(/Content with strange characters/)).toBeInTheDocument();
    });

    test('should display fallback content when original content is insufficient', () => {
      const insufficientContent = 'scene';
      const segment = createMockSegment(insufficientContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Should display fallback message for insufficient content
      expect(screen.getByText(/The story is beginning/)).toBeInTheDocument();
    });
  });
});
