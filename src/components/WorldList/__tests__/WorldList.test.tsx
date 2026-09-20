import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldList from '../WorldList';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: jest.fn((selector) =>
    selector ? selector({ characters: {} }) : { characters: {} }
  ),
}));

jest.mock('@/components/WorldCard/WorldCard', () => ({
  __esModule: true,
  default: ({ world }: { world: { id: string; name: string } }) => (
    <div data-testid={`world-card-${world.id}`}>{world.name}</div>
  ),
}));

describe('WorldList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders empty state message and Create World button when no worlds exist', () => {
      render(<WorldList worlds={[]} onDeleteWorld={jest.fn()} />);

      expect(screen.getByTestId('world-list-empty-message')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: 'Every story starts with a world.' })
      ).toBeInTheDocument();

      const createButton = screen.getByRole('button', { name: 'Create World' });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveClass('button-default');
    });

    it('navigates to /worlds/create when Create World button is clicked', () => {
      render(<WorldList worlds={[]} onDeleteWorld={jest.fn()} />);

      const createButton = screen.getByRole('button', { name: 'Create World' });
      fireEvent.click(createButton);

      expect(mockRouterPush).toHaveBeenCalledWith('/worlds/create');
    });

    it('calls onCreateWorld callback if provided', () => {
      const mockOnCreateWorld = jest.fn();
      render(
        <WorldList
          worlds={[]}
          onDeleteWorld={jest.fn()}
          onCreateWorld={mockOnCreateWorld}
        />
      );

      const createButton = screen.getByRole('button', { name: 'Create World' });
      fireEvent.click(createButton);

      expect(mockOnCreateWorld).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('populated state', () => {
    it('renders list of worlds when worlds exist', () => {
      const worlds = [
        createMockWorld({ id: 'w1', name: 'Aethelgard' }),
        createMockWorld({ id: 'w2', name: 'Neo-Veridia' }),
      ];

      render(<WorldList worlds={worlds} onDeleteWorld={jest.fn()} />);

      expect(screen.queryByTestId('world-list-empty-message')).not.toBeInTheDocument();
      expect(screen.getByTestId('world-list-container')).toBeInTheDocument();
      expect(screen.getByTestId('world-card-w1')).toHaveTextContent('Aethelgard');
      expect(screen.getByTestId('world-card-w2')).toHaveTextContent('Neo-Veridia');
    });

    it('sorts active/current world to the top', () => {
      const worlds = [
        createMockWorld({ id: 'w1', name: 'First' }),
        createMockWorld({ id: 'w2', name: 'Second (Active)' }),
      ];

      render(
        <WorldList
          worlds={worlds}
          currentWorldId="w2"
          onDeleteWorld={jest.fn()}
        />
      );

      const cards = screen.getAllByTestId(/^world-card-/);
      expect(cards[0]).toHaveTextContent('Second (Active)');
      expect(cards[1]).toHaveTextContent('First');
    });
  });
});
