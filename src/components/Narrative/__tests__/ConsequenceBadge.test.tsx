// src/components/Narrative/__tests__/ConsequenceBadge.test.tsx

import { render, screen } from '@testing-library/react';
import { ConsequenceBadge } from '../ConsequenceBadge';

describe('ConsequenceBadge', () => {
  const defaultProps = {
    decisionId: 'decision-123',
    decisionText: 'You helped the merchant',
    segmentIndex: 1,
  };

  it('should display decision text', () => {
    render(<ConsequenceBadge {...defaultProps} />);

    // Text is split by emoji, so use partial text match
    expect(screen.getByText(/You helped the merchant/)).toBeInTheDocument();
  });

  it('should show lightning icon with decision text', () => {
    render(<ConsequenceBadge {...defaultProps} />);

    // Check for badge with aria-label and verify content includes both emoji and text
    const badge = screen.getByLabelText('Immediate consequence');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('⚡');
    expect(badge.textContent).toContain('You helped the merchant');
  });

  it('should use info-static variant for immediate consequences (segment index 0)', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} segmentIndex={0} />);

    // info-static uses bg-blue-700 (from badge.tsx line 26)
    const badge = container.querySelector('.bg-blue-700');
    expect(badge).toBeInTheDocument();
  });

  it('should use info-static variant for immediate consequences (segment index 1)', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} segmentIndex={1} />);

    const badge = container.querySelector('.bg-blue-700');
    expect(badge).toBeInTheDocument();
  });

  it('should use info-static variant for immediate consequences (segment index 2)', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} segmentIndex={2} />);

    const badge = container.querySelector('.bg-blue-700');
    expect(badge).toBeInTheDocument();
  });

  it('should use secondary-static variant for longer-term consequences (segment index 3)', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} segmentIndex={3} />);

    // secondary-static uses bg-gray-100 (from badge.tsx line 30)
    const badge = container.querySelector('.bg-gray-100');
    expect(badge).toBeInTheDocument();
  });

  it('should use secondary-static variant for longer-term consequences (segment index 5)', () => {
    const { container } = render(<ConsequenceBadge {...defaultProps} segmentIndex={5} />);

    const badge = container.querySelector('.bg-gray-100');
    expect(badge).toBeInTheDocument();
  });

  it('should have correct ARIA label for immediate consequences', () => {
    render(<ConsequenceBadge {...defaultProps} segmentIndex={1} />);

    const badge = screen.getByLabelText('Immediate consequence');
    expect(badge).toBeInTheDocument();
  });

  it('should have correct ARIA label for longer-term consequences', () => {
    render(<ConsequenceBadge {...defaultProps} segmentIndex={3} />);

    const badge = screen.getByLabelText('Consequence');
    expect(badge).toBeInTheDocument();
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
        const { unmount } = render(<ConsequenceBadge {...defaultProps} segmentIndex={index} />);
        unmount();
      }).not.toThrow();
    });
  });
});
