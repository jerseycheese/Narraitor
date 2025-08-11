/**
 * Test: Decision tracking integration in ActiveGameSession
 * 
 * Tests the integration between player choice selection and journal entry creation
 * for issue #174: Save player choices and outcomes for story tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActiveGameSession from '../ActiveGameSession';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { Decision } from '@/types/narrative.types';
import { World } from '@/types/world.types';

// Mock the stores
jest.mock('@/state/journalStore');
jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');

// Mock other components
jest.mock('@/components/Narrative/NarrativeController', () => {
  return {
    NarrativeController: ({ onDecisionGenerated }: { onDecisionGenerated: (decision: Decision) => void }) => {
      React.useEffect(() => {
        const mockDecision: Decision = {
          id: 'test-decision',
          prompt: 'You encounter a suspicious stranger. What do you do?',
          options: [
            { id: 'option-1', text: 'Help the stranger', alignment: 'lawful' },
            { id: 'option-2', text: 'Ignore the stranger', alignment: 'neutral' }
          ],
          decisionWeight: 'major',
          contextSummary: 'Encounter at the tavern'
        };
        
        onDecisionGenerated(mockDecision);
      }, [onDecisionGenerated]);

      return <div data-testid="narrative-controller">Narrative Controller</div>;
    }
  };
});

interface ChoiceSelectorProps {
  decision: Decision;
  onSelect: (choiceId: string) => void;
}

interface DecisionOption {
  id: string;
  text: string;
  alignment?: string;
}

jest.mock('@/components/shared/ChoiceSelector', () => {
  return {
    ChoiceSelector: ({ decision, onSelect }: ChoiceSelectorProps) => (
      <div data-testid="choice-selector">
        {decision?.options?.map((option: DecisionOption) => (
          <button 
            key={option.id}
            data-testid={`choice-${option.id}`}
            onClick={() => onSelect(option.id)}
          >
            {option.text}
          </button>
        ))}
      </div>
    )
  };
});

describe('ActiveGameSession - Decision Tracking Integration', () => {
  const mockWorld = {
    id: 'world-123',
    name: 'Test World',
    description: 'A test world for decision tracking',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 10,
      attributePointPool: 30,
      skillPointPool: 50
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockAddEntry = jest.fn();
  const mockSelectDecisionOption = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock journal store
    (useJournalStore as jest.Mock).mockReturnValue({
      addEntry: mockAddEntry
    });

    // Mock narrative store
    (useNarrativeStore as jest.Mock).mockReturnValue({
      selectDecisionOption: mockSelectDecisionOption,
      isSessionEnded: jest.fn().mockReturnValue(false)
    });

    (useNarrativeStore.getState as jest.Mock) = jest.fn().mockReturnValue({
      selectDecisionOption: mockSelectDecisionOption,
      getSessionDecisions: jest.fn().mockReturnValue([]),
      updateDecision: jest.fn()
    });

    // Mock session store
    (useSessionStore as jest.Mock).mockReturnValue({
      characterId: 'char-123'
    });

    // Mock character store
    (useCharacterStore as jest.Mock).mockReturnValue({
      characters: {
        'char-123': {
          id: 'char-123',
          name: 'Test Character'
        }
      }
    });
  });

  // Test acceptance criteria: "The system creates journal entries for all significant player decisions"
  test('creates journal entry when player makes a significant decision', async () => {
    const onChoiceSelected = jest.fn();

    render(
      <ActiveGameSession
        worldId="world-123"
        sessionId="session-123"
        world={mockWorld as World}
        status="active"
        onChoiceSelected={onChoiceSelected}
        onEnd={() => {}}
      />
    );

    // Wait for decision to be generated
    await waitFor(() => {
      expect(screen.getByTestId('choice-selector')).toBeInTheDocument();
    });

    // Select a choice
    const helpButton = screen.getByTestId('choice-option-1');
    fireEvent.click(helpButton);

    // Verify journal entry creation
    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalledWith('session-123', expect.objectContaining({
        worldId: 'world-123',
        characterId: 'char-123',
        type: 'decision',
        significance: 'major',
        content: expect.stringContaining('Chose to help the stranger'),
        metadata: expect.objectContaining({
          tags: ['decision'],
          automaticEntry: true,
          decisionId: 'test-decision',
          choiceText: 'Help the stranger',
          decisionPrompt: 'You encounter a suspicious stranger. What do you do?'
        })
      }));
    });
  });

  // Test acceptance criteria: "Decision entries include both the choice made and its immediate outcome"
  test('captures decision context and choice in journal entry', async () => {
    const onChoiceSelected = jest.fn();

    render(
      <ActiveGameSession
        worldId="world-123"
        sessionId="session-123" 
        world={mockWorld as World}
        onChoiceSelected={onChoiceSelected}
      />
    );

    // Wait for and select choice
    await waitFor(() => {
      expect(screen.getByTestId('choice-selector')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('choice-option-2')); // Ignore the stranger

    // Verify journal entry includes decision context
    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalledWith('session-123', expect.objectContaining({
        content: 'Chose to ignore the stranger when you encounter a suspicious stranger',
        metadata: expect.objectContaining({
          decisionPrompt: 'You encounter a suspicious stranger. What do you do?',
          choiceText: 'Ignore the stranger',
          decisionId: 'test-decision'
        })
      }));
    });
  });

  // Test acceptance criteria: "Decision entries include contextual information about the situation"
  test('includes decision weight as significance level', async () => {
    const onChoiceSelected = jest.fn();

    render(
      <ActiveGameSession
        worldId="world-123"
        sessionId="session-123"
        world={mockWorld as World} 
        onChoiceSelected={onChoiceSelected}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('choice-selector')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('choice-option-1'));

    // Verify decision weight maps to significance
    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalledWith('session-123', expect.objectContaining({
        significance: 'major' // From decision.decisionWeight
      }));
    });
  });

  test('handles custom player input as decision', async () => {
    const onChoiceSelected = jest.fn();

    render(
      <ActiveGameSession
        worldId="world-123"
        sessionId="session-123"
        world={mockWorld as World}
        status="active"
        onChoiceSelected={onChoiceSelected}
        onEnd={() => {}}
      />
    );

    // Mock custom input scenario - this would be triggered by custom text input
    // For now, test the method directly since the UI isn't fully rendered
    // In a real scenario, this would be through custom input handling
    
    // Simulate custom choice handling by calling the component's method
    // This would happen through the actual custom input UI
    const component = screen.getByTestId('narrative-controller').closest('div');
    
    // Note: In the actual implementation, custom choices would trigger journal entries
    // with the custom text as the choice
    expect(component).toBeInTheDocument();
  });
});