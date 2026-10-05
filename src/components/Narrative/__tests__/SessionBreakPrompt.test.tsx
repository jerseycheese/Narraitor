import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionBreakPrompt } from '../SessionBreakPrompt';

describe('SessionBreakPrompt', () => {
  it('holds the chapter dialog until its recap arrives, with focus kept inside', () => {
    const onDismiss = jest.fn();
    const { rerender } = render(<SessionBreakPrompt isOpen chapterNumber={1} onDismiss={onDismiss} />);
    const waiting = screen.getByRole('button', { name: 'Preparing recap' });
    expect(waiting).toHaveFocus();
    fireEvent.click(waiting);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(waiting).toHaveFocus();
    rerender(<SessionBreakPrompt isOpen chapterNumber={1} chapterRecap="Previously: Reached the gate." onDismiss={onDismiss} />);
    const proceed = screen.getByRole('button', { name: 'Continue next chapter' });
    expect(proceed).toHaveFocus();
    fireEvent.click(proceed);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    render(<SessionBreakPrompt isOpen={false} onDismiss={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal dialog with accessible elements and metrics when open', () => {
    render(
      <SessionBreakPrompt
        isOpen={true}
        onDismiss={jest.fn()}
        sessionMetrics={{
          elapsedMinutes: 15,
          segmentCount: 10,
          decisionCount: 3,
        }}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Good stopping point')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue reading/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = jest.fn();
    render(<SessionBreakPrompt isOpen={true} onDismiss={handleDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when continue reading button is clicked', () => {
    const handleContinue = jest.fn();
    render(
      <SessionBreakPrompt
        isOpen={true}
        onDismiss={jest.fn()}
        onContinue={handleContinue}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /continue reading/i }));
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Escape key is pressed', () => {
    const handleDismiss = jest.fn();
    render(<SessionBreakPrompt isOpen={true} onDismiss={handleDismiss} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('traps focus between action buttons on Tab and Shift+Tab', () => {
    render(<SessionBreakPrompt isOpen={true} onDismiss={jest.fn()} />);

    const continueBtn = screen.getByRole('button', { name: /continue reading/i });
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });

    // Focus starts on continue button
    expect(continueBtn).toHaveFocus();

    // Tab moves focus to dismiss button
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(dismissBtn).toHaveFocus();

    // Shift+Tab moves focus back to continue button
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(continueBtn).toHaveFocus();
  });
});
