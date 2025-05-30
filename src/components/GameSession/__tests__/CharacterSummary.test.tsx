import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterSummary from '../CharacterSummary';

// Define the Character type as used in characterStore
interface Character {
  id: string;
  name: string;
  worldId: string;
  level: number;
  background: {
    history: string;
    personality: string;
    goals: string[];
    fears: string[];
    physicalDescription?: string;
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

describe('CharacterSummary', () => {
  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Aldric the Bold',
    background: {
      history: 'Raised in a noble family, trained in the art of combat since childhood',
      personality: 'A brave knight with unwavering loyalty',
      goals: ['Protect the innocent'],
      fears: ['Failing in battle']
    },
    worldId: 'world-1',
    level: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    portrait: {
      type: 'ai-generated',
      url: 'https://example.com/portrait.jpg'
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
      
      const portrait = screen.getByRole('img', { name: /Aldric the Bold/i });
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
    it('handles missing personality gracefully', () => {
      const characterWithoutPersonality = {
        ...mockCharacter,
        background: {
          ...mockCharacter.background,
          personality: ''
        }
      };
      
      render(<CharacterSummary character={characterWithoutPersonality} />);
      
      // Should still render name and other available info
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
    });

    it('handles missing background gracefully', () => {
      const characterWithoutBackground = {
        ...mockCharacter,
        background: {
          history: '',
          personality: '',
          goals: [],
          fears: []
        }
      };
      
      render(<CharacterSummary character={characterWithoutBackground} />);
      
      // Should still render name and level but not background info
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
      // Should not show empty background content
      expect(screen.queryByText('A brave knight with unwavering loyalty')).not.toBeInTheDocument();
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