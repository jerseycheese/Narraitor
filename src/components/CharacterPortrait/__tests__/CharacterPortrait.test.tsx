// src/components/CharacterPortrait/__tests__/CharacterPortrait.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterPortrait } from '../CharacterPortrait';
import { CharacterPortrait as CharacterPortraitType } from '../../../types/character.types';

describe('CharacterPortrait', () => {
  describe('rendering states', () => {
    it('should render AI-generated portrait', () => {
      const portrait: CharacterPortraitType = {
        type: 'ai-generated',
        url: 'data:image/png;base64,abc123',
        generatedAt: new Date().toISOString(),
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

    it('should render placeholder when no portrait', () => {
      const portrait: CharacterPortraitType = {
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
    it('should render small size', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
          size="small"
        />
      );

      const container = screen.getByTestId('character-portrait');
      expect(container).toHaveClass('w-8', 'h-8');
    });

    it('should render medium size by default', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
        />
      );

      const container = screen.getByTestId('character-portrait');
      expect(container).toHaveClass('w-16', 'h-16');
    });

    it('should render large size', () => {
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
          size="large"
        />
      );

      const container = screen.getByTestId('character-portrait');
      expect(container).toHaveClass('w-24', 'h-24');
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

  describe('interactive states', () => {
    it('should apply hover styles when clickable', () => {
      const handleClick = jest.fn();
      render(
        <CharacterPortrait 
          portrait={{ type: 'placeholder', url: null }} 
          characterName="Test"
          onClick={handleClick}
        />
      );

      const container = screen.getByTestId('character-portrait');
      expect(container).toHaveClass('cursor-pointer');
    });
  });
});
