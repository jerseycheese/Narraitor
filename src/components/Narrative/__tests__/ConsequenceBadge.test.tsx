// src/components/Narrative/__tests__/ConsequenceBadge.test.tsx

import { render, screen } from '@testing-library/react';
import { ConsequenceBadge } from '../ConsequenceBadge';

describe('ConsequenceBadge', () => {
  const defaultProps = {
    decisionId: 'decision-123',
    decisionText: 'You helped the merchant',
    distanceFromDecision: 1,
  };

  it('should display decision text', () => {
    render(<ConsequenceBadge {...defaultProps} />);

    // Text is split by emoji, so use partial text match
    expect(screen.getByText(/You helped the merchant/)).toBeInTheDocument();
  });

  it('should show lightning icon with decision text', () => {
    render(<ConsequenceBadge {...defaultProps} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('Immediate')).toBeInTheDocument();
  });

  it('should use info-static variant for immediate consequences (segment index 0)', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={0} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'immediate');
  });

  it('should use info-static variant for immediate consequences (segment index 1)', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={1} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'immediate');
  });

  it('should use info-static variant for immediate consequences (segment index 2)', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={2} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'immediate');
  });

  it('should use secondary-static variant for longer-term consequences (segment index 3)', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={3} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'longer-term');
  });

  it('should use secondary-static variant for longer-term consequences (segment index 5)', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={5} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'longer-term');
  });

  it('should include timing label for immediate consequences', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={1} />);

    expect(screen.getByText('Immediate')).toBeInTheDocument();
  });

  it('should include timing label for longer-term consequences', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={3} />);

    expect(screen.getByText('Longer-term')).toBeInTheDocument();
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
      // Use regex for flexible matching since text is split by emoji
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      unmount();
    });
  });

  it('should render without crashing for edge segment indices', () => {
    const edgeCases = [0, 1, 2, 3, 10, 100];

    edgeCases.forEach((index) => {
      expect(() => {
        const { unmount } = render(<ConsequenceBadge {...defaultProps} distanceFromDecision={index} />);
        unmount();
      }).not.toThrow();
    });
  });

  it('should default to longer-term when distance is unknown (-1)', () => {
    render(<ConsequenceBadge {...defaultProps} distanceFromDecision={-1} />);

    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'longer-term');
    expect(screen.getByText('Longer-term')).toBeInTheDocument();
  });
});
