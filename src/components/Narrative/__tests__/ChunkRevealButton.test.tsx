import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChunkRevealButton } from '../ChunkRevealButton';

describe('ChunkRevealButton', () => {
  it('renders with default text', () => {
    render(<ChunkRevealButton onClick={() => {}} />);

    expect(screen.getByRole('button', { name: /continue reading/i })).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<ChunkRevealButton onClick={() => {}} text="Show More" />);

    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<ChunkRevealButton onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows remaining chunks indicator when provided', () => {
    render(
      <ChunkRevealButton
        onClick={() => {}}
        remainingChunks={5}
        totalChunks={10}
      />
    );

    expect(screen.getByText(/5 more/i)).toBeInTheDocument();
  });

  it('includes progress in aria-label for accessibility', () => {
    render(
      <ChunkRevealButton
        onClick={() => {}}
        remainingChunks={3}
        totalChunks={8}
        text="Read More"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Read More. 3 of 8 sections remaining');
  });

  it('can be disabled', () => {
    render(<ChunkRevealButton onClick={() => {}} disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<ChunkRevealButton onClick={handleClick} disabled />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not show progress indicator when remainingChunks is 0', () => {
    render(
      <ChunkRevealButton
        onClick={() => {}}
        remainingChunks={0}
        totalChunks={10}
      />
    );

    expect(screen.queryByText(/more/i)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ChunkRevealButton
        onClick={() => {}}
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('applies identifying class for styling', () => {
    render(<ChunkRevealButton onClick={() => {}} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('chunk-reveal-button');
  });
});
