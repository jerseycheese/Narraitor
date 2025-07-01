import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigationMenu } from '../MobileNavigationMenu';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

// Mock dependencies
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
}));

const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;

describe('MobileNavigationMenu - Settings Integration', () => {
  const mockOnClose = jest.fn();
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseWorldStore.mockReturnValue({
      worlds: {},
      currentWorldId: null,
      setCurrentWorld: jest.fn(),
    });
    
    mockUseCharacterStore.mockReturnValue({
      characters: {},
    });
  });

  test('displays settings button when menu is open', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
      />
    );
    
    // Test that Settings button appears in mobile menu
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  test('highlights settings button when on settings page', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
      />
    );
    
    // Test that Settings button has active state when on /settings
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toHaveClass('bg-gray-700', 'text-white'); // Active state
  });

  test('navigates to settings when settings button is clicked', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
      />
    );
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    // Test that navigation and menu close are called
    expect(mockOnNavigate).toHaveBeenCalledWith('/settings');
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows settings button in correct position after characters', () => {
    render(
      <MobileNavigationMenu
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
      />
    );
    
    const navButtons = screen.getAllByRole('button').filter(button => 
      ['Worlds', 'Characters', 'Settings'].includes(button.textContent || '')
    );
    
    // Test that Settings appears after Characters in mobile menu order
    expect(navButtons[0]).toHaveTextContent('Worlds');
    expect(navButtons[1]).toHaveTextContent('Characters');
    expect(navButtons[2]).toHaveTextContent('Settings');
  });
});