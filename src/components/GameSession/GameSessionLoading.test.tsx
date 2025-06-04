import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSessionLoading from './GameSessionLoading';

describe('GameSessionLoading', () => {
  test('renders loading spinner and message', () => {
    render(<GameSessionLoading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading game session...')).toBeInTheDocument();
  });

  test('renders custom loading message when provided', () => {
    render(<GameSessionLoading loadingMessage="Preparing your adventure..." />);

    expect(screen.getByText('Preparing your adventure...')).toBeInTheDocument();
  });

});
