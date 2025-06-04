import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import '@testing-library/jest-dom';
import CharacterViewPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock character store
jest.mock('@/state/characterStore', () => ({
  characterStore: jest.fn(() => ({
    characters: {
      'char-123': {
        id: 'char-123',
        name: 'Test Character',
        level: 5,
        worldId: 'world-1',
        attributes: [
          { id: 'attr-1', characterId: 'char-123', name: 'Strength', baseValue: 8, modifiedValue: 8, category: 'Physical' }
        ],
        skills: [
          { id: 'skill-1', characterId: 'char-123', name: 'Swordsmanship', level: 3, category: 'Combat' }
        ],
        background: {
          history: 'A brave warrior with a noble past',
          personality: 'Bold and honorable',
          goals: ['To protect others'],
          fears: ['Failing those who depend on them'],
          physicalDescription: 'Tall and strong'
        },
        status: {
          hp: 100,
          mp: 50,
          stamina: 80
        },
        isPlayer: true,
        portrait: {
          type: 'placeholder',
          url: null
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    },
    setCurrentCharacter: jest.fn(),
    deleteCharacter: jest.fn()
  }))
}));

// Mock world store
jest.mock('@/state/worldStore', () => ({
  worldStore: jest.fn(() => ({
    worlds: {
      'world-1': {
        id: 'world-1',
        name: 'Test World',
        description: 'A test world',
        theme: 'fantasy',
        attributes: [
          { id: 'attr-1', worldId: 'world-1', name: 'Strength', description: 'Physical power', baseValue: 10, minValue: 1, maxValue: 20, category: 'Physical' }
        ],
        skills: [
          { id: 'skill-1', worldId: 'world-1', name: 'Swordsmanship', description: 'Skill with blades', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, category: 'Combat' }
        ],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 20,
          skillPointPool: 20
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    }
  }))
}));

const mockPush = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush
  });
  (useParams as jest.Mock).mockReturnValue({
    id: 'char-123'
  });
});

describe('CharacterViewPage', () => {
  test('displays character information when character exists', () => {
    render(<CharacterViewPage />);
    
    // Should display character name and level
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    
    // Should display character attributes 
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    
    // Should display character skills
    expect(screen.getByText('Swordsmanship')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Should display background information
    expect(screen.getByText('A brave warrior with a noble past')).toBeInTheDocument();
    expect(screen.getAllByText('Bold and honorable')).toHaveLength(2); // Appears in summary and detailed background
  });

  test('shows character not found message for invalid character ID', () => {
    (useParams as jest.Mock).mockReturnValue({
      id: 'invalid-id'
    });
    
    render(<CharacterViewPage />);
    
    // Should show not found message
    expect(screen.getByText('Character Not Found')).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or has been deleted/)).toBeInTheDocument();
    
    // Should show back button
    expect(screen.getByText('Back to Characters')).toBeInTheDocument();
  });

  test('provides navigation options for valid character', () => {
    render(<CharacterViewPage />);
    
    // Should show action buttons
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
    expect(screen.getByText('Play with Character')).toBeInTheDocument();
    expect(screen.getByText('Delete Character')).toBeInTheDocument();
    
    // Should show back navigation
    expect(screen.getByText('Back to Characters')).toBeInTheDocument();
  });
});
