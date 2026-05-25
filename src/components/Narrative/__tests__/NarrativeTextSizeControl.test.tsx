import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NarrativeTextSizeControl } from '../NarrativeTextSizeControl';
import {
  useUIPreferencesStore,
  DEFAULT_NARRATIVE_TEXT_SIZE,
} from '@/state/uiPreferencesStore';

describe('NarrativeTextSizeControl', () => {
  beforeEach(() => {
    localStorage.clear();
    useUIPreferencesStore.setState({
      narrativeTextSize: DEFAULT_NARRATIVE_TEXT_SIZE,
    });
  });

  it('renders Small, Medium, and Large options', () => {
    render(<NarrativeTextSizeControl />);
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
  });

  it('marks the active size with aria-pressed', () => {
    render(<NarrativeTextSizeControl />);
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('updates the store when a different size is selected', () => {
    render(<NarrativeTextSizeControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Large' }));
    expect(useUIPreferencesStore.getState().narrativeTextSize).toBe('large');
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
