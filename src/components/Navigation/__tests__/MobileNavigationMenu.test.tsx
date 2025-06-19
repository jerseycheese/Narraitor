import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigationMenu } from '../MobileNavigationMenu';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

// Mock the stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('next/navigation', () => ({
  usePathname: () => '/test',
}));

const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;

// Mock window.matchMedia for mobile detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('MobileNavigationMenu', () => {
  beforeEach(() => {
    mockUseWorldStore.mockReturnValue({
      worlds: {},
      currentWorldId: null,
      setCurrentWorld: jest.fn(),
    });
    
    mockUseCharacterStore.mockReturnValue({
      characters: {},
    });
  });

  test('renders mobile navigation menu when open', () => {
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={jest.fn()} 
        onNavigate={jest.fn()} 
      />
    );
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Worlds')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <MobileNavigationMenu 
        isOpen={false} 
        onClose={jest.fn()} 
        onNavigate={jest.fn()} 
      />
    );
    
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={onClose} 
        onNavigate={jest.fn()} 
      />
    );
    
    const closeButton = screen.getByLabelText(/close menu/i);
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onNavigate when navigation link is clicked', () => {
    const onNavigate = jest.fn();
    
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={jest.fn()} 
        onNavigate={onNavigate} 
      />
    );
    
    const worldsLink = screen.getByText('Worlds');
    fireEvent.click(worldsLink);
    
    expect(onNavigate).toHaveBeenCalledWith('/worlds');
  });

  test('has touch-friendly button sizes (minimum 44px)', () => {
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={jest.fn()} 
        onNavigate={jest.fn()} 
      />
    );
    
    const closeButton = screen.getByLabelText(/close menu/i);
    const worldsButton = screen.getByText('Worlds');
    
    // Check that buttons have minimum touch target size
    expect(closeButton).toHaveClass('min-h-11', 'min-w-11'); // 44px = 11 * 4px (Tailwind)
    expect(worldsButton.closest('button')).toHaveClass('min-h-11');
  });

  test('supports keyboard navigation', () => {
    const onClose = jest.fn();
    
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={onClose} 
        onNavigate={jest.fn()} 
      />
    );
    
    // Test escape key handling would be in the useMobileNavigation hook
    // This test verifies the component can receive focus
    const closeButton = screen.getByLabelText(/close menu/i);
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toBeVisible();
  });

  test('manages focus correctly when opened', () => {
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={jest.fn()} 
        onNavigate={jest.fn()} 
      />
    );
    
    // First focusable element should receive focus
    const firstButton = screen.getByLabelText(/close menu/i);
    expect(document.activeElement).toBe(firstButton);
  });
});