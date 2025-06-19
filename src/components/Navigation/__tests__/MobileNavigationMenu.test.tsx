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

  test('renders with touch-friendly interface and proper navigation', () => {
    const onClose = jest.fn();
    const onNavigate = jest.fn();
    
    render(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={onClose} 
        onNavigate={onNavigate} 
      />
    );
    
    // Verify menu renders with essential elements
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Worlds')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    
    // Verify touch target sizes (44px minimum)
    const closeButton = screen.getByLabelText(/close menu/i);
    const worldsButton = screen.getByText('Worlds');
    expect(closeButton).toHaveClass('min-h-11', 'min-w-11');
    expect(worldsButton.closest('button')).toHaveClass('min-h-11');
    
    // Test callback functionality
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
    
    fireEvent.click(worldsButton);
    expect(onNavigate).toHaveBeenCalledWith('/worlds');
  });

  test('conditional rendering based on isOpen prop', () => {
    const { rerender } = render(
      <MobileNavigationMenu 
        isOpen={false} 
        onClose={jest.fn()} 
        onNavigate={jest.fn()} 
      />
    );
    
    // Should not render when closed
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    
    // Should render when opened
    rerender(
      <MobileNavigationMenu 
        isOpen={true} 
        onClose={jest.fn()} 
        onNavigate={jest.fn()} 
      />
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});