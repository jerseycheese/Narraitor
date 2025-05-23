import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CharactersPage from '../page';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/characterStore');
jest.mock('@/state/worldStore');

describe.skip('CharactersPage', () => {
  const mockPush = jest.fn();
  const mockCharacters = {
    'char-1': {
      id: 'char-1',
      name: 'Hero One',
      worldId: 'world-1',
      level: 1,
      attributes: [],
      skills: [],
      background: { description: '', personality: '', motivation: '' },
      isPlayer: true,
      status: { hp: 100, mp: 50, stamina: 100 },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
    'char-2': {
      id: 'char-2',
      name: 'Hero Two',
      worldId: 'world-1',
      level: 2,
      attributes: [],
      skills: [],
      background: { description: '', personality: '', motivation: '' },
      isPlayer: true,
      status: { hp: 100, mp: 50, stamina: 100 },
      createdAt: '2023-01-02',
      updatedAt: '2023-01-02',
    },
  };

  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    description: 'A test world',
    theme: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 20,
      skillPointPool: 15,
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (characterStore as unknown as jest.Mock).mockReturnValue({
      characters: mockCharacters,
      currentCharacterId: null,
      deleteCharacter: jest.fn(),
      setCurrentCharacter: jest.fn(),
    });
    (worldStore as unknown as jest.Mock).mockReturnValue({
      worlds: { 'world-1': mockWorld },
      currentWorldId: 'world-1',
    });
  });

  it('displays character list heading', () => {
    render(<CharactersPage />);
    
    expect(screen.getByRole('heading', { name: /characters/i })).toBeInTheDocument();
  });

  it('shows create character button', () => {
    render(<CharactersPage />);
    
    expect(screen.getByRole('button', { name: /create character/i })).toBeInTheDocument();
  });

  it('displays all characters for current world', () => {
    render(<CharactersPage />);
    
    expect(screen.getByText('Hero One')).toBeInTheDocument();
    expect(screen.getByText('Hero Two')).toBeInTheDocument();
  });

  it('filters characters by current world', () => {
    const charactersMultiWorld = {
      ...mockCharacters,
      'char-3': {
        ...mockCharacters['char-1'],
        id: 'char-3',
        name: 'Other World Hero',
        worldId: 'world-2', // Different world
      },
    };
    
    (characterStore as unknown as jest.Mock).mockReturnValue({
      characters: charactersMultiWorld,
      currentCharacterId: null,
      deleteCharacter: jest.fn(),
      setCurrentCharacter: jest.fn(),
    });
    
    render(<CharactersPage />);
    
    expect(screen.getByText('Hero One')).toBeInTheDocument();
    expect(screen.getByText('Hero Two')).toBeInTheDocument();
    expect(screen.queryByText('Other World Hero')).not.toBeInTheDocument();
  });

  it('navigates to character creation when create button clicked', () => {
    render(<CharactersPage />);
    
    const createButton = screen.getByRole('button', { name: /create character/i });
    fireEvent.click(createButton);
    
    expect(mockPush).toHaveBeenCalledWith('/characters/create');
  });

  it('shows empty state when no characters exist', () => {
    (characterStore as unknown as jest.Mock).mockReturnValue({
      characters: {},
      currentCharacterId: null,
      deleteCharacter: jest.fn(),
      setCurrentCharacter: jest.fn(),
    });
    
    render(<CharactersPage />);
    
    expect(screen.getByText(/no characters yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first character/i)).toBeInTheDocument();
  });

  it('shows message when no world is selected', () => {
    (worldStore as unknown as jest.Mock).mockReturnValue({
      worlds: {},
      currentWorldId: null,
    });
    
    render(<CharactersPage />);
    
    expect(screen.getByText(/select a world first/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to worlds/i })).toBeInTheDocument();
  });

  it('navigates to worlds page when no world selected', () => {
    (worldStore as unknown as jest.Mock).mockReturnValue({
      worlds: {},
      currentWorldId: null,
    });
    
    render(<CharactersPage />);
    
    const goToWorldsButton = screen.getByRole('button', { name: /go to worlds/i });
    fireEvent.click(goToWorldsButton);
    
    expect(mockPush).toHaveBeenCalledWith('/worlds');
  });

  it('allows selecting a character', () => {
    const mockSetCurrentCharacter = jest.fn();
    (characterStore as unknown as jest.Mock).mockReturnValue({
      characters: mockCharacters,
      currentCharacterId: null,
      deleteCharacter: jest.fn(),
      setCurrentCharacter: mockSetCurrentCharacter,
    });
    
    render(<CharactersPage />);
    
    const characterCard = screen.getByText('Hero One').closest('div');
    fireEvent.click(characterCard!);
    
    expect(mockSetCurrentCharacter).toHaveBeenCalledWith('char-1');
  });
});