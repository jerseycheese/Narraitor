import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManuscriptToolsMenu } from '../ManuscriptToolsMenu';

describe('ManuscriptToolsMenu', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Tools toggle button', () => {
    render(<ManuscriptToolsMenu isOpen={false} onToggle={mockOnToggle} />);
    expect(screen.getByRole('button', { name: /toggle tools menu/i })).toBeInTheDocument();
  });

  it('calls onToggle when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<ManuscriptToolsMenu isOpen={false} onToggle={mockOnToggle} />);
    await user.click(screen.getByRole('button', { name: /toggle tools menu/i }));
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('sets aria-expanded based on isOpen state', () => {
    const { rerender } = render(
      <ManuscriptToolsMenu isOpen={false} onToggle={mockOnToggle} />
    );
    expect(screen.getByRole('button', { name: /toggle tools menu/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    rerender(<ManuscriptToolsMenu isOpen={true} onToggle={mockOnToggle} />);
    expect(screen.getByRole('button', { name: /toggle tools menu/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('displays Tools as button text', () => {
    render(<ManuscriptToolsMenu isOpen={false} onToggle={mockOnToggle} />);
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });
});
