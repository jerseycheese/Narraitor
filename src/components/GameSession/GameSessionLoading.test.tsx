import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the hooks module using new mock utilities for consistency
jest.doMock('@/hooks', () => {
  const { quickMockSetups } = require('@/lib/test-utils/mockHooks');
  return quickMockSetups.simpleTesting();
});

import GameSessionLoading from './GameSessionLoading';

describe('GameSessionLoading', () => {
  test('renders loading spinner and message', () => {
    render(<GameSessionLoading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading your game...')).toBeInTheDocument();
  });

  test('renders custom loading message when provided', () => {
    render(<GameSessionLoading loadingMessage="Preparing your adventure..." />);

    expect(screen.getByText('Preparing your adventure...')).toBeInTheDocument();
  });

});
