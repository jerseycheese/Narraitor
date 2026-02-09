'use client';

import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { useTutorial } from './useTutorial';
import { useSessionStore } from '@/state/sessionStore';

const CONTINUE_LABEL = 'Continue';

/** Custom data attached to tour steps via Joyride's Step.data property */
interface TourStepData {
  isEndOfPage?: boolean;
}

export function WorldCreationStartTooltip({
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
  const { pauseTour } = useTutorial();
  const updateTutorialProgress = useSessionStore(state => state.updateTutorialProgress);

  // Don't advance Joyride - the wizard-to-tour sync in TutorialProvider
  // will update the step index when the user advances through the wizard UI.
  // With spotlightClicks={true}, users can click wizard elements while
  // the tooltip is visible.
  const handleContinueClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    updateTutorialProgress('worldCreation', { lastStep: index });
    // Hide tooltip, keep tour state
    pauseTour('end-of-page');
  };

  const ariaLabel =
    typeof title === 'string'
      ? title
      : typeof content === 'string'
        ? content
        : 'Tutorial step';

  const stepData = step.data as TourStepData | undefined;
  const isEndOfPage = stepData?.isEndOfPage;

  const primaryLabel =
    primaryProps.title || primaryProps['aria-label'] || CONTINUE_LABEL;
  const backLabel = backProps.title || backProps['aria-label'] || 'Back';
  const skipLabel = skipProps.title || skipProps['aria-label'] || 'Skip world creation tutorial';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { className: skipClassName, ...skipButtonProps } = skipProps as any;

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
        <div style={styles.tooltipContent}>{content}</div>
      </div>
      {!hideFooter && (
        <div style={styles.tooltipFooter}>
          <div style={styles.tooltipFooterSpacer}>
            {showSkipButton && !isLastStep && (
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
            {isEndOfPage && !isLastStep ? (
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
            ) : (
              <Button
                data-test-id="button-primary"
                style={styles.buttonNext}
                type="button"
                variant="default"
                size="sm"
                {...primaryProps}
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
