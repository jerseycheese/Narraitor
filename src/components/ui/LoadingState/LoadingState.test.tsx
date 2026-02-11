import React from 'react';
import { render } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('does not render HTML span elements inside svg for spinner variant', () => {
    const { container } = render(<LoadingState variant="spinner" />);

    const invalidSvgSpan = container.querySelector('svg span');
    expect(invalidSvgSpan).toBeNull();
  });
});
