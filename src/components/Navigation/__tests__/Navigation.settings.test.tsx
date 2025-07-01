import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';

// Mock dependencies
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/components/shared/NavigationLoadingProvider');
jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;
const mockUseNavigationLoadingContext = useNavigationLoadingContext as jest.MockedFunction<typeof useNavigationLoadingContext>;

// Mock window.matchMedia for mobile detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // Simulate desktop
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Navigation - Settings Integration', () => {
  beforeEach(() => {
    mockUseWorldStore.mockReturnValue({
      worlds: {},
      currentWorldId: null,
      setCurrentWorld: jest.fn(),
    });
    
    mockUseCharacterStore.mockReturnValue({
      characters: {},
    });
    
    mockUseNavigationLoadingContext.mockReturnValue({
      navigateWithLoading: jest.fn(),
    });
  });

  test('displays settings link in desktop navigation', () => {
    render(<Navigation />);
    
    // Test that Settings link appears in desktop navigation
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  test('highlights settings link when on settings page', () => {
    render(<Navigation />);
    
    // Test that Settings link has active state styling when on /settings
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).toHaveClass('text-white'); // Active state
  });

  test('shows settings link in correct position after characters', () => {
    render(<Navigation />);
    
    const navLinks = screen.getAllByRole('link').filter(link => 
      ['Worlds', 'Characters', 'Settings'].includes(link.textContent || '')
    );
    
    // Test that Settings appears after Characters in navigation order
    expect(navLinks[0]).toHaveTextContent('Worlds');
    expect(navLinks[1]).toHaveTextContent('Characters');
    expect(navLinks[2]).toHaveTextContent('Settings');
  });
});