import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import NotFound from '../not-found';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('NotFound page (#1535)', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('renders branded copy with a single h1', () => {
    render(<NotFound />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Page Not Found');
    // Branded copy, not the framework fallback.
    expect(screen.queryByText('This page could not be found.')).not.toBeInTheDocument();
  });

  it('offers a recovery action back to worlds', () => {
    render(<NotFound />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Worlds' }));
    expect(push).toHaveBeenCalledWith('/worlds');
  });
});
