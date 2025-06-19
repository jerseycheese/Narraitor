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
    } as any);
    
    mockUseCharacterStore.mockReturnValue({
      characters: {},
    } as any);
    
    mockUseNavigationLoadingContext.mockReturnValue({
      navigateWithLoading: jest.fn(),
    } as any);
  });

  test('shows hamburger menu button on mobile', () => {
    render(<Navigation />);
    
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toHaveClass('md:hidden'); // Hidden on desktop
  });

  test('hamburger button has proper touch target size', () => {
    render(<Navigation />);
    
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    expect(hamburgerButton).toHaveClass('min-h-11', 'min-w-11'); // 44px minimum
  });

  test('opens mobile menu when hamburger is clicked', () => {
    render(<Navigation />);
    
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(hamburgerButton);
    
    // Mobile menu should be visible
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
  });

  test('closes mobile menu when close button is clicked', () => {
    render(<Navigation />);
    
    // Open menu
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(hamburgerButton);
    
    // Close menu
    const closeButton = screen.getByLabelText(/close menu/i);
    fireEvent.click(closeButton);
    
    // Menu should be closed
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
  });

  test('hides desktop navigation items on mobile', () => {
    render(<Navigation />);
    
    // Desktop navigation should be hidden on mobile
    const desktopNav = screen.getByTestId('desktop-navigation');
    expect(desktopNav).toHaveClass('hidden', 'md:flex');
  });

  test('shows mobile-optimized layout', () => {
    render(<Navigation />);
    
    // Main nav container should have mobile-specific classes
    const navContainer = screen.getByRole('banner');
    expect(navContainer).toHaveClass('px-4'); // Mobile padding
  });

  test('mobile menu closes when navigation link is clicked', () => {
    render(<Navigation />);
    
    // Open menu
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(hamburgerButton);
    
    // Click navigation link
    const worldsLink = screen.getByText('Worlds');
    fireEvent.click(worldsLink);
    
    // Menu should close automatically
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
  });

  test('supports swipe gesture to close menu', () => {
    render(<Navigation />);
    
    // Open menu
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(hamburgerButton);
    
    const mobileMenu = screen.getByRole('navigation', { name: /mobile navigation/i });
    
    // Simulate swipe left gesture
    fireEvent.touchStart(mobileMenu, {
      touches: [{ clientX: 200, clientY: 100 }]
    });
    fireEvent.touchMove(mobileMenu, {
      touches: [{ clientX: 50, clientY: 100 }]
    });
    fireEvent.touchEnd(mobileMenu);
    
    // Menu should close
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
  });

  test('maintains accessibility in mobile layout', () => {
    render(<Navigation />);
    
    const hamburgerButton = screen.getByLabelText(/open menu/i);
    
    // Should have proper ARIA attributes
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
    
    // Open menu
    fireEvent.click(hamburgerButton);
    
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
  });
});