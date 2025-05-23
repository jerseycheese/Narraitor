import React from 'react';
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
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className={`${wizardStyles.navigation.container} ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className={wizardStyles.navigation.cancelButton}
        disabled={isLoading}
      >
        Cancel
      </button>
      
      <div className={wizardStyles.navigation.buttonGroup}>
        {onBack && currentStep > 0 && (
          <button
            type="button"
            onClick={onBack}
            className={wizardStyles.navigation.secondaryButton}
            disabled={isLoading}
          >
            Back
          </button>
        )}
        
        {isLastStep ? (
          onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className={wizardStyles.navigation.primaryButton}
              disabled={disabled || isLoading}
            >
              {isLoading ? 'Processing...' : completeLabel}
            </button>
          )
        ) : (
          onNext && (
            <button
              type="button"
              onClick={onNext}
              className={wizardStyles.navigation.primaryButton}
              disabled={disabled || isLoading}
            >
              {isLoading ? 'Processing...' : nextLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
};