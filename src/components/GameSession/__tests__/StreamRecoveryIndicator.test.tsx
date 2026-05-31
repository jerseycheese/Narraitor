/**
 * MVP-level tests for StreamRecoveryIndicator (issue #903).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import StreamRecoveryIndicator from '../StreamRecoveryIndicator';

describe('StreamRecoveryIndicator', () => {
  test('renders nothing when not resuming', () => {
    const { container } = render(<StreamRecoveryIndicator resuming={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows the reconnecting status when resuming', () => {
    render(<StreamRecoveryIndicator resuming={true} />);
    expect(screen.getByText('Reconnecting…')).toBeInTheDocument();
    expect(
      document.querySelector('.stream-recovery-indicator')
    ).toBeInTheDocument();
  });
});
