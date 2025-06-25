import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders badge with label', () => {
    render(<StatusBadge variant="skill-difficulty" state="easy" label="Easy" />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('applies correct CSS classes for skill-difficulty easy', () => {
    render(<StatusBadge variant="skill-difficulty" state="easy" label="Easy" />);
    const badge = screen.getByText('Easy');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows description when provided', () => {
    render(
      <StatusBadge 
        variant="skill-difficulty" 
        state="easy" 
        label="Easy" 
        description="Quick to learn"
      />
    );
    expect(screen.getByText('Quick to learn')).toBeInTheDocument();
  });

});