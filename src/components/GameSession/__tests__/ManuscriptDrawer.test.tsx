import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManuscriptDrawer } from '../ManuscriptDrawer';

describe('ManuscriptDrawer', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title and content when open', () => {
    render(
      <ManuscriptDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Drawer"
      >
        <div>Drawer Content</div>
      </ManuscriptDrawer>
    );

    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('has role="dialog"', () => {
    render(
      <ManuscriptDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Drawer"
      >
        <div>Content</div>
      </ManuscriptDrawer>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows close button and calls onOpenChange(false) when clicked', () => {
    render(
      <ManuscriptDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Drawer"
      >
        <div>Content</div>
      </ManuscriptDrawer>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on Escape key press', () => {
    render(
      <ManuscriptDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Drawer"
      >
        <div>Content</div>
      </ManuscriptDrawer>
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('applies manuscript-overlay-open class to body when open', () => {
    const { unmount } = render(
      <ManuscriptDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Drawer"
      >
        <div>Content</div>
      </ManuscriptDrawer>
    );

    expect(document.body).toHaveClass('manuscript-overlay-open');
    expect(document.documentElement).toHaveClass('manuscript-overlay-open');

    unmount();
    expect(document.body).not.toHaveClass('manuscript-overlay-open');
  });
});
