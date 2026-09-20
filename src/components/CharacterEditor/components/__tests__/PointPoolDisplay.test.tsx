import React from 'react';
import { render, screen } from '@testing-library/react';
import { PointPoolDisplay } from '../PointPoolDisplay';

describe('PointPoolDisplay', () => {
  test('renders remaining points correctly', () => {
    render(<PointPoolDisplay pool={{ total: 50, spent: 30, remaining: 20 }} label="Attribute Points" />);
    expect(screen.getByText('Attribute Points')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 20')).toBeInTheDocument();
  });

  test('renders all allocated indicator when remaining is zero', () => {
    render(<PointPoolDisplay pool={{ total: 50, spent: 50, remaining: 0 }} />);
    expect(screen.getByText('All allocated!')).toBeInTheDocument();
  });

  test('renders over budget warning when remaining is negative', () => {
    render(<PointPoolDisplay pool={{ total: 50, spent: 55, remaining: -5 }} />);
    expect(screen.getByText('Over budget: 5')).toBeInTheDocument();
    expect(screen.getByText('Over budget!')).toBeInTheDocument();
  });
});
