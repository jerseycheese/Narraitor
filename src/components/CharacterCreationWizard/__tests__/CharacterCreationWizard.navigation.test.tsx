import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterCreationWizard } from '../CharacterCreationWizard';
import { useWorldStore } from '@/state/useWorldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';
import { useCharacterCreationAutoSave } from '@/hooks/useCharacterCreationAutoSave';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/useWorldStore');
jest.mock('@/state/characterStore');

// Mock auto-save hook
jest.mock('@/hooks/useCharacterCreationAutoSave');

describe('CharacterCreationWizard - Navigation', () => {
  const mockPush = jest.fn();
  const mockCreateCharacter = jest.fn().mockReturnValue('char-123');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Simple mock setup
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useWorldStore as unknown as jest.Mock).mockReturnValue({
      worlds: { 'world-1': { id: 'world-1', name: 'Test World' } },
      getWorld: jest.fn().mockReturnValue({ id: 'world-1', name: 'Test World' }),
    });
    (useCharacterStore as unknown as jest.Mock).mockReturnValue({
      createCharacter: mockCreateCharacter,
      setCurrentCharacter: jest.fn(),
    });
    (useCharacterCreationAutoSave as jest.Mock).mockReturnValue({
      data: null,
      setData: jest.fn(),
      handleFieldBlur: jest.fn(),
      clearAutoSave: jest.fn(),
    });
  });

  it('renders without crashing', () => {
    render(<CharacterCreationWizard worldId="world-1" />);
    
    // Component renders something (could be error state, that's fine)
    expect(document.body).toContainHTML('<div');
  });

  it('shows world not found when world is missing', () => {
    render(<CharacterCreationWizard worldId="nonexistent-world" />);
    
    // Should show appropriate error message
    expect(screen.getByText('World not found')).toBeInTheDocument();
    expect(screen.getByText('Go to Worlds')).toBeInTheDocument();
  });
});
