import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeMenu } from '../ThemeMenu';

const setTheme = jest.fn();

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    theme: 'ds1',
    setTheme,
    colorScheme: 'light',
    setColorScheme: jest.fn(),
  }),
  THEMES: [
    { id: 'ds1', name: 'Drafting Table', description: 'Sharp lines' },
    { id: 'ds2', name: 'Warm Earth', description: 'Organic earth tones' },
    { id: 'ds3', name: 'Mechanical Manuscript', description: 'Aged paper' },
  ],
}));

describe('ThemeMenu', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens to show themes by name plus color mode, and selects a theme', () => {
    render(<ThemeMenu />);

    // Closed by default.
    expect(screen.queryByText('Warm Earth')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Appearance' }));

    // Named skins, not DS1/DS2/DS3 ids.
    expect(screen.getByText('Drafting Table')).toBeInTheDocument();
    expect(screen.getByText('Warm Earth')).toBeInTheDocument();

    // Color mode folded into the same appearance menu.
    expect(screen.getByText('Color mode')).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Color scheme' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Warm Earth'));
    expect(setTheme).toHaveBeenCalledWith('ds2');
  });
});
