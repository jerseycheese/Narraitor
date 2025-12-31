import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { getTimestamp } from '@/lib/utils/timestamp';
import { useNPCStore } from '@/state/npcStore';
import { NPC } from '@/types/npc.types';
import { mockZustandStore, createMockNPCStore, createMockNarrativeSegment } from '@/lib/test-utils';

jest.mock('@/state/npcStore');

describe('NarrativeDisplay', () => {
  beforeEach(() => {
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs: {},
    }));
  });

  it('displays narrative content appropriately', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-1',
      content: 'The ancient forest whispered secrets in the moonlight.',
      type: 'scene',
      metadata: {
        characterIds: [],
        mood: 'mysterious',
        location: 'Dark Forest',
        tags: ['forest', 'night']
      }
    });

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getByText(/ancient forest whispered secrets/)).toBeInTheDocument();
  });

  it('renders character avatars for metadata characterIds', () => {
    const now = getTimestamp();
    const npcs = {
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
    };

    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs,
      worldNpcs: {
        'world-1': ['npc-1', 'npc-2'],
      },
      getById: jest.fn((id) => npcs[id as keyof typeof npcs]),
      getAll: jest.fn(() => Object.values(npcs)),
      getNPCsByWorld: jest.fn((worldId) => {
        const ids = worldId === 'world-1' ? ['npc-1', 'npc-2'] : [];
        return ids.map((id) => npcs[id as keyof typeof npcs]).filter(Boolean) as NPC[];
      }),
    }));

    const segment = createMockNarrativeSegment({
      id: 'seg-characters',
      content: 'Eldria and Borin planned their next move.',
      type: 'scene',
      metadata: {
        characterIds: ['npc-1', 'npc-2'],
        tags: ['strategy'],
      },
    });

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getByRole('list', { name: /characters present/i })).toBeInTheDocument();
    expect(screen.getByText('Eldria Sunshadow')).toBeInTheDocument();
    expect(screen.getAllByText('Borin Ironfist')[0]).toBeInTheDocument();
    expect(screen.getByAltText('Eldria Sunshadow')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Borin Ironfist' })).toBeInTheDocument();
  });

  it('deduplicates character identifiers with inconsistent casing and whitespace', () => {
    const now = getTimestamp();
    const npcs = {
      'npc-1': {
        id: 'npc-1',
        name: 'Marge, the Waitress',
        worldId: 'world-1',
        createdAt: now,
        updatedAt: now,
        description: 'A friendly waitress.',
      },
    };

    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs,
      worldNpcs: {
        'world-1': ['npc-1'],
      },
      getById: jest.fn((id) => npcs[id as keyof typeof npcs]),
      getAll: jest.fn(() => Object.values(npcs)),
      getNPCsByWorld: jest.fn((worldId) => {
        const ids = worldId === 'world-1' ? ['npc-1'] : [];
        return ids.map((id) => npcs[id as keyof typeof npcs]).filter(Boolean) as NPC[];
      }),
    }));

    const segment = createMockNarrativeSegment({
      id: 'seg-dup',
      content: 'Marge polishes the counter while you wait.',
      type: 'scene',
      metadata: {
        characterIds: ['npc-1', 'npc-1 ', 'NPC-1'],
        tags: ['diner'],
      },
    });

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
    const segment = createMockNarrativeSegment({
      id: 'seg-malformed',
      content: 'An unnamed figure watches from afar.',
      type: 'scene',
      metadata: {
        characterIds: ['', '   ', 'npc-42'],
        tags: [],
      },
    });

    render(<NarrativeDisplay segment={segment} />);

    expect(screen.getAllByText('NPC 42').length).toBeGreaterThan(0);
  });

  it('emphasizes participant names within the narrative text', () => {
    const now = getTimestamp();
    const npcs = {
      'npc-1': {
        id: 'npc-1',
        name: 'Marge, the Waitress',
        worldId: 'world-1',
        createdAt: now,
        updatedAt: now,
        description: 'A friendly waitress.',
      },
    };

    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs,
      worldNpcs: {
        'world-1': ['npc-1'],
      },
      getById: jest.fn((id) => npcs[id as keyof typeof npcs]),
      getAll: jest.fn(() => Object.values(npcs)),
      getNPCsByWorld: jest.fn((worldId) => {
        const ids = worldId === 'world-1' ? ['npc-1'] : [];
        return ids.map((id) => npcs[id as keyof typeof npcs]).filter(Boolean) as NPC[];
      }),
    }));

    const segment = createMockNarrativeSegment({
      id: 'seg-highlight',
      content:
        "Marge, the Waitress slides a chipped mug toward you. Moments later, Marge's voice drops to a whisper.",
      type: 'scene',
      metadata: {
        characterIds: ['npc-1'],
        mood: 'neutral',
        tags: ['diner'],
        characters: [
          {
            id: 'npc-1',
            name: 'Marge, the Waitress',
          },
        ],
      },
    });

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
    const dialogueSegment = createMockNarrativeSegment({
      id: 'seg-2',
      content: '"Hello there," said the mysterious stranger.',
      type: 'dialogue',
      metadata: {
        characterIds: ['char-1'],
        mood: 'neutral',
        tags: ['conversation']
      }
    });

    const { rerender } = render(<NarrativeDisplay segment={dialogueSegment} />);
    expect(screen.getByText(/Hello there/)).toBeInTheDocument();

    const actionSegment = createMockNarrativeSegment({
      id: 'seg-3',
      content: 'The hero leapt across the chasm.',
      type: 'action',
      metadata: {
        characterIds: ['hero'],
        mood: 'action',
        tags: ['action', 'movement']
      }
    });

    rerender(<NarrativeDisplay segment={actionSegment} />);
    expect(screen.getByText(/hero leapt across/)).toBeInTheDocument();
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
});
