// src/components/Narrative/__tests__/NarrativeDisplay.formatting.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { NarrativeSegment } from '@/types/narrative.types';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('NarrativeDisplay - Formatting Integration', () => {
  const createMockSegment = (
    content: string,
    type: NarrativeSegment['type'] = 'scene'
  ): NarrativeSegment => ({
    id: 'seg-1',
    content,
    type,
    sessionId: 'session-1',
    worldId: 'world-1',
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    metadata: {
      characterIds: [],
      tags: [],
      mood: 'neutral',
    },
  });

  describe('Paragraph formatting', () => {
    it('should display paragraphs with proper line breaks for readability', () => {
      const rawContent = 'First paragraph about the forest.\n\nSecond paragraph about the adventure.\n\nThird paragraph continues the story.';
      const segment = createMockSegment(rawContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // With HTML formatting and dangerouslySetInnerHTML, content is structured in paragraphs
      expect(screen.getByText('First paragraph about the forest.')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph about the adventure.')).toBeInTheDocument();
      expect(screen.getByText('Third paragraph continues the story.')).toBeInTheDocument();
    });

    it('should handle mixed paragraph content with consistent spacing', () => {
      const rawContent = 'Opening scene description.\n\n\n\nMiddle section with extra breaks.\n\nClosing paragraph.';
      const segment = createMockSegment(rawContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Content should be organized into clean paragraphs
      expect(screen.getByText('Opening scene description.')).toBeInTheDocument();
      expect(screen.getByText('Middle section with extra breaks.')).toBeInTheDocument();
      expect(screen.getByText('Closing paragraph.')).toBeInTheDocument();
    });
  });

  describe('Dialogue formatting', () => {
    it('should display dialogue with proper quotation marks and attribution', () => {
      const rawContent = 'The wizard said, Welcome to my tower! The visitor replied, Thank you for having me.';
      const segment = createMockSegment(rawContent, 'dialogue');
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Dialogue segments should format dialogue with quotes
      expect(screen.getByText(/The wizard said, "Welcome to my tower!"/)).toBeInTheDocument();
    });

    it('should handle dialogue within scene descriptions', () => {
      const rawContent = 'The room was silent until she spoke.\n\nShe said, This place holds many secrets.\n\nHer words echoed in the chamber.';
      const segment = createMockSegment(rawContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Scene segments format dialogue with quotes
      expect(screen.getByText('The room was silent until she spoke.')).toBeInTheDocument();
      expect(screen.getByText(/She said, "This place holds many secrets\."/)).toBeInTheDocument();
      expect(screen.getByText('Her words echoed in the chamber.')).toBeInTheDocument();
    });

    it('should preserve dialogue that already has quotation marks', () => {
      const rawContent = 'He said, "I already have quotes!" and she replied, "Me too!"';
      const segment = createMockSegment(rawContent, 'dialogue');
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Should maintain existing quote structure
      expect(screen.getByText(/He said, "I already have quotes!" and she replied, "Me too!"/)).toBeInTheDocument();
    });
  });

  describe('Text emphasis and formatting', () => {
    it('should render emphasized text with semantic HTML', () => {
      const rawContent = 'The *ancient* artifact glowed with *mysterious* power.';
      const segment = createMockSegment(rawContent);

      render(<NarrativeDisplay segment={segment} />);

      // Verify emphasized words are rendered as em elements
      const emphasizedWords = screen.getAllByText(/ancient|mysterious/);
      emphasizedWords.forEach(word => {
        expect(word.tagName).toBe('EM');
      });
    });

    it('should emphasize text in action sequences', () => {
      const rawContent = 'He leaped forward!\n\nThe sword clashed against the shield.\n\n*Victory* was within reach.';
      const segment = createMockSegment(rawContent, 'action');

      render(<NarrativeDisplay segment={segment} />);

      // Action segments organize paragraphs
      expect(screen.getByText('He leaped forward!')).toBeInTheDocument();
      expect(screen.getByText('The sword clashed against the shield.')).toBeInTheDocument();

      // Verify emphasis is rendered
      const victoryText = screen.getByText('Victory');
      expect(victoryText.tagName).toBe('EM');
    });

    it('should render bold emphasis with strong tags', () => {
      const rawContent = 'The enemy approaches with **unstoppable force**!';
      const segment = createMockSegment(rawContent, 'action');

      render(<NarrativeDisplay segment={segment} />);

      // Verify bold text is rendered as strong element
      const boldText = screen.getByText('unstoppable force');
      expect(boldText.tagName).toBe('STRONG');
    });
  });

  describe('Complex narrative formatting', () => {
    it('should handle mixed content with dialogue, paragraphs, and emphasis', () => {
      const rawContent = 'The tavern was *bustling* with activity.\n\nThe bartender said, What can I get you? The traveler replied, Just some information.\n\nThe conversation continued late into the night.';
      const segment = createMockSegment(rawContent);

      render(<NarrativeDisplay segment={segment} />);

      // All formatting should work together: emphasis, dialogue quotes, and paragraphs
      const emphasizedWord = screen.getByText('bustling');
      expect(emphasizedWord.tagName).toBe('EM');

      expect(screen.getByText(/What can I get you\?/)).toBeInTheDocument();
      expect(screen.getByText(/"Just some information\."/)).toBeInTheDocument();
      expect(screen.getByText('The conversation continued late into the night.')).toBeInTheDocument();
    });

    it('should maintain readability across different segment types', () => {
      const contents = [
        { content: 'Scene: The mysterious forest beckoned.\n\nTrees whispered secrets.', type: 'scene' as const },
        { content: 'She said, Follow me. He replied, Where are we going?', type: 'dialogue' as const },
        { content: 'They ran through the underbrush.\n\nBranches snapped behind them.', type: 'action' as const },
      ];

      contents.forEach(({ content, type }) => {
        const segment = createMockSegment(content, type);
        const { unmount } = render(<NarrativeDisplay segment={segment} />);
        
        // Each segment type should display with appropriate formatting
        if (type === 'scene') {
          expect(screen.getByText('Scene: The mysterious forest beckoned.')).toBeInTheDocument();
        } else if (type === 'dialogue') {
          // Dialogue segments add quotation marks
          expect(screen.getByText(/She said, "Follow me\."/)).toBeInTheDocument();
        } else if (type === 'action') {
          expect(screen.getByText('They ran through the underbrush.')).toBeInTheDocument();
        }
        unmount();
      });
    });
  });

  describe('Visual organization for storytelling', () => {
    it('should organize long narrative content for easy reading', () => {
      const longContent = `The ancient library stretched endlessly before them. Towering shelves disappeared into shadow above.

Books of every size and color filled the shelves. Some glowed with inner light, others seemed to absorb the surrounding darkness.

The librarian said, Welcome to the Archive of Ages. Here you will find the knowledge you seek.

They walked deeper into the stacks. The *whispers* of ancient wisdom echoed around them.

This was only the beginning of their quest.`;

      const segment = createMockSegment(longContent);

      render(<NarrativeDisplay segment={segment} />);

      // Long content should be organized into clear paragraphs with proper formatting
      expect(screen.getByText('The ancient library stretched endlessly before them. Towering shelves disappeared into shadow above.')).toBeInTheDocument();
      expect(screen.getByText(/The librarian said, "Welcome to the Archive of Ages\./)).toBeInTheDocument();
      expect(screen.getByText('This was only the beginning of their quest.')).toBeInTheDocument();

      // Verify emphasis is rendered
      const emphasizedWord = screen.getByText('whispers');
      expect(emphasizedWord.tagName).toBe('EM');
    });

    it('should handle whitespace normalization while preserving story structure', () => {
      const messyContent = '   The story begins   here.   \n\n\n   Multiple    spaces    everywhere.   \n\n   The  end.   ';
      const segment = createMockSegment(messyContent);
      
      render(<NarrativeDisplay segment={segment} />);
      
      // Whitespace should be normalized and content organized into clean paragraphs
      expect(screen.getByText('The story begins here.')).toBeInTheDocument();
      expect(screen.getByText('Multiple spaces everywhere.')).toBeInTheDocument();
      expect(screen.getByText('The end.')).toBeInTheDocument();
    });
  });

  describe('Integration with narrative segment types', () => {
    it('should apply consistent formatting across all segment types', () => {
      const segmentTypes: Array<NarrativeSegment['type']> = ['scene', 'dialogue', 'action', 'transition'];
      
      segmentTypes.forEach(type => {
        const content = `This is a ${type} segment.\n\nIt has multiple paragraphs.\n\nThe character said, This should be formatted properly.`;
        const segment = createMockSegment(content, type);
        
        const { unmount } = render(<NarrativeDisplay segment={segment} />);
        
        // Each segment type should display content with appropriate formatting
        if (type === 'transition') {
          // Transition segments preserve line breaks, so text is in one container with <br> tags
          expect(screen.getByText(/This is a transition segment\./)).toBeInTheDocument();
          expect(screen.getByText(/It has multiple paragraphs\./)).toBeInTheDocument();
          expect(screen.getByText(/The character said, This should be formatted properly\./)).toBeInTheDocument();
        } else {
          expect(screen.getByText(`This is a ${type} segment.`)).toBeInTheDocument();
          expect(screen.getByText('It has multiple paragraphs.')).toBeInTheDocument();
          
          // Check if dialogue formatting is applied based on segment type
          if (type === 'scene' || type === 'dialogue') {
            expect(screen.getByText(/The character said, "This should be formatted properly\."/)).toBeInTheDocument();
          } else if (type === 'action') {
            // Action segments don't format dialogue
            expect(screen.getByText('The character said, This should be formatted properly.')).toBeInTheDocument();
          }
        }
        
        unmount();
      });
    });
  });
});
