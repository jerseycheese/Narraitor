import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeMenu } from '../ThemeMenu';

const setColorScheme = jest.fn();

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    colorScheme: 'light',
    setColorScheme,
  }),
}));

describe('ThemeMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens to show the color scheme control and selects an option', () => {
    render(<ThemeMenu />);

    // Closed by default.
    expect(
      screen.queryByRole('radiogroup', { name: 'Color scheme' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Appearance' }));

    // Single design system now — the Appearance menu is just light/dark/system.
    expect(
      screen.getByRole('radiogroup', { name: 'Color scheme' })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'System' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(setColorScheme).toHaveBeenCalledWith('dark');
  });
});
