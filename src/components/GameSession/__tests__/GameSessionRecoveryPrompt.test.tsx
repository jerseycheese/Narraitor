import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameSessionRecoveryPrompt } from '../GameSessionRecoveryPrompt';

// Sidestep the Radix Dialog portal/focus-trap — assert against the content.
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const baseProps = {
  isOpen: true,
  worldName: 'Aetheria',
  characterName: 'Kael',
  lastActivity: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  narrativeCount: 4,
  onRestore: jest.fn(),
  onDismiss: jest.fn(),
};

describe('GameSessionRecoveryPrompt (issue #221)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('presents the recovered session details and recovery options', () => {
    render(<GameSessionRecoveryPrompt {...baseProps} />);

    expect(screen.getByText('Aetheria')).toBeInTheDocument();
    expect(screen.getByText('Kael')).toBeInTheDocument();
    expect(screen.getByText('4 scenes')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue your recovered adventure/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /dismiss recovery and start fresh/i })
    ).toBeInTheDocument();
  });

  it('restores when the player chooses to continue', async () => {
    const user = userEvent.setup();
    render(<GameSessionRecoveryPrompt {...baseProps} />);

    await user.click(
      screen.getByRole('button', { name: /continue your recovered adventure/i })
    );

    expect(baseProps.onRestore).toHaveBeenCalledTimes(1);
    expect(baseProps.onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses when the player chooses to start fresh', async () => {
    const user = userEvent.setup();
    render(<GameSessionRecoveryPrompt {...baseProps} />);

    await user.click(
      screen.getByRole('button', { name: /dismiss recovery and start fresh/i })
    );

    expect(baseProps.onDismiss).toHaveBeenCalledTimes(1);
    expect(baseProps.onRestore).not.toHaveBeenCalled();
  });

  it('omits the progress row when no scenes were recorded', () => {
    render(<GameSessionRecoveryPrompt {...baseProps} narrativeCount={0} />);
    expect(screen.queryByText(/scene/)).not.toBeInTheDocument();
  });
});
