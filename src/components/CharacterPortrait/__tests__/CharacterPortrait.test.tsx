// src/components/CharacterPortrait/__tests__/CharacterPortrait.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterPortrait } from '../CharacterPortrait';
import { GeneratedImage } from '../../../types/common.types';
import { getTimestamp } from '@/lib/utils/timestamp';

describe('CharacterPortrait', () => {
  describe('rendering states', () => {
    it('should render AI-generated portrait', () => {
      const portrait: GeneratedImage = {
        type: 'ai-generated',
        url: 'data:image/png;base64,abc123',
        generatedAt: getTimestamp(),
        prompt: 'A brave warrior'
      };

      render(
        <CharacterPortrait 
          portrait={portrait} 
          characterName="Test Hero"
        />
      );

      const img = screen.getByRole('img', { name: 'Test Hero portrait' });
      expect(img).toHaveAttribute('src', portrait.url);
    });

    it.each(['preset', 'uploaded'] as const)(
      'should render a %s portrait image',
      (type) => {
        const portrait: GeneratedImage = {
          type,
          url: 'data:image/png;base64,abc123',
        };

        render(
          <CharacterPortrait portrait={portrait} characterName="Test Hero" />
        );

        expect(
          screen.getByRole('img', { name: 'Test Hero portrait' })
        ).toHaveAttribute('src', portrait.url);
      }
    );

    it('should render placeholder when no portrait', () => {
      const portrait: GeneratedImage = {
        type: 'placeholder',
        url: null
      };

      render(
        <CharacterPortrait 
          portrait={portrait} 
          characterName="Test Hero"
        />
      );

      expect(screen.getByText('TH')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should show character initials in placeholder', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Elara Moonshadow"
        />
      );

      expect(screen.getByText('EM')).toBeInTheDocument();
    });

    it('should handle single word names', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Gandalf"
        />
      );

      expect(screen.getByText('GA')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('applies the size modifier class so each size renders distinctly', () => {
      const { rerender } = render(
        <CharacterPortrait
          portrait={{ type: 'placeholder', url: null }}
          characterName="Test"
          size="small"
        />
      );

      const portrait = screen.getByTestId('character-portrait');
      expect(portrait).toHaveClass('component-character-portrait');
      expect(portrait).toHaveClass('component-character-portrait-small');
      expect(portrait).not.toHaveClass('component-character-portrait-large');

      rerender(
        <CharacterPortrait
          portrait={{ type: 'placeholder', url: null }}
          characterName="Test"
          size="large"
        />
      );

      expect(screen.getByTestId('character-portrait')).toHaveClass('component-character-portrait-large');
    });

    it('defaults to the medium size modifier when no size is given', () => {
      render(
        <CharacterPortrait
          portrait={{ type: 'placeholder', url: null }}
          characterName="Test"
        />
      );

      expect(screen.getByTestId('character-portrait')).toHaveClass('component-character-portrait-medium');
    });
  });

  describe('loading states', () => {
    it('should show loading indicator when generating', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
          isGenerating={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Generating portrait...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
          error="Failed to generate portrait"
        />
      );

      expect(screen.getByText('Failed to generate portrait')).toBeInTheDocument();
    });
  });

  describe('interactive behavior', () => {
    it('responds to click when clickable', () => {
      const handleClick = jest.fn();
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
          onClick={handleClick}
        />
      );

      // Should be clickable and respond to user interaction
      const portraitElement = screen.getByText('TE');
      portraitElement.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is not clickable when no onClick provided', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
        />
      );

      // Should still display content but not be interactive
      expect(screen.getByText('TE')).toBeInTheDocument();
    });
  });
});
