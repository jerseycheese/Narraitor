'use client';

import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { useTutorial } from './useTutorial';
import { useSessionStore } from '@/state/sessionStore';
import { TutorialPhase } from '@/types/tutorial.types';

const CONTINUE_LABEL = 'Continue';

/** Custom data attached to tour steps via Joyride's Step.data property */
interface TourStepData {
  isEndOfPage?: boolean;
  nextStepHint?: string;
  hideNextButton?: boolean;
}

export function TutorialTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const { content, hideBackButton, hideFooter, showSkipButton, styles, title } =
    step;
  const { pauseTour, currentTour } = useTutorial();
  const updateTutorialProgress = useSessionStore(state => state.updateTutorialProgress);
  const tutorialProgress = useSessionStore(state => state.tutorialProgress);

  // Handle special "pause/continue" logic for multi-page flows
  const handleContinueClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (currentTour && currentTour in tutorialProgress.phases) {
      // Cast is safe because we checked existence in phases
      updateTutorialProgress(currentTour as TutorialPhase, { lastStep: index });
    }
    // Hide tooltip, keep tour state (resumes when target appears on next page)
    pauseTour('end-of-page');
  };

  const handlePrimaryClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (typeof primaryProps.onClick === 'function') {
      primaryProps.onClick(event);
    }
  };

  const ariaLabel =
    typeof title === 'string'
      ? title
      : typeof content === 'string'
        ? content
        : 'Tutorial step';

  const stepData = step.data as TourStepData | undefined;
  const isEndOfPage = stepData?.isEndOfPage;
  const nextStepHint = stepData?.nextStepHint;
  const hideNextButton = stepData?.hideNextButton;

  const primaryLabel =
    primaryProps.title || primaryProps['aria-label'] || CONTINUE_LABEL;
  const backLabel = backProps.title || backProps['aria-label'] || 'Back';
  const skipLabel = skipProps.title || skipProps['aria-label'] || 'Skip tutorial';

  // react-joyride's skipProps doesn't formally include className, but the
  // rendered <button> accepts one. Widening here lets us strip-and-merge.
  const { className: skipClassName, ...skipButtonProps } =
    skipProps as typeof skipProps & { className?: string };

  return (
    <div
      key="JoyrideTooltip"
      aria-label={ariaLabel}
      className="react-joyride__tooltip"
      style={styles.tooltip}
      {...tooltipProps}
    >
      <div style={styles.tooltipContainer} >
        {title && <h1 style={styles.tooltipTitle}>{title}</h1>}
        <div style={styles.tooltipContent}>
          {content}
          {isEndOfPage && (
            <div>
              {nextStepHint || 'Complete this step, then click Next to continue.'}
            </div>
          )}
        </div>
      </div>
      {!hideFooter && (
        <div style={styles.tooltipFooter}>
          <div style={styles.tooltipFooterSpacer}>
            {showSkipButton && (!isLastStep || hideNextButton) && (
              <Button
                aria-live="off"
                data-test-id="button-skip"
                type="button"
                variant="link"
                size="sm"
                className={skipClassName ? `${skipClassName}` : ''}
                {...skipButtonProps}
              >
                {skipLabel}
              </Button>
            )}
          </div>
          {!hideBackButton && index > 0 && (
            <Button
              data-test-id="button-back"
              style={styles.buttonBack}
              type="button"
              variant="ghost"
              size="sm"
              {...backProps}
            >
              {backLabel}
            </Button>
          )}

          <div>
            {isEndOfPage && !isLastStep && (
              <Button
                data-test-id="button-pause"
                style={styles.buttonNext}
                type="button"
                aria-label="Continue"
                title="Continue"
                variant="default"
                size="sm"
                onClick={handleContinueClick}
              >
                Continue
              </Button>
            )}
            {!isEndOfPage && !hideNextButton && (
              <Button
                data-test-id="button-primary"
                style={styles.buttonNext}
                type="button"
                variant="default"
                size="sm"
                {...primaryProps}
                onClick={handlePrimaryClick}
              >
                {primaryLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
