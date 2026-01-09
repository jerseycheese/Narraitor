// src/components/Narrative/__tests__/ConsequenceBadge.test.tsx

import { render, screen } from '@testing-library/react';
import { ConsequenceBadge } from '../ConsequenceBadge';

describe('ConsequenceBadge', () => {
  const defaultProps = {
    decisionId: 'decision-123',
    decisionText: 'You helped the merchant',
  };

  it('should display decision text', () => {
    render(<ConsequenceBadge {...defaultProps} />);

    expect(screen.getByText(/You helped the merchant/)).toBeInTheDocument();
  });

  it('should show link icon with decision text', () => {
    render(<ConsequenceBadge {...defaultProps} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-decision-id]');
    expect(badge).toBeInTheDocument();
    expect(screen.getByTestId('consequence-icon')).toBeInTheDocument();
    expect(screen.getByText('Consequence')).toBeInTheDocument();
  });

  it('should use small size variant', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} />);

    // sm size uses px-2 py-0.5 text-xs (from badge.tsx line 37)
    const badge = container.querySelector('.px-2.py-0\\.5.text-xs');
    expect(badge).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} className="custom-class" />);

    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });

  it('should handle various decision text formats', () => {
    const testCases = [
      'You attacked the enemy',
      'You helped them',
      'You ran away quickly',
      'You investigated the area',
    ];

    testCases.forEach((text) => {
      const { unmount } = render(<ConsequenceBadge {...defaultProps} decisionText={text} />);
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      unmount();
    });
  });
});
