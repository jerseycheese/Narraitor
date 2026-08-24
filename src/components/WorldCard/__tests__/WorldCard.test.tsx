import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorldCard from '../WorldCard';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';
import { formatDate } from '@/lib/utils';
import { useWorldStore } from '@/state/worldStore';

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
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
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
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
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
    
    render(<WorldCard world={incompleteWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // Should still render the world name and not crash
    expect(screen.getByRole('heading', { name: incompleteWorld.name })).toBeInTheDocument();
    
    // Should handle empty description gracefully (may not be visible)
    expect(screen.getByText('Fantasy')).toBeInTheDocument(); // Genre should still show
  });

  // Test case for world name navigation
  test('world name links to world detail page', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);
    
    // World name should be accessible as a heading and the hero link should navigate to detail page
    const worldTitle = screen.getByRole('heading', { name: mockWorld.name });
    expect(worldTitle).toBeInTheDocument();
    
    // The hero link should navigate to the world detail page
    const heroLink = worldTitle.closest('a');
    expect(heroLink).toHaveAttribute('href', `/worlds/${mockWorld.id}`);
  });

  // New test for Play functionality (navigates to characters when no characters exist)
  test('sets current world and navigates to characters when Play is clicked', () => {
    const setCurrentWorldSpy = jest.spyOn(
      useWorldStore.getState(),
      'setCurrentWorld'
    );

    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);

    // Find and click the Play button
    fireEvent.click(screen.getByTestId('world-card-actions-play-button'));

    // Verify world is set as current world via the store
    expect(setCurrentWorldSpy).toHaveBeenCalledWith(mockWorld.id);

    // Verify navigation to characters page (since no characters exist in the world)
    expect(mockRouterPush).toHaveBeenCalledWith(`/characters?worldId=${mockWorld.id}`);

    setCurrentWorldSpy.mockRestore();
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
        onSelect={jest.fn()}
        onDelete={jest.fn()}
        characters={[mockCharacter]}
      />
    );

    const characterButton = screen.getByTitle('Play as Aragorn - Level 5');
    expect(characterButton).toHaveClass('world-card-character-pill');
  });

  // Regression test for #1113 - no white placeholder image in the no-image case
  test('renders no placeholder image when the world has no image', () => {
    const worldWithoutImage = createMockWorld({ image: undefined });

    const { container } = render(
      <WorldCard world={worldWithoutImage} onSelect={jest.fn()} onDelete={jest.fn()} />
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
      <WorldCard world={worldWithImage} onSelect={jest.fn()} onDelete={jest.fn()} />
    );

    const heroImage = container.querySelector('.component-hero-image');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage?.getAttribute('src')).not.toBe(WHITE_PLACEHOLDER);
  });

  // Test for Edit functionality
  test('navigates to edit page when Edit is clicked', () => {
    render(<WorldCard world={mockWorld} onSelect={jest.fn()} onDelete={jest.fn()} />);

    // Find and click the Edit button
    fireEvent.click(screen.getByTestId('world-card-actions-edit-button'));

    // Verify navigation to edit page
    expect(mockRouterPush).toHaveBeenCalledWith(`/worlds/${mockWorld.id}/edit`);
  });

});
