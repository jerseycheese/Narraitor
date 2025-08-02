import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeHistory } from '../NarrativeHistory';
import { NarrativeSegment } from '@/types/narrative.types';

// Mock ScrollArea component
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className, ...props }: any) => (
    <div 
      className={className}
      data-testid="scroll-area"
      data-radix-scroll-area-viewport="true"
      {...props}
    >
      {children}
    </div>
  )
}));

describe('NarrativeHistory Scrolling Features', () => {
  const mockSegments: NarrativeSegment[] = [
    {
      id: 'seg-1',
      content: 'You find yourself in a dark forest. The trees loom overhead, their branches creating an intricate canopy that blocks most of the sunlight.',
      type: 'scene',
      sessionId: 'session-1',
      worldId: 'world-1',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-01-01T10:00:00Z',
      metadata: { location: 'Dark Forest' }
    },
    {
      id: 'seg-2', 
      content: '"Hello there, traveler," says a mysterious figure emerging from behind an ancient oak tree. "You look lost."',
      type: 'dialogue',
      sessionId: 'session-1',
      worldId: 'world-1',
      timestamp: new Date('2023-01-01T10:01:00Z'),
      createdAt: '2023-01-01T10:01:00Z',
      updatedAt: '2023-01-01T10:01:00Z',
      metadata: { location: 'Dark Forest' }
    },
    {
      id: 'seg-3',
      content: 'You decide to approach the figure cautiously, your hand resting on the hilt of your sword. As you get closer, you notice the figure is an elderly woman wearing a tattered cloak.',
      type: 'action',
      sessionId: 'session-1',
      worldId: 'world-1',
      timestamp: new Date('2023-01-01T10:02:00Z'),
      createdAt: '2023-01-01T10:02:00Z',
      updatedAt: '2023-01-01T10:02:00Z',
      metadata: { location: 'Dark Forest' }
    }
  ];

  beforeEach(() => {
    // Mock scrollTo method
    window.HTMLElement.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders ScrollArea component with proper styling', () => {
    render(<NarrativeHistory segments={mockSegments} />);
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).toHaveClass('bg-gray-50', 'dark:bg-gray-800', 'rounded-lg', 'shadow-inner');
  });

  it('applies correct height classes based on segment count', () => {
    const { rerender } = render(<NarrativeHistory segments={[mockSegments[0]]} />);
    
    let scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toHaveClass('min-h-[300px]');
    
    // Rerender with multiple segments
    rerender(<NarrativeHistory segments={mockSegments} />);
    scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toHaveClass('min-h-[610px]', 'max-h-[610px]');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<NarrativeHistory segments={mockSegments} />);
    
    const container = screen.getByTestId('scroll-area');
    
    // Focus the container
    container.focus();
    
    // Test arrow down navigation
    await user.keyboard('{ArrowDown}');
    
    // Verify scrollTo was called (via mock)
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  it('handles page navigation keys', async () => {
    const user = userEvent.setup();
    render(<NarrativeHistory segments={mockSegments} />);
    
    const container = screen.getByTestId('scroll-area');
    container.focus();
    
    // Test page down
    await user.keyboard('{PageDown}');
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();
    
    // Test page up
    await user.keyboard('{PageUp}');
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalledTimes(2);
    
    // Test home and end
    await user.keyboard('{Home}');
    await user.keyboard('{End}');
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalledTimes(4);
  });

  it('auto-scrolls when new segments are added', async () => {
    const { rerender } = render(<NarrativeHistory segments={[mockSegments[0]]} />);
    
    // Add a new segment
    const newSegments = [...mockSegments, {
      id: 'seg-4',
      content: 'A new narrative segment appears',
      type: 'scene' as const,
      sessionId: 'session-1',
      worldId: 'world-1',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    
    rerender(<NarrativeHistory segments={newSegments} />);
    
    // Auto-scroll should be triggered
    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      });
    });
  });

  it('displays loading state correctly', () => {
    render(<NarrativeHistory segments={[]} isLoading={true} />);
    
    expect(screen.getByText('Writing your story...')).toBeInTheDocument();
  });

  it('displays error state with retry functionality', () => {
    const mockRetry = jest.fn();
    render(<NarrativeHistory segments={[]} error="Test error" onRetry={mockRetry} />);
    
    expect(screen.getByText('Unable to Generate Narrative')).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalled();
  });

  it('renders narrative segments correctly', () => {
    render(<NarrativeHistory segments={mockSegments} />);
    
    // Check that all segments are rendered
    expect(screen.getByText(/You find yourself in a dark forest/)).toBeInTheDocument();
    expect(screen.getByText(/Hello there, traveler/)).toBeInTheDocument();
    expect(screen.getByText(/You decide to approach the figure/)).toBeInTheDocument();
  });

  it('maintains scroll position during content updates', () => {
    const { rerender } = render(<NarrativeHistory segments={mockSegments} />);
    
    // Simulate user scrolling up
    const container = screen.getByTestId('scroll-area');
    fireEvent.scroll(container, { target: { scrollTop: 100 } });
    
    // Add loading state
    rerender(<NarrativeHistory segments={mockSegments} isLoading={true} />);
    
    // Should not auto-scroll when user has manually scrolled
    expect(window.HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  });

  it('focuses container for keyboard navigation', () => {
    render(<NarrativeHistory segments={mockSegments} />);
    
    const container = screen.getByTestId('scroll-area').parentElement;
    expect(container).toHaveAttribute('tabIndex', '0');
    expect(container).toHaveStyle('outline: none');
  });

  it('enables smooth momentum scrolling on touch devices', () => {
    render(<NarrativeHistory segments={mockSegments} />);
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toHaveStyle({ WebkitOverflowScrolling: 'touch' });
  });

  it('supports scroll snapping', () => {
    render(<NarrativeHistory segments={mockSegments} />);
    
    const contentArea = screen.getByTestId('scroll-area').firstChild as HTMLElement;
    expect(contentArea).toHaveStyle({ scrollSnapType: 'y mandatory' });
  });
});