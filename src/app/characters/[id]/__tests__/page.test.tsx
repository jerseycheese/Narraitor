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
          { id: 'attr-1', name: 'Strength', baseValue: 8, modifiedValue: 8 }
        ],
        skills: [
          { id: 'skill-1', name: 'Swordsmanship', level: 3 }
        ],
        background: {
          description: 'A brave warrior',
          personality: 'Bold and honorable',
          motivation: 'To protect others'
        },
        status: {
          hp: 100,
          mp: 50,
          stamina: 80
        },
        createdAt: '2023-01-01T00:00:00.000Z',
        isPlayer: true
      }
    },
    setCurrentCharacter: jest.fn(),
    deleteCharacter: jest.fn()
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
    expect(screen.getByText('A brave warrior')).toBeInTheDocument();
    expect(screen.getByText('Bold and honorable')).toBeInTheDocument();
    
    // Should display status information
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
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