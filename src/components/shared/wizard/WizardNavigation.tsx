import React from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { wizardStyles } from './styles/wizardStyles';

interface WizardNavigationProps {
  onCancel: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  currentStep: number;
  totalSteps: number;
  nextLabel?: string;
  completeLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  completeTestId?: string;
  completeDataTutorial?: string;
  nextTestId?: string;
  cancelTestId?: string;
  backTestId?: string;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onCancel,
  onBack,
  onNext,
  onComplete,
  currentStep,
  totalSteps,
  nextLabel = 'Next',
  completeLabel = 'Complete',
  disabled = false,
  isLoading = false,
  className = '',
  completeTestId,
  completeDataTutorial,
  nextTestId,
  cancelTestId,
  backTestId,
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className={clsx(
        'component-wizard-navigation',
        wizardStyles.navigation.container,
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className={wizardStyles.navigation.cancelButton}
        disabled={isLoading}
        data-testid={cancelTestId}
      >
        Cancel
      </Button>

      <div className={wizardStyles.navigation.buttonGroup}>
        {onBack && currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className={wizardStyles.navigation.secondaryButton}
            disabled={isLoading}
            data-testid={backTestId}
          >
            Back
          </Button>
        )}

        {isLastStep ? (
          onComplete && (
            <Button
              type="button"
              variant="default"
              onClick={onComplete}
              className={wizardStyles.navigation.primaryButton}
              disabled={disabled || isLoading}
              data-testid={completeTestId}
              data-tutorial={completeDataTutorial}
            >
              {isLoading ? 'Processing...' : completeLabel}
            </Button>
          )
        ) : (
          onNext && (
            <Button
              type="button"
              variant="default"
              onClick={onNext}
              className={wizardStyles.navigation.primaryButton}
              disabled={disabled || isLoading}
              data-testid={nextTestId}
            >
              {isLoading ? 'Processing...' : nextLabel}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

