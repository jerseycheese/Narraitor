import { render, screen, fireEvent } from '@testing-library/react';
import { WizardNavigation } from '../WizardNavigation';

describe('WizardNavigation', () => {
  it('renders cancel and next buttons on initial step with one primary button', () => {
    const handleCancel = jest.fn();
    const handleNext = jest.fn();

    render(
      <WizardNavigation
        currentStep={0}
        totalSteps={5}
        onCancel={handleCancel}
        onNext={handleNext}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const nextBtn = screen.getByRole('button', { name: 'Next' });

    expect(cancelBtn).toHaveClass('button-ghost');
    expect(nextBtn).toHaveClass('button-default');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('renders back button on middle steps', () => {
    const handleBack = jest.fn();
    const handleNext = jest.fn();

    render(
      <WizardNavigation
        currentStep={2}
        totalSteps={5}
        onCancel={jest.fn()}
        onBack={handleBack}
        onNext={handleNext}
      />
    );

    const backBtn = screen.getByRole('button', { name: 'Back' });
    expect(backBtn).toHaveClass('button-outline');

    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders complete button on final step with custom label and test ID', () => {
    const handleComplete = jest.fn();

    render(
      <WizardNavigation
        currentStep={4}
        totalSteps={5}
        onCancel={jest.fn()}
        onBack={jest.fn()}
        onComplete={handleComplete}
        completeLabel="Create World"
        completeTestId="step-complete-button"
        completeDataTutorial="finalize-world"
      />
    );

    const completeBtn = screen.getByRole('button', { name: 'Create World' });
    expect(completeBtn).toHaveClass('button-default');
    expect(completeBtn).toHaveAttribute('data-testid', 'step-complete-button');
    expect(completeBtn).toHaveAttribute('data-tutorial', 'finalize-world');
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();

    fireEvent.click(completeBtn);
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });
});
