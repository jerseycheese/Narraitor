import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import WorldCard from '../WorldCard';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { formatDate } from '@/lib/utils';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

beforeEach(() => {
  mockRouterPush.mockClear();
});

// Regression: a world with no image previously rendered a white 1x1 data-URI
// placeholder that showed as a bright rectangle in dark mode (#1113).
const WHITE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/awp2z0AAAAASUVORK5CYII=';

describe('WorldCard', () => {
  const mockWorld = createMockWorld({
    name: 'Fantasy Realm',
    description: 'A magical world of adventure',
    genre: 'fantasy',
  });

  // Test case for displaying world data (updated to address all acceptance criteria)
  test('displays all required world information', () => {
    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);
    
    // Verify name is displayed prominently (should be a heading)
    expect(screen.getByRole('heading', { name: mockWorld.name })).toBeInTheDocument();
    
    // Verify description is displayed
    expect(screen.getByText(mockWorld.description)).toBeInTheDocument();
    
    // Verify genre (theme) is displayed
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    
    // Verify timestamp is displayed (check for the formatted date string)
    expect(screen.getByText(`Created: ${formatDate(mockWorld.createdAt)}`)).toBeInTheDocument();
  });

  // Test case for visual presentation
  test('presents information in a clean, readable format', () => {
    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);
    
    // Verify header contains the name prominently
    const header = screen.getByRole('heading', { name: mockWorld.name });
    expect(header).toBeInTheDocument();
    
    // Verify all essential content is accessible
    expect(screen.getByText(mockWorld.description)).toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    
    // Verify timestamp information is present
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });
  
  // Test case for edge cases in data display
  test('handles missing or incomplete data gracefully', () => {
    const incompleteWorld = createMockWorld({
      description: '',
      genre: 'fantasy',
    });
    
    render(<WorldCard world={incompleteWorld} onDelete={jest.fn()} />);
    
    // Should still render the world name and not crash
    expect(screen.getByRole('heading', { name: incompleteWorld.name })).toBeInTheDocument();
    
    // Should handle empty description gracefully (may not be visible)
    expect(screen.getByText('Fantasy')).toBeInTheDocument(); // Genre should still show
  });

  // Test case for world name navigation
  test('world name links to world detail page', () => {
    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);
    
    // The name is the card's one accessible link into the world; the art link
    // beside it is hidden from assistive tech so the name isn't read twice.
    const worldTitle = screen.getByRole('heading', { name: mockWorld.name });
    expect(within(worldTitle).getByRole('link')).toHaveAttribute('href', `/worlds/${mockWorld.id}`);
    expect(screen.getAllByRole('link', { name: mockWorld.name })).toHaveLength(1);
    expect(screen.getByRole('article', { name: mockWorld.name })).toBeInTheDocument();
  });

  // With no one to play as, the primary action says so and goes to creation.
  test('sets current world and sends a world with no characters to character creation', () => {
    const setCurrentWorldSpy = jest.spyOn(
      useWorldStore.getState(),
      'setCurrentWorld'
    );

    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);

    fireEvent.click(
      screen.getByRole('button', { name: `Create a character for ${mockWorld.name}` })
    );

    // Verify world is set as current world via the store
    expect(setCurrentWorldSpy).toHaveBeenCalledWith(mockWorld.id);

    expect(mockRouterPush).toHaveBeenCalledWith(`/characters/create?worldId=${mockWorld.id}`);

    setCurrentWorldSpy.mockRestore();
  });

  // Continue only shows when Play will resume: the saved session must belong to
  // the character the play screen will pick, here the current character.
  test('offers Continue and the last-played date when the session will resume', () => {
    const lastPlayed = '2024-03-02T10:00:00.000Z';
    useCharacterStore.setState({
      characters: {
        first: { id: 'first', worldId: mockWorld.id, name: 'First' },
        current: { id: 'current', worldId: mockWorld.id, name: 'Current' },
      } as unknown as ReturnType<typeof useCharacterStore.getState>['characters'],
      currentCharacterId: 'current',
    });
    useSessionStore.setState({
      savedSessions: {
        s1: { id: 's1', worldId: mockWorld.id, characterId: 'current', lastPlayed, narrativeCount: 3 },
      },
    });

    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: `Continue ${mockWorld.name}` }));
    expect(mockRouterPush).toHaveBeenCalledWith(`/worlds/${mockWorld.id}/play?autoResume=true`);
    expect(screen.getByText(`Last played: ${formatDate(lastPlayed)}`)).toBeInTheDocument();

    useCharacterStore.setState(useCharacterStore.getInitialState(), true);
    useSessionStore.setState(useSessionStore.getInitialState(), true);
  });

  // One-primary-per-state: page-level Create is the filled primary on the
  // worlds list, so per-card Play is the unfilled accent action.
  test('Play is the unfilled accent action and names its world', () => {
    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);

    const playButton = screen.getByTestId('world-card-actions-play-button');
    expect(playButton).toHaveAccessibleName(expect.stringContaining(mockWorld.name));
    expect(playButton).toHaveClass('card-action-variant-accent');
    expect(playButton).not.toHaveClass('card-action-variant-primary');
  });

  // Test for character avatar pill styling
  test('character avatar buttons use design system classes', () => {
    const mockCharacter = {
      id: 'char-1',
      worldId: mockWorld.id,
      name: 'Aragorn',
      description: 'A ranger',
      portrait: { type: 'placeholder' as const, url: null },
      level: 5,
      isPlayer: true,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
      status: { conditions: [] },
      inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <WorldCard
        world={mockWorld}
       
        onDelete={jest.fn()}
        characters={[mockCharacter]}
      />
    );

    const characterButton = screen.getByTitle('View Aragorn - Level 5');
    expect(characterButton).toHaveClass('world-card-character-pill');
    // The visible name hides on phones, so the accessible name can't depend on it.
    expect(screen.getByRole('button', { name: 'Aragorn, level 5' })).toBe(characterButton);
  });

  test('caps character pills and links the rest to the filtered roster', () => {
    const characters = ['Aria', 'Bram', 'Cato', 'Dune', 'Esk'].map((name, i) => ({
      id: `char-${i}`,
      worldId: mockWorld.id,
      name,
      description: '',
      portrait: { type: 'placeholder' as const, url: null },
      level: 1,
      isPlayer: true,
      attributes: [],
      skills: [],
      derivedStats: [],
      background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
      status: { conditions: [] },
      inventory: { characterId: `char-${i}`, items: [], capacity: 10, categories: [], itemOrder: [] },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }));

    const { container } = render(
      <WorldCard
        world={mockWorld}
       
        onDelete={jest.fn()}
        characters={characters}
      />
    );

    expect(container.querySelectorAll('.world-card-character-pill')).toHaveLength(3);
    const more = screen.getByTestId('world-card-character-pills-more');
    expect(more).toHaveTextContent('+2 more');
    // The count is not a link: the card's Characters action is the one route
    // to the filtered roster.
    expect(more).not.toHaveAttribute('href');
  });

  // Regression test for #1113 - no white placeholder image in the no-image case
  test('renders no placeholder image when the world has no image', () => {
    const worldWithoutImage = createMockWorld({ image: undefined });

    const { container } = render(
      <WorldCard world={worldWithoutImage} onDelete={jest.fn()} />
    );

    // The themed empty-state hero renders (tokenized background via CSS), but
    // there should be no hero <img> and no white data-URI placeholder.
    expect(container.querySelector('.component-hero')).toBeInTheDocument();
    expect(container.querySelector('.component-hero-image')).not.toBeInTheDocument();
    expect(container.querySelector(`img[src="${WHITE_PLACEHOLDER}"]`)).not.toBeInTheDocument();
  });

  // Real (AI-generated) world images still render unchanged
  test('renders the world image when one is provided', () => {
    const worldWithImage = createMockWorld({
      image: {
        url: '/visual-assets/world-cyberpunk.png',
        type: 'ai-generated',
      },
    });

    const { container } = render(
      <WorldCard world={worldWithImage} onDelete={jest.fn()} />
    );

    const heroImage = container.querySelector('.component-hero-image');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage?.getAttribute('src')).not.toBe(WHITE_PLACEHOLDER);
  });

  // Test for Edit functionality
  test('navigates to edit page when Edit is clicked', () => {
    render(<WorldCard world={mockWorld} onDelete={jest.fn()} />);

    // Find and click the Edit button
    fireEvent.click(screen.getByTestId('world-card-actions-edit-button'));

    // Verify navigation to edit page
    expect(mockRouterPush).toHaveBeenCalledWith(`/worlds/${mockWorld.id}/edit`);
  });

});
