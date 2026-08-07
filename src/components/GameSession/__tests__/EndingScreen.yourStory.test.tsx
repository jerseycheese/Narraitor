import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EndingScreen } from '../EndingScreen';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useRouter } from 'next/navigation';
import { StoryCheckpoint } from '@/types/world-state.types';
import { StoryEnding } from '@/types/narrative.types';
import { generateEndingImage as requestEndingImage } from '@/lib/api/endingImageApi';

jest.mock('next/navigation');
jest.mock('@/state/narrativeStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/sessionStore');
jest.mock('@/lib/api/endingImageApi');

const mockRequestEndingImage = requestEndingImage as jest.MockedFunction<typeof requestEndingImage>;

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

const setupStores = (checkpoints: StoryCheckpoint[] = [], ending: StoryEnding = mockEnding) => {
  mockUseRouter.mockReturnValue({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  } as ReturnType<typeof useRouter>);

  mockUseNarrativeStore.mockReturnValue({
    currentEnding: ending,
    isGeneratingEnding: false,
    endingError: null,
    getSessionSegments: jest.fn(() => []),
    updateCurrentEnding: jest.fn(),
    clearEnding: jest.fn(),
    clearSessionSegments: jest.fn(),
    clearSessionDecisions: jest.fn(),
  } as ReturnType<typeof useNarrativeStore>);

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
  } as ReturnType<typeof useCharacterStore>);

  mockUseSessionStore.mockReturnValue({
    endSession: jest.fn(),
  } as ReturnType<typeof useSessionStore>);

  // Mock useWorldStore with both functional and object return patterns
  mockUseWorldStore.mockImplementation((selector: unknown) => {
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

// The ending image is decorative and should never auto-fire an AI call on
// mount — only a player clicking a manual trigger requests it.
describe('EndingScreen - Ending image is manually triggered', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestEndingImage.mockResolvedValue({ imageUrl: 'https://example.com/ending.png' });
  });

  it('does not request an ending image on mount', () => {
    setupStores([]);
    render(<EndingScreen />);

    expect(mockRequestEndingImage).not.toHaveBeenCalled();
  });

  it('requests an ending image when the placeholder button is clicked', async () => {
    setupStores([]);
    render(<EndingScreen />);

    fireEvent.click(screen.getByRole('button', { name: /generate ending image/i }));

    await waitFor(() => expect(mockRequestEndingImage).toHaveBeenCalledTimes(1));
  });
});

// The page-level h1 belongs to the play route, so the ending screen itself
// must only contribute subordinate headings (#1532).
describe('EndingScreen - Heading hierarchy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders The End as an h2 with no h1 of its own (placeholder hero)', () => {
    setupStores([]);
    render(<EndingScreen />);

    expect(screen.getByRole('heading', { level: 2, name: 'The End' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('keeps The End subordinate when the ending image renders', () => {
    setupStores([], { ...mockEnding, imageUrl: 'data:image/png;base64,abc' });
    render(<EndingScreen />);

    expect(screen.getByRole('heading', { level: 2, name: 'The End' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('does not render a redundant visible "Story Complete" announcement (#1577)', () => {
    setupStores([]);
    render(<EndingScreen />);

    expect(screen.queryByText(/Story Complete/i)).not.toBeInTheDocument();
  });
});

// The unclassed wrapper div previously grouping Character Legacy and
// Achievements broke the parent flex `gap` between them (#1577) — the fix
// is structural (no wrapper), so the regression guard is structural too.
describe('EndingScreen - Legacy/Achievements layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Character Legacy and Achievements as direct siblings under the flex content container', () => {
    setupStores([]);
    render(<EndingScreen />);

    // SectionWrapper renders its own inner <section class="component-section-wrapper">;
    // EndingScreen wraps each in a second, outer <section> with no class of its own.
    // The bug was an extra <div> around that outer pair, so what matters here is
    // that pair's shared parent, not the inner SectionWrapper markup.
    const legacyOuterSection = screen.getByText('Character Legacy').closest('section')
      ?.parentElement;
    const achievementsOuterSection = screen.getByText('Achievements').closest('section')
      ?.parentElement;

    expect(legacyOuterSection?.tagName).toBe('SECTION');
    expect(achievementsOuterSection?.tagName).toBe('SECTION');
    expect(legacyOuterSection?.parentElement).toBe(achievementsOuterSection?.parentElement);
    expect(legacyOuterSection?.parentElement).toHaveClass('component-ending-screen-content');
  });
});
