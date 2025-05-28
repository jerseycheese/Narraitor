import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as stories from '../ActiveGameSession.stories';
import { composeStories } from '@storybook/react';

// Compose the stories for testing
const {
  Default,
  WithExistingSegments,
  LoadingNarrative,
  LoadingChoices,
  ErrorState,
  WithCharacter,
  WithoutCharacter,
  PausedState,
  EndedState,
} = composeStories(stories);

describe('ActiveGameSession Stories', () => {
  describe('Default State', () => {
    test('renders with initial narrative generation', () => {
      render(<Default />);
      
      // Should show component structure
      expect(screen.getByTestId('active-game-session')).toBeInTheDocument();
    });
  });

  describe('With Existing Segments', () => {
    test('displays pre-populated narrative segments', () => {
      render(<WithExistingSegments />);
      
      // Should display narrative history
      expect(screen.getByText(/You stand at the entrance/)).toBeInTheDocument();
      expect(screen.getByText(/The air is thick with anticipation/)).toBeInTheDocument();
    });

    test('shows available choices', () => {
      render(<WithExistingSegments />);
      
      // Should display choice options
      expect(screen.getByText('Enter the dungeon')).toBeInTheDocument();
      expect(screen.getByText('Set up camp')).toBeInTheDocument();
      expect(screen.getByText('Return to town')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator when generating narrative', () => {
      render(<LoadingNarrative />);
      
      // Should show loading state
      expect(screen.getByText(/Generating narrative/i)).toBeInTheDocument();
    });

    test('shows loading indicator when generating choices', () => {
      render(<LoadingChoices />);
      
      // Should show choice generation loading
      expect(screen.getByText(/Generating choices/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays error message on narrative generation failure', () => {
      render(<ErrorState />);
      
      // Should show error message
      expect(screen.getByText(/Failed to generate narrative/i)).toBeInTheDocument();
    });
  });

  describe('Player Interaction', () => {
    test('handles choice selection', () => {
      const handleChoice = jest.fn();
      render(<WithExistingSegments onChoiceSelected={handleChoice} />);
      
      // Click a choice
      fireEvent.click(screen.getByText('Enter the dungeon'));
      
      // Should call the handler
      expect(handleChoice).toHaveBeenCalledWith(expect.stringContaining('choice'));
    });
  });

  describe('Character Integration', () => {
    test('displays character summary when character is present', () => {
      render(<WithCharacter />);
      
      // Should show character info
      expect(screen.getByText('Aria Starweaver')).toBeInTheDocument();
    });

    test('shows appropriate message when no character is selected', () => {
      render(<WithoutCharacter />);
      
      // Should indicate no character
      expect(screen.getByText(/No character selected/i)).toBeInTheDocument();
    });
  });

  describe('Status Variations', () => {
    test('renders paused state correctly', () => {
      render(<PausedState />);
      
      // Should show paused indicator
      expect(screen.getByText(/Session Paused/i)).toBeInTheDocument();
    });

    test('renders ended state correctly', () => {
      render(<EndedState />);
      
      // Should show ended state
      expect(screen.getByText(/Session Ended/i)).toBeInTheDocument();
    });
  });
});