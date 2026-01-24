import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickStartStep from './QuickStartStep';
import { World } from '@/types/world.types';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');

jest.mock('@/components/QuickStartCharacters/QuickStartCharacters', () => ({
  QuickStartCharacters: ({ onCharacterSelect, onCustomizeClick }: any) => (
    <div data-testid="quick-start-characters">
      <button onClick={() => onCharacterSelect({
        name: 'Test Archetype',
        description: 'Test Desc',
        id: 'test-arch',
        level: 1,
        attributes: [],
        skills: [],
        background: {
            description: '',
            personality: '',
            motivation: '',
            fears: '',
            physicalDescription: '',
        }
      })}>
        Select Archetype
      </button>
      <button onClick={onCustomizeClick}>
        Customize Character
      </button>
    </div>
  ),
}));

describe('QuickStartStep Tutorial Completion', () => {
  const mockWorld: World = {
    id: 'world-1',
    name: 'Test World',
    description: 'Test Desc',
    genres: ['fantasy'],
    settings: {},
    createdAt: '',
    updatedAt: '',
  } as any;

  const mockOnBack = jest.fn();
  const mockOnComplete = jest.fn();
  const mockOnCustomizeCharacter = jest.fn();
  const mockRouterPush = jest.fn();
  const mockCompleteTutorialPhase = jest.fn();
  const mockShouldShowTutorialPhase = jest.fn();
  const mockInitializeSession = jest.fn();
  const mockCreateCharacter = jest.fn();
  const mockSetCurrentCharacter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });

    // Setup Session Store Mock
    const mockSessionState = {
        initializeSession: mockInitializeSession,
        completeTutorialPhase: mockCompleteTutorialPhase,
        shouldShowTutorialPhase: mockShouldShowTutorialPhase,
    };

    (useSessionStore as unknown as jest.Mock).mockImplementation((selector: any) => {
        return selector(mockSessionState);
    });
    
    // Add getState to the mock
    (useSessionStore as any).getState = jest.fn().mockReturnValue(mockSessionState);


    // Setup Character Store Mock
    const mockCharacterState = {
         createCharacter: mockCreateCharacter,
         setCurrentCharacter: mockSetCurrentCharacter,
         characters: {}
    };

    (useCharacterStore as unknown as jest.Mock).mockImplementation((selector: any) => {
         return selector(mockCharacterState);
    });
    
     (useCharacterStore as any).getState = jest.fn().mockReturnValue(mockCharacterState);

    // Default: tutorial phase should be shown
    mockShouldShowTutorialPhase.mockReturnValue(true);
  });

  test('calls completeTutorialPhase("worldCreation") when "Skip Character Creation" is clicked', () => {
    render(
      <QuickStartStep
        world={mockWorld}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
        onCustomizeCharacter={mockOnCustomizeCharacter}
      />
    );

    fireEvent.click(screen.getByText('Skip Character Creation for Now'));

    expect(mockCompleteTutorialPhase).toHaveBeenCalledWith('worldCreation');
    expect(mockOnComplete).toHaveBeenCalled();
  });

  test('calls completeTutorialPhase("worldCreation") when "Customize Character" is clicked', () => {
    render(
      <QuickStartStep
        world={mockWorld}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
        onCustomizeCharacter={mockOnCustomizeCharacter}
      />
    );

    fireEvent.click(screen.getByText('Customize Character'));

    expect(mockCompleteTutorialPhase).toHaveBeenCalledWith('worldCreation');
    expect(mockOnCustomizeCharacter).toHaveBeenCalled();
  });

  test('calls completeTutorialPhase("worldCreation") when an archetype is selected', async () => {
    mockInitializeSession.mockImplementation((wId, cId, cb) => cb && cb());

    render(
      <QuickStartStep
        world={mockWorld}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
        onCustomizeCharacter={mockOnCustomizeCharacter}
      />
    );

    fireEvent.click(screen.getByText('Select Archetype'));

    await waitFor(() => {
        expect(mockInitializeSession).toHaveBeenCalled();
    });

    expect(mockCompleteTutorialPhase).toHaveBeenCalledWith('worldCreation');
    expect(mockRouterPush).toHaveBeenCalledWith('/play');
  });

   test('does NOT call completeTutorialPhase("worldCreation") if shouldShowTutorialPhase returns false', () => {
    mockShouldShowTutorialPhase.mockReturnValue(false);

    render(
      <QuickStartStep
        world={mockWorld}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
        onCustomizeCharacter={mockOnCustomizeCharacter}
      />
    );

    fireEvent.click(screen.getByText('Skip Character Creation for Now'));

    expect(mockCompleteTutorialPhase).not.toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
