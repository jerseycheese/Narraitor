import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeDisplay } from '../NarrativeDisplay';

describe('NarrativeDisplay', () => {
  describe('Basic narrative display functionality', () => {
    it('displays narrative content appropriately', () => {
      const segment = {
        id: 'seg-1',
        content: 'The ancient forest whispered secrets in the moonlight.',
        type: 'scene' as const,
        metadata: {
          characterIds: [],
          mood: 'mysterious' as const,
          location: 'Dark Forest',
          tags: ['forest', 'night']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      expect(screen.getByText(/ancient forest whispered secrets/)).toBeInTheDocument();
    });

    it('renders different segment types with appropriate styling', () => {
      const dialogueSegment = {
        id: 'seg-2',
        content: '"Hello there," said the mysterious stranger.',
        type: 'dialogue' as const,
        metadata: {
          characterIds: ['char-1'],
          mood: 'neutral' as const,
          tags: ['conversation']
        }
      };

      const { rerender } = render(<NarrativeDisplay segment={dialogueSegment} />);
      expect(screen.getByText(/Hello there/)).toBeInTheDocument();

      const actionSegment = {
        id: 'seg-3',
        content: 'The hero leapt across the chasm.',
        type: 'action' as const,
        metadata: {
          characterIds: ['hero'],
          mood: 'action' as const,
          tags: ['action', 'movement']
        }
      };

      rerender(<NarrativeDisplay segment={actionSegment} />);
      expect(screen.getByText(/hero leapt across/)).toBeInTheDocument();
    });

    it('handles loading state', () => {
      render(<NarrativeDisplay segment={null} isLoading={true} />);
      
      expect(screen.getByText(/Writing your story/i)).toBeInTheDocument();
    });

    it('handles error state', () => {
      const errorMessage = 'Failed to generate narrative';
      render(<NarrativeDisplay segment={null} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('shows retry button when error occurs and onRetry is provided', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Unable to generate narrative. Please check your connection and try again.';
      const mockRetry = jest.fn();
      
      render(<NarrativeDisplay segment={null} error={errorMessage} onRetry={mockRetry} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      
      await user.click(screen.getByText('Try Again'));
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when no onRetry handler is provided', () => {
      const errorMessage = 'Unable to generate narrative. Please check your connection and try again.';
      
      render(<NarrativeDisplay segment={null} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('Formatted narrative text display for readable storytelling', () => {
    it('displays narrative text with standard paragraph breaks for readability', () => {
      const segment = {
        id: 'seg-1',
        content: 'The journey began at dawn.\n\nBy midday, the travelers had reached the forest edge.',
        type: 'scene' as const,
        metadata: {
          characterIds: [],
          mood: 'neutral' as const,
          tags: ['journey']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // Text should be displayed with proper paragraph breaks for easy reading
      expect(screen.getByText(/The journey began at dawn/)).toBeInTheDocument();
      expect(screen.getByText(/By midday, the travelers/)).toBeInTheDocument();
    });

    it('displays dialogue with proper quotation marks and attribution', () => {
      const segment = {
        id: 'seg-2',
        content: '"Welcome to our village," said the elder warmly.',
        type: 'dialogue' as const,
        metadata: {
          characterIds: ['elder'],
          mood: 'neutral' as const,
          tags: ['greeting']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // Dialogue should be properly formatted with quotation marks for clear attribution
      expect(screen.getByText(/Welcome to our village/)).toBeInTheDocument();
      expect(screen.getByText(/said the elder warmly/)).toBeInTheDocument();
    });

    it('shows important elements with appropriate emphasis formatting', () => {
      const segment = {
        id: 'seg-3',
        content: 'The sword gleamed with magical power, clearly an ancient artifact.',
        type: 'action' as const,
        metadata: {
          characterIds: [],
          mood: 'mysterious' as const,
          tags: ['magic', 'artifact']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // Important narrative elements should be displayed clearly for reader focus
      expect(screen.getByText(/sword gleamed with magical power/)).toBeInTheDocument();
      expect(screen.getByText(/ancient artifact/)).toBeInTheDocument();
    });

    it('organizes text visually for easy reading across different segment types', () => {
      const sceneSegment = {
        id: 'seg-1',
        content: 'The party approached the mysterious tower.',
        type: 'scene' as const,
        metadata: { characterIds: [], mood: 'mysterious' as const, tags: ['exploration'] }
      };

      const { rerender } = render(<NarrativeDisplay segment={sceneSegment} />);
      
      // Scene segment should have consistent formatting
      expect(screen.getByText(/party approached the mysterious tower/)).toBeInTheDocument();
      expect(screen.getByText(/party approached the mysterious tower/).closest('.narrative-segment')).toHaveClass('p-6', 'rounded-lg');

      const dialogueSegment = {
        id: 'seg-2', 
        content: '"This place gives me the chills," whispered the rogue.',
        type: 'dialogue' as const,
        metadata: { characterIds: ['rogue'], mood: 'tense' as const, tags: ['fear'] }
      };

      rerender(<NarrativeDisplay segment={dialogueSegment} />);
      
      // Dialogue segment should have consistent formatting
      expect(screen.getByText(/This place gives me the chills/)).toBeInTheDocument();
      expect(screen.getByText(/This place gives me the chills/).closest('.narrative-segment')).toHaveClass('p-6', 'rounded-lg');

      const actionSegment = {
        id: 'seg-3',
        content: 'The warrior drew his weapon, ready for whatever lay ahead.',
        type: 'action' as const,
        metadata: { characterIds: ['warrior'], mood: 'action' as const, tags: ['combat'] }
      };

      rerender(<NarrativeDisplay segment={actionSegment} />);
      
      // Action segment should have consistent formatting
      expect(screen.getByText(/warrior drew his weapon/)).toBeInTheDocument();
      expect(screen.getByText(/warrior drew his weapon/).closest('.narrative-segment')).toHaveClass('p-6', 'rounded-lg');
    });

    it('maintains consistent formatting across all narrative segments', () => {
      const mixedContentSegment = {
        id: 'seg-4',
        content: 'Scene description here.\n\n"Character dialogue follows," the speaker noted.\n\nAction continues the story.',
        type: 'scene' as const,
        metadata: {
          characterIds: ['speaker'],
          mood: 'neutral' as const,
          tags: ['mixed']
        }
      };

      render(<NarrativeDisplay segment={mixedContentSegment} />);

      // Mixed content should maintain consistent formatting throughout
      expect(screen.getByText(/Scene description here/)).toBeInTheDocument();
      expect(screen.getByText(/Character dialogue follows/)).toBeInTheDocument();
      expect(screen.getByText(/Action continues the story/)).toBeInTheDocument();
      
      // The container should have consistent styling
      const narrativeContainer = screen.getByText(/Scene description here/).closest('.narrative-segment');
      expect(narrativeContainer).toHaveClass('p-6', 'rounded-lg');
    });

    it('handles complex narrative content with proper formatting', () => {
      const complexSegment = {
        id: 'seg-5',
        content: 'The ancient tome revealed its secrets.\n\n"By the gods," exclaimed the scholar, "this changes everything!"\n\nThe implications were staggering.',
        type: 'revelation' as const,
        metadata: {
          characterIds: ['scholar'],
          mood: 'emotional' as const,
          tags: ['discovery', 'knowledge']
        }
      };

      render(<NarrativeDisplay segment={complexSegment} />);

      // Complex narrative should be formatted for maximum readability
      expect(screen.getByText(/ancient tome revealed/)).toBeInTheDocument();
      expect(screen.getByText(/By the gods/)).toBeInTheDocument();
      expect(screen.getByText(/implications were staggering/)).toBeInTheDocument();
    });
  });

  describe('JSON content parsing and formatting', () => {
    it('extracts and formats content from JSON wrapped in code blocks', () => {
      const segment = {
        id: 'seg-6',
        content: '```json\n{"content": "The hero discovered a hidden passage.\\n\\nIt led to an underground chamber."}\n```',
        type: 'scene' as const,
        metadata: {
          characterIds: [],
          mood: 'mysterious' as const,
          tags: ['discovery']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // JSON content should be extracted and displayed as readable narrative
      expect(screen.getByText(/hero discovered a hidden passage/)).toBeInTheDocument();
      expect(screen.getByText(/underground chamber/)).toBeInTheDocument();
    });

    it('handles malformed JSON gracefully while maintaining readability', () => {
      const segment = {
        id: 'seg-7',
        content: '```json\n{"content": "Incomplete JSON content...\n```',
        type: 'scene' as const,
        metadata: {
          characterIds: [],
          mood: 'neutral' as const,
          tags: ['error']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // Should display fallback content or handle gracefully without breaking the UI
      const narrativeElement = screen.getByText(/json/i);
      expect(narrativeElement).toBeInTheDocument();
    });

    it('displays fallback message for suspiciously short content', () => {
      const segment = {
        id: 'seg-8',
        content: 'scene',
        type: 'scene' as const,
        metadata: {
          characterIds: [],
          mood: 'neutral' as const,
          tags: []
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // Should show appropriate fallback for content that appears incomplete
      expect(screen.getByText(/story is beginning/i)).toBeInTheDocument();
    });
  });

  describe('Segment metadata and location display', () => {
    it('displays location information when available for context', () => {
      const segment = {
        id: 'seg-9',
        content: 'The adventure continues in this mystical place.',
        type: 'scene' as const,
        metadata: {
          characterIds: [],
          mood: 'mysterious' as const,
          location: 'Enchanted Forest Clearing',
          tags: ['forest', 'magic']
        }
      };

      render(<NarrativeDisplay segment={segment} />);

      // Location context should be clearly displayed to help reader orientation
      expect(screen.getByText('Enchanted Forest Clearing')).toBeInTheDocument();
      expect(screen.getByText(/adventure continues/)).toBeInTheDocument();
    });

    it('shows segment type labels for reader orientation', () => {
      const dialogueSegment = {
        id: 'seg-10',
        content: '"The quest must continue," declared the hero.',
        type: 'dialogue' as const,
        metadata: {
          characterIds: ['hero'],
          mood: 'determined' as const,
          tags: ['motivation']
        }
      };

      render(<NarrativeDisplay segment={dialogueSegment} />);

      // Segment type should be clearly labeled for reader understanding
      expect(screen.getByText('dialogue')).toBeInTheDocument();
      expect(screen.getByText(/quest must continue/)).toBeInTheDocument();
    });
  });
});
