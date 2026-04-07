import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { getTimestamp } from '@/lib/utils/timestamp';
import { useNPCStore } from '@/state/npcStore';
import { useLoreStore } from '@/state/loreStore';
import { NPC } from '@/types/npc.types';
import { mockZustandStore, createMockNPCStore, createMockNarrativeSegment } from '@/lib/test-utils';

jest.mock('@/state/npcStore');
jest.mock('@/state/loreStore');

const mockGetFacts = jest.fn().mockReturnValue([]);
(useLoreStore as unknown as jest.Mock).mockImplementation(
  (selector: (state: { getFacts: typeof mockGetFacts }) => unknown) =>
    selector({ getFacts: mockGetFacts })
);

describe('NarrativeDisplay', () => {
  beforeEach(() => {
    mockGetFacts.mockReturnValue([]);
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

  it('handles malformed NPC IDs without crashing', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-malformed',
      content: 'An unnamed figure watches from afar.',
      type: 'scene',
      metadata: {
        characterIds: ['', '', 'npc-42'],
        tags: [],
      },
    });

    expect(() => {
      render(<NarrativeDisplay segment={segment} />);
    }).not.toThrow();
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
    const highlighted = content.querySelectorAll('span.narrative-highlight');
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

  describe('marginalia term definitions', () => {
    const loreFacts = [
      {
        id: 'fact-1',
        key: 'world-test-1:character_aria',
        value: 'Aria',
        category: 'characters' as const,
        source: 'narrative' as const,
        worldId: 'world-test-1',
        aliases: [],
        visibility: 'world-shared' as const,
        metadata: {
          description: 'A powerful mage from the Northern Tower.',
          type: 'protagonist',
          importance: 'high' as const,
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    it('renders term definition buttons when lore facts exist', () => {
      mockGetFacts.mockReturnValue(loreFacts);

      const segment = createMockNarrativeSegment({
        id: 'seg-marginalia',
        content: 'Aria stepped into the moonlit glade.',
        type: 'scene',
        worldId: 'world-test-1',
        sessionId: 'session-test-1',
        metadata: { characterIds: [], mood: 'neutral', tags: [] },
      });

      render(<NarrativeDisplay segment={segment} />);

      const buttons = screen.getAllByRole('button', { name: /Aria/i });
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0]).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('shows term definition on click and dismisses on Escape', () => {
      mockGetFacts.mockReturnValue(loreFacts);

      const segment = createMockNarrativeSegment({
        id: 'seg-marginalia-2',
        content: 'Aria raised her staff.',
        type: 'scene',
        worldId: 'world-test-1',
        sessionId: 'session-test-1',
        metadata: { characterIds: [], mood: 'neutral', tags: [] },
      });

      render(<NarrativeDisplay segment={segment} />);

      const termButton = screen.getAllByRole('button', { name: /Aria/i })[0];
      fireEvent.click(termButton);

      // Definition panel should appear
      const definition = screen.getByRole('complementary');
      expect(definition).toHaveAttribute('aria-label', 'Definition: Aria');
      expect(screen.getByText('A powerful mage from the Northern Tower.')).toBeInTheDocument();

      // Escape should dismiss
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });
});
