import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterSummary from '../CharacterSummary';
import { getTimestamp } from '@/lib/utils/timestamp';

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
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    portrait: {
      type: 'ai-generated',
      url: 'https://example.com/portrait.jpg'
    }
  };

  describe('Core Functionality', () => {
    it('renders the character identity: name, level, and portrait', () => {
      render(<CharacterSummary character={mockCharacter} />);

      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /Aldric the Bold/i })).toBeInTheDocument();
    });

    it('expands the details on request and collapses them again', async () => {
      const user = userEvent.setup();
      render(<CharacterSummary character={mockCharacter} />);

      const history = 'Raised in a noble family, trained in the art of combat since childhood';
      const toggle = screen.getByRole('button', { name: /show details/i });

      expect(screen.queryByText(history)).not.toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggle);

      expect(screen.getByText(history)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide details/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      );

      await user.click(screen.getByRole('button', { name: /hide details/i }));

      expect(screen.queryByText(history)).not.toBeInTheDocument();
    });
  });

  describe('Portrait Handling', () => {
    it('drops the portrait block entirely when the character has none', () => {
      const { container } = render(
        <CharacterSummary character={{ ...mockCharacter, portrait: undefined }} />
      );

      expect(container.querySelector('.manuscript-character-summary-portrait')).toBeNull();
      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
    });

    it('keeps the portrait block for a placeholder portrait', () => {
      const { container } = render(
        <CharacterSummary
          character={{ ...mockCharacter, portrait: { type: 'placeholder' as const, url: null } }}
        />
      );

      expect(container.querySelector('.manuscript-character-summary-portrait')).not.toBeNull();
    });
  });

  describe('Missing Data Handling', () => {
    it('omits the history paragraph when the character has no history', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CharacterSummary
          character={{
            ...mockCharacter,
            background: { ...mockCharacter.background, history: '' },
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: /show details/i }));

      expect(container.querySelector('.manuscript-character-summary-history')).toBeNull();
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

      expect(screen.getByText('Aldric the Bold')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
      expect(screen.queryByText('Raised in a noble family, trained in the art of combat since childhood')).not.toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('exposes the summary as a labelled region', () => {
      const { container } = render(<CharacterSummary character={mockCharacter} />);

      const region = screen.getByRole('region', { name: /character information/i });
      expect(region).toBe(container.querySelector('[data-testid="character-summary"]'));
    });
  });
});
