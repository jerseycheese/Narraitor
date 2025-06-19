import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AchievementDialog } from '../AchievementDialog';

describe('AchievementDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Quest Completed!',
    description: 'You have successfully completed the ancient quest and earned the title of Hero.',
    achievement: 'Hero of the Realm',
    reward: '500 Gold Coins',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dialog when open', () => {
      render(<AchievementDialog {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Quest Completed!')).toBeInTheDocument();
      expect(screen.getByText('You have successfully completed the ancient quest and earned the title of Hero.')).toBeInTheDocument();
      expect(screen.getByText('Hero of the Realm')).toBeInTheDocument();
      expect(screen.getByText('500 Gold Coins')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AchievementDialog {...mockProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders without reward when not provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reward, ...propsWithoutReward } = mockProps;
      render(<AchievementDialog {...propsWithoutReward} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Hero of the Realm')).toBeInTheDocument();
      expect(screen.queryByText('500 Gold Coins')).not.toBeInTheDocument();
    });

    it('renders close/continue button', () => {
      render(<AchievementDialog {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('renders custom button text when provided', () => {
      render(<AchievementDialog {...mockProps} buttonText="Awesome!" />);
      
      expect(screen.getByRole('button', { name: /awesome/i })).toBeInTheDocument();
    });
  });

  describe('Achievement Types', () => {
    it('applies quest styling for quest achievements', () => {
      render(<AchievementDialog {...mockProps} type="quest" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('achievement-quest');
    });

    it('applies skill styling for skill achievements', () => {
      render(<AchievementDialog {...mockProps} type="skill" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('achievement-skill');
    });

    it('applies discovery styling for discovery achievements', () => {
      render(<AchievementDialog {...mockProps} type="discovery" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('achievement-discovery');
    });

    it('applies milestone styling for milestone achievements', () => {
      render(<AchievementDialog {...mockProps} type="milestone" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('achievement-milestone');
    });

    it('applies default styling when no type is specified', () => {
      render(<AchievementDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('achievement-default');
    });
  });

  describe('Interactions', () => {
    it('calls onClose when continue button is clicked', () => {
      render(<AchievementDialog {...mockProps} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles escape key press to close dialog', () => {
      render(<AchievementDialog {...mockProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when continue button is clicked and onContinue is provided', () => {
      const onContinue = jest.fn();
      render(<AchievementDialog {...mockProps} onContinue={onContinue} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      
      expect(onContinue).toHaveBeenCalledTimes(1);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<AchievementDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('focuses continue button by default', async () => {
      render(<AchievementDialog {...mockProps} />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await waitFor(() => {
        expect(continueButton).toHaveFocus();
      });
    });

    it('has proper role for achievement announcement', () => {
      render(<AchievementDialog {...mockProps} />);
      
      const achievementSection = screen.getByRole('dialog').querySelector('[role="status"]');
      expect(achievementSection).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('renders description as text when string is provided', () => {
      render(<AchievementDialog {...mockProps} />);
      
      expect(screen.getByText('You have successfully completed the ancient quest and earned the title of Hero.')).toBeInTheDocument();
    });

    it('renders description as JSX when ReactNode is provided', () => {
      const jsxDescription = (
        <div>
          <p>First achievement paragraph.</p>
          <p>Second achievement paragraph.</p>
        </div>
      );
      
      render(<AchievementDialog {...mockProps} description={jsxDescription} />);
      
      expect(screen.getByText('First achievement paragraph.')).toBeInTheDocument();
      expect(screen.getByText('Second achievement paragraph.')).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('displays achievement icon when provided', () => {
      const Icon = () => <div data-testid="achievement-icon">🏆</div>;
      render(<AchievementDialog {...mockProps} icon={<Icon />} />);
      
      expect(screen.getByTestId('achievement-icon')).toBeInTheDocument();
    });

    it('shows reward section when reward is provided', () => {
      render(<AchievementDialog {...mockProps} />);
      
      const rewardSection = screen.getByText('Reward:').parentElement;
      expect(rewardSection).toBeInTheDocument();
      expect(screen.getByText('500 Gold Coins')).toBeInTheDocument();
    });

    it('hides reward section when no reward is provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reward, ...propsWithoutReward } = mockProps;
      render(<AchievementDialog {...propsWithoutReward} />);
      
      expect(screen.queryByText('Reward:')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('applies mobile-responsive classes', () => {
      render(<AchievementDialog {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg', 'sm:rounded-lg');
    });
  });
});