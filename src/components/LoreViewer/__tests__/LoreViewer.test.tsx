/**
 * Tests for LoreViewer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoreViewer } from '../LoreViewer';
import type { LoreFact } from '../../../types';

// Mock the lore store
const mockGetFacts = jest.fn();

jest.mock('../../../state/loreStore', () => ({
  useLoreStore: () => ({
    getFacts: mockGetFacts
  })
}));

// Sample facts for testing
const sampleFacts: LoreFact[] = [
  {
    id: 'fact-1',
    key: 'hero_name',
    value: 'Lyra Starweaver',
    category: 'characters',
    source: 'manual',
    worldId: 'world-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'fact-2',
    key: 'tavern_location',
    value: 'The Prancing Pony',
    category: 'locations',
    source: 'narrative',
    worldId: 'world-1',
    sessionId: 'session-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'fact-3',
    key: 'quest_start',
    value: 'Heroes met at the tavern',
    category: 'events',
    source: 'narrative',
    worldId: 'world-1',
    sessionId: 'session-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'fact-4',
    key: 'magic_cost',
    value: 'All magic requires sacrifice',
    category: 'rules',
    source: 'manual',
    worldId: 'world-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('LoreViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays facts grouped by category', () => {
    mockGetFacts.mockReturnValue(sampleFacts);
    
    render(<LoreViewer worldId="world-1" />);

    // Check category headings are present
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('World Rules')).toBeInTheDocument();

    // Check facts are displayed
    expect(screen.getByText('hero_name:')).toBeInTheDocument();
    expect(screen.getByText('Lyra Starweaver')).toBeInTheDocument();
    expect(screen.getByText('tavern_location:')).toBeInTheDocument();
    expect(screen.getByText('The Prancing Pony')).toBeInTheDocument();
  });

  test('shows empty state when no facts exist', () => {
    mockGetFacts.mockReturnValue([]);
    
    render(<LoreViewer worldId="world-1" />);

    expect(screen.getByText('No lore facts recorded yet.')).toBeInTheDocument();
    expect(screen.getByText('Facts will appear here as the story unfolds.')).toBeInTheDocument();
  });

  test('filters facts by session when sessionId is provided', () => {
    mockGetFacts.mockReturnValue([sampleFacts[1], sampleFacts[2]]); // Only session facts
    
    render(<LoreViewer worldId="world-1" sessionId="session-1" />);

    // Should call getFacts with session filter
    expect(mockGetFacts).toHaveBeenCalledWith({
      worldId: 'world-1',
      sessionId: 'session-1'
    });

    // Check that only session facts are displayed
    expect(screen.getByText('tavern_location:')).toBeInTheDocument();
    expect(screen.getByText('quest_start:')).toBeInTheDocument();
    expect(screen.queryByText('hero_name:')).not.toBeInTheDocument();
  });

  test('displays total fact count', () => {
    mockGetFacts.mockReturnValue(sampleFacts);
    
    render(<LoreViewer worldId="world-1" />);

    expect(screen.getByText('Total facts: 4')).toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    mockGetFacts.mockReturnValue(sampleFacts);
    
    const { container } = render(<LoreViewer worldId="world-1" className="custom-class" />);

    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('custom-class');
  });

  test('only displays categories that have facts', () => {
    // Only character and location facts
    mockGetFacts.mockReturnValue([sampleFacts[0], sampleFacts[1]]);
    
    render(<LoreViewer worldId="world-1" />);

    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.queryByText('Events')).not.toBeInTheDocument();
    expect(screen.queryByText('World Rules')).not.toBeInTheDocument();
  });

  test('applies correct category colors', () => {
    mockGetFacts.mockReturnValue(sampleFacts);
    
    const { container } = render(<LoreViewer worldId="world-1" />);

    // Check that category sections have the right color classes
    const characterSection = container.querySelector('.bg-blue-50');
    expect(characterSection).toBeInTheDocument();
    expect(characterSection).toHaveClass('border-blue-200');

    const locationSection = container.querySelector('.bg-green-50');
    expect(locationSection).toBeInTheDocument();
    expect(locationSection).toHaveClass('border-green-200');

    const eventSection = container.querySelector('.bg-purple-50');
    expect(eventSection).toBeInTheDocument();
    expect(eventSection).toHaveClass('border-purple-200');

    const rulesSection = container.querySelector('.bg-orange-50');
    expect(rulesSection).toBeInTheDocument();
    expect(rulesSection).toHaveClass('border-orange-200');
  });
});