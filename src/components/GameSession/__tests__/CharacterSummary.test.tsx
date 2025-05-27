import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterSummary from '../CharacterSummary';
import { Character } from '@/types/character.types';

describe('CharacterSummary', () => {
  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Aldric the Bold',
    description: 'A brave knight with unwavering loyalty',
    background: 'Raised in a noble family, trained in the art of combat since childhood',
    worldId: 'world-1',
    level: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    portrait: {
      type: 'generated',
      url: 'https://example.com/portrait.jpg'
    },
    attributes: {
      strength: { value: 18, min: 1, max: 20 },
      intelligence: { value: 12, min: 1, max: 20 },
      agility: { value: 14, min: 1, max: 20 }
    },
    skills: {
      swordsmanship: { value: 8, min: 1, max: 10 },
      diplomacy: { value: 5, min: 1, max: 10 }
    }
  };

  describe('Core Functionality', () => {
    it('displays character name prominently', () => {
      render(<CharacterSummary character={mockCharacter} />);
      
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
    });

    it('displays character description', () => {
      render(<CharacterSummary character={mockCharacter} />);
      
      expect(screen.getByText('A brave knight with unwavering loyalty')).toBeInTheDocument();
    });

    it('displays character background when available', () => {
      render(<CharacterSummary character={mockCharacter} />);
      
      expect(screen.getByText(/Raised in a noble family/)).toBeInTheDocument();
    });

    it('displays character level', () => {
      render(<CharacterSummary character={mockCharacter} />);
      
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
    });
  });

  describe('Portrait Handling', () => {
    it('displays character portrait when available', () => {
      render(<CharacterSummary character={mockCharacter} />);
      
      const portrait = screen.getByRole('img', { name: 'Aldric the Bold' });
      expect(portrait).toBeInTheDocument();
    });

    it('handles missing portrait gracefully', () => {
      const characterWithoutPortrait = {
        ...mockCharacter,
        portrait: undefined
      };
      
      render(<CharacterSummary character={characterWithoutPortrait} />);
      
      // Should still render without crashing
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
    });

    it('handles placeholder portrait type', () => {
      const characterWithPlaceholder = {
        ...mockCharacter,
        portrait: { type: 'placeholder' as const, url: null }
      };
      
      render(<CharacterSummary character={characterWithPlaceholder} />);
      
      // Should still render without crashing
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
    });
  });

  describe('Missing Data Handling', () => {
    it('handles missing description gracefully', () => {
      const characterWithoutDescription = {
        ...mockCharacter,
        description: undefined
      };
      
      render(<CharacterSummary character={characterWithoutDescription} />);
      
      // Should still render name and other available info
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
    });

    it('handles missing background gracefully', () => {
      const characterWithoutBackground = {
        ...mockCharacter,
        background: undefined
      };
      
      render(<CharacterSummary character={characterWithoutBackground} />);
      
      // Should still render other information
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
      expect(screen.getByText('A brave knight with unwavering loyalty')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders with appropriate container structure', () => {
      const { container } = render(<CharacterSummary character={mockCharacter} />);
      
      const summaryElement = container.querySelector('[data-testid="character-summary"]');
      expect(summaryElement).toBeInTheDocument();
    });

    it('applies proper accessibility attributes', () => {
      render(<CharacterSummary character={mockCharacter} />);
      
      const summaryRegion = screen.getByRole('region', { name: /character information/i });
      expect(summaryRegion).toBeInTheDocument();
    });
  });
});