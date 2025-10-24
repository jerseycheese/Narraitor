import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DescriptionStep from './DescriptionStep';
import type { World } from '@/types/world.types';
import type { AttributeSuggestion, SkillSuggestion } from '@/types/ai-suggestions.types';

const baseWorldData: Partial<World> = {
  genre: 'fantasy',
  description: '',
};

const mockOnUpdate = jest.fn();
const mockOnGenerate = jest.fn().mockResolvedValue(undefined);

const buildSuggestions = (): {
  attributes: AttributeSuggestion[];
  skills: SkillSuggestion[];
} => ({
  attributes: [
    {
      name: 'Arcane Resonance',
      description: 'Attunement to ley-line magic',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
      category: 'Magical',
      accepted: true,
    },
    {
      name: 'Gryphon Bond',
      description: 'Connection to aerial companions',
      minValue: 1,
      maxValue: 10,
      baseValue: 5,
      accepted: true,
    },
  ],
  skills: [
    {
      name: 'Spellweaving',
      description: 'Craft spells on the fly',
      difficulty: 'medium',
      category: 'Magic',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      accepted: true,
    },
    {
      name: 'Beast Diplomacy',
      description: 'Negotiate with fantastical creatures',
      difficulty: 'easy',
      category: 'Social',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      accepted: true,
    },
  ],
});

describe('DescriptionStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders genre-based guidance content', () => {
    render(
      <DescriptionStep
        worldData={baseWorldData}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onGenerateSuggestions={mockOnGenerate}
      />
    );

    expect(screen.getByText(/floating citadels circle a wounded sun/i)).toBeInTheDocument();
    expect(screen.getByText(/attribute prompts/i)).toBeInTheDocument();
    expect(screen.getByText(/skill prompts/i)).toBeInTheDocument();
  });

  it('disables suggestion generation until description is long enough', async () => {
    render(
      <DescriptionStep
        worldData={{ ...baseWorldData, description: 'Too short' }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onGenerateSuggestions={mockOnGenerate}
      />
    );

    const button = screen.getByRole('button', { name: /generate suggestions/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Add at least 50 characters/i)).toBeInTheDocument();

    const textarea = screen.getByTestId('world-full-description');
    const newDescription = 'This is now a much longer description that should satisfy the requirement for AI analysis.';
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newDescription);

    expect(button).toBeDisabled();
  });

  it('shows preview cards when AI suggestions exist', () => {
    const suggestions = buildSuggestions();

    render(
      <DescriptionStep
        worldData={{ ...baseWorldData, description: 'A long enough description for the AI.' }}
        errors={{}}
        isProcessing={false}
        aiSuggestions={suggestions}
        suggestionMeta={{
          source: 'ai',
          generatedAt: '2025-10-01T12:00:00.000Z',
          descriptionSnapshot: 'A long enough description for the AI.',
        }}
        onUpdate={mockOnUpdate}
        onGenerateSuggestions={mockOnGenerate}
      />
    );

    const preview = screen.getByTestId('ai-suggestion-preview');
    expect(within(preview).getByText('Arcane Resonance')).toBeInTheDocument();
    expect(within(preview).getByText('Spellweaving')).toBeInTheDocument();
  });

  it('notifies when the description changed after generating suggestions', () => {
    const suggestions = buildSuggestions();

    render(
      <DescriptionStep
        worldData={{ ...baseWorldData, description: 'Updated world description that is different.' }}
        errors={{}}
        isProcessing={false}
        aiSuggestions={suggestions}
        suggestionMeta={{
          source: 'ai',
          generatedAt: '2025-10-01T12:00:00.000Z',
          descriptionSnapshot: 'Original description snapshot',
        }}
        onUpdate={mockOnUpdate}
        onGenerateSuggestions={mockOnGenerate}
      />
    );

    expect(screen.getByText(/description has changed/i)).toBeInTheDocument();
  });
});
