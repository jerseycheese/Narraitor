import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';

// Mock dependencies
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/components/shared/NavigationLoadingProvider');
jest.mock('next/navigation', () => ({
  usePathname: () => '/test',
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
    matches: query.includes('max-width: 768px'), // Simulate mobile
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Navigation - Mobile Experience', () => {
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

  test('displays hamburger menu with touch-friendly size and accessibility', () => {
    render(<Navigation />);
    
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    
    // Verify touch target size and accessibility
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toHaveClass('min-h-11', 'min-w-11'); // 44px minimum
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
    
    // Test menu opening functionality
    fireEvent.click(hamburgerButton);
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
  });
});