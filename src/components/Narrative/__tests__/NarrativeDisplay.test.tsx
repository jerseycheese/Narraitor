import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { getTimestamp } from '@/lib/utils/timestamp';
import { useNPCStore, NPCStore } from '@/state/npcStore';
import { NPC } from '@/types/npc.types';

jest.mock('@/state/npcStore');

const mockUseNPCStore = useNPCStore as jest.MockedFunction<typeof useNPCStore>;

describe('NarrativeDisplay', () => {
  beforeEach(() => {
    const defaultState: NPCStore = {
  npcs: {},
  entities: {},
  worldNpcs: {},
  currentEntityId: null,
  error: null,
  loading: false,
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  setCurrent: jest.fn(),
  getById: jest.fn(() => undefined),
  getAll: jest.fn(() => []),
  reset: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  setLoading: jest.fn(),
  createNPC: jest.fn(),
  updateNPC: jest.fn(),
  deleteNPC: jest.fn(),
  getNPCsByWorld: jest.fn(() => []),
  clearWorldNPCs: jest.fn(),
};

    mockUseNPCStore.mockImplementation((selector?: (state: NPCStore) => unknown) =>
      selector ? selector(defaultState) : defaultState
    );
  });

  it('displays narrative content appropriately', () => {
    const segment = {
      id: 'seg-1',
      content: 'The ancient forest whispered secrets in the moonlight.',
      type: 'scene' as const,
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      metadata: {
        characterIds: [],
        mood: 'mysterious' as const,
        location: 'Dark Forest',
        tags: ['forest', 'night']
      }
    };

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getByText(/ancient forest whispered secrets/)).toBeInTheDocument();
  });

  it('renders character avatars for metadata characterIds', () => {
    const now = getTimestamp();
    const npcState: NPCStore = {
      npcs: {
        'npc-1': {
          id: 'npc-1',
          name: 'Eldria Sunshadow',
          worldId: 'world-1',
          avatarUrl: 'https://example.com/eldria.png',
          createdAt: now,
          updatedAt: now,
          description: 'A brave adventurer',
        },
        'npc-2': {
          id: 'npc-2',
          name: 'Borin Ironfist',
          worldId: 'world-1',
          createdAt: now,
          updatedAt: now,
          description: 'A gruff barkeep',
        },
      },
      entities: {},
      worldNpcs: {
        'world-1': ['npc-1', 'npc-2'],
      },
      currentEntityId: null,
      error: null,
      loading: false,
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setCurrent: jest.fn(),
      getById: jest.fn((id) => npcState.npcs[id]),
      getAll: jest.fn(() => Object.values(npcState.npcs)),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      createNPC: jest.fn(),
      updateNPC: jest.fn(),
      deleteNPC: jest.fn(),
      getNPCsByWorld: jest.fn((worldId) => {
        const ids = npcState.worldNpcs[worldId] || [];
        return ids.map((id) => npcState.npcs[id]).filter(Boolean) as NPC[];
      }),
      clearWorldNPCs: jest.fn(),
    };

    mockUseNPCStore.mockImplementation((selector?: (state: typeof npcState) => unknown) =>
      selector ? selector(npcState) : npcState
    );

    const segment = {
      id: 'seg-characters',
      content: 'Eldria and Borin planned their next move.',
      type: 'scene' as const,
      timestamp: new Date(),
      createdAt: now,
      updatedAt: now,
      metadata: {
        characterIds: ['npc-1', 'npc-2'],
        tags: ['strategy'],
      },
    };

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getByRole('list', { name: /characters present/i })).toBeInTheDocument();
    expect(screen.getByText('Eldria Sunshadow')).toBeInTheDocument();
    expect(screen.getAllByText('Borin Ironfist')[0]).toBeInTheDocument();
    expect(screen.getByAltText('Eldria Sunshadow')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Borin Ironfist' })).toBeInTheDocument();
  });

  it('deduplicates character identifiers with inconsistent casing and whitespace', () => {
    const now = getTimestamp();
    const npcState: NPCStore = {
      npcs: {
        'npc-1': {
          id: 'npc-1',
          name: 'Marge, the Waitress',
          worldId: 'world-1',
          createdAt: now,
          updatedAt: now,
          description: 'A friendly waitress.',
        },
      },
      entities: {},
      worldNpcs: {
        'world-1': ['npc-1'],
      },
      currentEntityId: null,
      error: null,
      loading: false,
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setCurrent: jest.fn(),
      getById: jest.fn((id) => npcState.npcs[id]),
      getAll: jest.fn(() => Object.values(npcState.npcs)),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      createNPC: jest.fn(),
      updateNPC: jest.fn(),
      deleteNPC: jest.fn(),
      getNPCsByWorld: jest.fn((worldId) => {
        const ids = npcState.worldNpcs[worldId] || [];
        return ids.map((id) => npcState.npcs[id]).filter(Boolean) as NPC[];
      }),
      clearWorldNPCs: jest.fn(),
    };

    mockUseNPCStore.mockImplementation((selector?: (state: typeof npcState) => unknown) =>
      selector ? selector(npcState) : npcState
    );

    const segment = {
      id: 'seg-dup',
      content: 'Marge polishes the counter while you wait.',
      type: 'scene' as const,
      timestamp: new Date(),
      createdAt: now,
      updatedAt: now,
      metadata: {
        characterIds: ['npc-1', 'npc-1 ', 'NPC-1'],
        tags: ['diner'],
      },
    };

    render(<NarrativeDisplay segment={segment} />);

    const list = screen.getByRole('list', { name: /characters present/i });
    expect(list).toBeInTheDocument();
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(
      within(items[0]).getByText((content, element) =>
        content === 'Marge, the Waitress' &&
        element?.classList.contains('text-sm') || false
      )
    ).toBeInTheDocument();
  });

  it('handles malformed NPC IDs without crashing', () => {
    const now = getTimestamp();
    const segment = {
      id: 'seg-malformed',
      content: 'An unnamed figure watches from afar.',
      type: 'scene' as const,
      timestamp: new Date(),
      createdAt: now,
      updatedAt: now,
      metadata: {
        characterIds: ['', '   ', 'npc-42'],
        tags: [],
      },
    };

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getAllByText('NPC 42').length).toBeGreaterThan(0);
  });

  it('emphasizes participant names within the narrative text', () => {
    const now = getTimestamp();
    const npcState: NPCStore = {
      npcs: {
        'npc-1': {
          id: 'npc-1',
          name: 'Marge, the Waitress',
          worldId: 'world-1',
          createdAt: now,
          updatedAt: now,
          description: 'A friendly waitress.',
        },
      },
      entities: {},
      worldNpcs: {
        'world-1': ['npc-1'],
      },
      currentEntityId: null,
      error: null,
      loading: false,
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setCurrent: jest.fn(),
      getById: jest.fn((id) => npcState.npcs[id]),
      getAll: jest.fn(() => Object.values(npcState.npcs)),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      createNPC: jest.fn(),
      updateNPC: jest.fn(),
      deleteNPC: jest.fn(),
      getNPCsByWorld: jest.fn((worldId) => {
        const ids = npcState.worldNpcs[worldId] || [];
        return ids.map((id) => npcState.npcs[id]).filter(Boolean) as NPC[];
      }),
      clearWorldNPCs: jest.fn(),
    };

    mockUseNPCStore.mockImplementation((selector?: (state: typeof npcState) => unknown) =>
      selector ? selector(npcState) : npcState
    );

    const segment = {
      id: 'seg-highlight',
      content:
        "Marge, the Waitress slides a chipped mug toward you. Moments later, Marge's voice drops to a whisper.",
      type: 'scene' as const,
      timestamp: new Date(),
      createdAt: now,
      updatedAt: now,
      metadata: {
        characterIds: ['npc-1'],
        mood: 'neutral' as const,
        tags: ['diner'],
        characters: [
          {
            id: 'npc-1',
            name: 'Marge, the Waitress',
          },
        ],
      },
    };

    render(<NarrativeDisplay segment={segment} />);

    const content = screen.getByTestId('narrative-content-container');
    const highlighted = content.querySelectorAll('span.font-semibold');
    expect(highlighted.length).toBeGreaterThan(0);
    expect(
      Array.from(highlighted).some(
        (node) => node.textContent === 'Marge, the Waitress'
      )
    ).toBe(true);
  });

  it('renders different segment types with appropriate styling', () => {
    const dialogueSegment = {
      id: 'seg-2',
      content: '"Hello there," said the mysterious stranger.',
      type: 'dialogue' as const,
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      metadata: {
        characterIds: ['char-1'],
        mood: 'neutral' as const,
        tags: ['conversation']
      }
    };

    const { rerender } = render(<NarrativeDisplay segment={dialogueSegment} />);
    expect(screen.getByText(/Hello there/)).toBeInTheDocument();

    const actionSegment = {
      id: 'seg-3',
      content: 'The hero leapt across the chasm.',
      type: 'action' as const,
      timestamp: new Date(),
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      metadata: {
        characterIds: ['hero'],
        mood: 'action' as const,
        tags: ['action', 'movement']
      }
    };

    rerender(<NarrativeDisplay segment={actionSegment} />);
    expect(screen.getByText(/hero leapt across/)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<NarrativeDisplay segment={null} isLoading={true} />);
    
    expect(screen.getByText(/Writing your story/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorMessage = 'Failed to generate narrative';
    render(<NarrativeDisplay segment={null} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows retry button when error occurs and onRetry is provided', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Unable to generate narrative. Please check your connection and try again.';
    const mockRetry = jest.fn();
    
    render(<NarrativeDisplay segment={null} error={errorMessage} onRetry={mockRetry} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    await user.click(screen.getByText('Try Again'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button when no onRetry handler is provided', () => {
    const errorMessage = 'Unable to generate narrative. Please check your connection and try again.';
    
    render(<NarrativeDisplay segment={null} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});
