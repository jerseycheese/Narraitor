import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleButton } from '../components/ToggleButton';

describe('ToggleButton', () => {
  it('renders active state with aria-pressed="true" and active label', () => {
    render(<ToggleButton isActive={true} onClick={jest.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('Selected');
    expect(button).toHaveClass('wizard-toggle-active');
    expect(button).toHaveClass('component-toggle-button');
  });

  it('renders inactive state with aria-pressed="false" and inactive label', () => {
    render(<ToggleButton isActive={false} onClick={jest.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('Excluded');
    expect(button).toHaveClass('wizard-toggle-inactive');
  });

  it('respects custom labels and accessible labels', () => {
    render(
      <ToggleButton
        isActive={true}
        activeLabel="Included"
        inactiveLabel="Ignored"
        aria-label="Toggle Magic skill"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole('button', { name: 'Toggle Magic skill' });
    expect(button).toHaveTextContent('Included');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles click events and disabled state', () => {
    const handleClick = jest.fn();
    const { rerender } = render(<ToggleButton isActive={false} onClick={handleClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(<ToggleButton isActive={false} onClick={handleClick} disabled={true} />);
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });
});
