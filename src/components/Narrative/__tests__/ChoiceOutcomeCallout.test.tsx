// src/components/Narrative/__tests__/ChoiceOutcomeCallout.test.tsx

import { render, screen } from '@testing-library/react';
import { ChoiceOutcomeCallout } from '../ChoiceOutcomeCallout';

describe('ChoiceOutcomeCallout', () => {
  const defaultProps = {
    decisionId: 'decision-123',
    decisionText: 'You choose to help the merchant',
  };

  it('should display decision text', () => {
    render(<ChoiceOutcomeCallout {...defaultProps} />);

    expect(screen.getByText(/You choose to help the merchant/)).toBeInTheDocument();
  });

  it('should render callout container with decision id', () => {
    render(<ChoiceOutcomeCallout {...defaultProps} />);

    const badge = screen.getByText(/You choose to help the merchant/).closest('[data-decision-id]');
    expect(badge).toBeInTheDocument();
  });

  it('should use small size variant', () => {
    const { container } = render(<ChoiceOutcomeCallout {...defaultProps} />);

    const callout = container.querySelector('.choice-outcome-callout');
    expect(callout).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <ChoiceOutcomeCallout {...defaultProps} className="custom-class" />
    );

    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });

  it('should handle various decision text formats', () => {
    const testCases = [
      'You choose to attack the enemy',
      'You choose to help them',
      'You choose to run away quickly',
      'You choose to investigate the area',
    ];

    testCases.forEach((text) => {
      const { unmount } = render(
        <ChoiceOutcomeCallout {...defaultProps} decisionText={text} />
      );
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      unmount();
    });
  });

  it('should render outcome details when provided', () => {
    render(
      <ChoiceOutcomeCallout
        {...defaultProps}
        decisionOutcome="success"
      />
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
