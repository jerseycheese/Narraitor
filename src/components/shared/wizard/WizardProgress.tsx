import React from 'react';
import { clsx } from 'clsx';
import { wizardStyles } from './styles/wizardStyles';

interface WizardStep {
  id: string;
  label: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  className?: string;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  const currentStepData = steps[currentStep] || steps[0];

  return (
    <nav
      aria-label="Progress"
      className={clsx(
        'component-wizard-progress',
        wizardStyles.progress.container,
        className
      )}
    >
      {/* Mobile view: current label, step count, and segmented progress */}
      <div className="wizard-progress-mobile">
        <div className="wizard-progress-mobile-header">
          <span className="wizard-progress-mobile-count">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="wizard-progress-mobile-current" aria-current="step">
            {currentStepData?.label}
          </span>
        </div>
        <div className="wizard-progress-segments" aria-hidden="true">
          {steps.map((step, index) => (
            <div
              key={`segment-${step.id}`}
              className={clsx(
                'wizard-progress-segment',
                index <= currentStep && 'wizard-progress-segment-active',
                index === currentStep && 'wizard-progress-segment-current'
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop view: compact 5-step ledger with ordered list semantics */}
      <ol className="wizard-progress-row wizard-progress-desktop" role="list">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <React.Fragment key={step.id}>
              <li
                className={clsx(
                  'wizard-progress-step-wrapper',
                  wizardStyles.progress.step,
                  isCurrent && wizardStyles.progress.stepActive,
                  isCompleted && wizardStyles.progress.stepCompleted
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={clsx(
                    wizardStyles.progress.circle,
                    isCurrent
                      ? wizardStyles.progress.circleActive
                      : isCompleted
                      ? wizardStyles.progress.circleCompleted
                      : wizardStyles.progress.circleInactive
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </div>
                <span className={wizardStyles.progress.label}>{step.label}</span>
              </li>
              {index < steps.length - 1 && (
                <li
                  className="wizard-progress-connector-wrapper"
                  aria-hidden="true"
                  role="presentation"
                >
                  <div
                    className={clsx(
                      wizardStyles.progress.connector,
                      index < currentStep && wizardStyles.progress.connectorActive
                    )}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
