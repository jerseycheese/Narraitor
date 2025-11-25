import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndingScreen } from '../EndingScreen';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useRouter } from 'next/navigation';
import { StoryCheckpoint } from '@/types/world-state.types';
import { StoryEnding } from '@/types/narrative.types';

jest.mock('next/navigation');
jest.mock('@/state/narrativeStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/sessionStore');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseNarrativeStore = useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;
const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;

const mockEnding: StoryEnding = {
  id: 'ending-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'story-complete',
  tone: 'triumphant',
  epilogue: 'Your journey has come to a glorious end.',
  characterLegacy: 'You are remembered as a great hero.',
  worldImpact: 'The world was forever changed by your actions.',
  achievements: ['First Victory', 'Legendary Hero'],
  playTime: 3600,
  timestamp: new Date('2025-11-24T10:00:00Z'),
  createdAt: '2025-11-24T10:00:00Z',
  updatedAt: '2025-11-24T10:00:00Z',
};

const setupStores = (checkpoints: StoryCheckpoint[] = []) => {
  mockUseRouter.mockReturnValue({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  } as any);

  mockUseNarrativeStore.mockReturnValue({
    currentEnding: mockEnding,
    isGeneratingEnding: false,
    endingError: null,
    getSessionSegments: jest.fn(() => []),
    updateCurrentEnding: jest.fn(),
    clearEnding: jest.fn(),
    clearSessionSegments: jest.fn(),
    clearSessionDecisions: jest.fn(),
  } as any);

  mockUseCharacterStore.mockReturnValue({
    characters: {
      'char-1': {
        id: 'char-1',
        name: 'Hero',
        worldId: 'world-1',
        createdAt: '2025-11-24T09:00:00Z',
        updatedAt: '2025-11-24T09:00:00Z',
      },
    },
  } as any);

  mockUseSessionStore.mockReturnValue({
    endSession: jest.fn(),
  } as any);

  // Mock useWorldStore with both functional and object return patterns
  mockUseWorldStore.mockImplementation((selector: any) => {
    if (typeof selector === 'function') {
      const state = {
        worlds: {
          'world-1': {
            id: 'world-1',
            name: 'Test World',
            createdAt: '2025-11-24T08:00:00Z',
            updatedAt: '2025-11-24T08:00:00Z',
          },
        },
        worldStates: {
          'world-1': {
            storyCheckpoints: checkpoints,
          },
        },
      };
      return selector(state);
    }
    return {
      worlds: {
        'world-1': {
          id: 'world-1',
          name: 'Test World',
          createdAt: '2025-11-24T08:00:00Z',
          updatedAt: '2025-11-24T08:00:00Z',
        },
      },
    };
  });
};

describe('EndingScreen - Your Story Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays empty message when no checkpoints exist', () => {
    setupStores([]);
    render(<EndingScreen />);

    const button = screen.getByTestId('collapsible-section-header');
    fireEvent.click(button);

    expect(screen.getByText(/no story checkpoints available for this session/i)).toBeInTheDocument();
  });

  it('displays checkpoint narrative from a single checkpoint', () => {
    const checkpoint: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'The hero emerged victorious from the final battle.',
      highlights: ['Final battle won'],
      eventIds: ['event-1'],
      createdAt: '2025-11-24T09:30:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    setupStores([checkpoint]);
    render(<EndingScreen />);

    const button = screen.getByTestId('collapsible-section-header');
    fireEvent.click(button);

    expect(screen.getByText(/emerged victorious from the final battle/i)).toBeInTheDocument();
  });

  it('concatenates multiple checkpoints in chronological order', () => {
    const checkpoint1: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'The journey began in a quiet village.',
      highlights: ['Journey started'],
      eventIds: ['event-1'],
      createdAt: '2025-11-24T09:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    const checkpoint2: StoryCheckpoint = {
      id: 'checkpoint-2',
      segment: 'The hero faced many trials and tribulations.',
      highlights: ['Trials faced'],
      eventIds: ['event-2'],
      createdAt: '2025-11-24T09:15:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    const checkpoint3: StoryCheckpoint = {
      id: 'checkpoint-3',
      segment: 'Victory was achieved at last.',
      highlights: ['Victory achieved'],
      eventIds: ['event-3'],
      createdAt: '2025-11-24T09:30:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    setupStores([checkpoint3, checkpoint1, checkpoint2]); // Out of order
    render(<EndingScreen />);

    const button = screen.getByTestId('collapsible-section-header');
    fireEvent.click(button);

    // Verify all segments appear
    expect(screen.getByText(/began in a quiet village/i)).toBeInTheDocument();
    expect(screen.getByText(/faced many trials and tribulations/i)).toBeInTheDocument();
    expect(screen.getByText(/victory was achieved at last/i)).toBeInTheDocument();

    // Verify chronological order by checking the container
    const content = screen.getByTestId('collapsible-section-content');
    const text = content.textContent || '';
    const beginIndex = text.indexOf('began in a quiet village');
    const trialsIndex = text.indexOf('faced many trials');
    const victoryIndex = text.indexOf('Victory was achieved');

    expect(beginIndex).toBeLessThan(trialsIndex);
    expect(trialsIndex).toBeLessThan(victoryIndex);
  });

  it('only shows checkpoints for the current session', () => {
    const currentSessionCheckpoint: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'This is from the current session.',
      highlights: [],
      eventIds: ['event-1'],
      createdAt: '2025-11-24T09:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    const otherSessionCheckpoint: StoryCheckpoint = {
      id: 'checkpoint-2',
      segment: 'This is from a different session.',
      highlights: [],
      eventIds: ['event-2'],
      createdAt: '2025-11-24T09:15:00Z',
      sessionId: 'session-2',
      metadata: {},
    };

    setupStores([currentSessionCheckpoint, otherSessionCheckpoint]);
    render(<EndingScreen />);

    const button = screen.getByTestId('collapsible-section-header');
    fireEvent.click(button);

    expect(screen.getByText(/from the current session/i)).toBeInTheDocument();
    expect(screen.queryByText(/from a different session/i)).not.toBeInTheDocument();
  });

  it('can be toggled between expanded and collapsed states', () => {
    const checkpoint: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'The story unfolds here in the ending.',
      highlights: [],
      eventIds: ['event-1'],
      createdAt: '2025-11-24T09:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    setupStores([checkpoint]);
    render(<EndingScreen />);

    // Find the Your Story section specifically
    const yourStorySection = screen.getByText('Your Story').closest('[data-testid="collapsible-section"]');
    expect(yourStorySection).toBeInTheDocument();

    const button = yourStorySection?.querySelector('[data-testid="collapsible-section-header"]') as HTMLElement;
    expect(button).toBeInTheDocument();

    // Get initial state
    const initiallyExpanded = button.getAttribute('aria-expanded') === 'true';

    // Toggle it
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', String(!initiallyExpanded));

    // Toggle back
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', String(initiallyExpanded));
  });

  it('has proper accessibility attributes', () => {
    setupStores([]);
    render(<EndingScreen />);

    const button = screen.getByTestId('collapsible-section-header');

    // Check initial ARIA attributes
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Expand and check updated ARIA attributes
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
