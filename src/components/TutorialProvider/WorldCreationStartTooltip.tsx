'use client';

import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { X } from 'lucide-react';
import { useTutorial } from './useTutorial';

const CONTINUE_LABEL = 'Continue';

export function WorldCreationStartTooltip({
  backProps,
  closeProps,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const { content, hideBackButton, hideCloseButton, hideFooter, showSkipButton, styles, title } =
    step;
  const { pauseTour } = useTutorial();

  // Don't advance Joyride - the wizard-to-tour sync in TutorialProvider
  // will update the step index when the user advances through the wizard UI.
  // With spotlightClicks={true}, users can click wizard elements while
  // the tooltip is visible.
  const handleContinueClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Hide tooltip, keep tour state
    pauseTour();
  };

  const ariaLabel =
    typeof title === 'string'
      ? title
      : typeof content === 'string'
        ? content
        : 'Tutorial step';

  return (
    <div
      key="JoyrideTooltip"
      aria-label={ariaLabel}
      className="react-joyride__tooltip"
      style={styles.tooltip}
      {...tooltipProps}
    >
      <div style={styles.tooltipContainer}>
        {title && <h1 style={styles.tooltipTitle}>{title}</h1>}
        <div style={styles.tooltipContent}>{content}</div>
      </div>
      {!hideFooter && (
        <div style={styles.tooltipFooter}>
          <div style={styles.tooltipFooterSpacer}>
            {showSkipButton && !isLastStep && (
              <button
                aria-live="off"
                data-test-id="button-skip"
                style={styles.buttonSkip}
                type="button"
                {...skipProps}
              />
            )}
          </div>
          {!hideBackButton && index > 0 && (
            <button
              data-test-id="button-back"
              style={styles.buttonBack}
              type="button"
              {...backProps}
            />
          )}
          <button
            data-test-id="button-primary"
            style={styles.buttonNext}
            type="button"
            {...primaryProps}
            aria-label={CONTINUE_LABEL}
            title={CONTINUE_LABEL}
            onClick={handleContinueClick}
          >
            {CONTINUE_LABEL}
          </button>
        </div>
      )}
      {!hideCloseButton && (
        <button
          data-test-id="button-close"
          style={styles.buttonClose}
          type="button"
          {...closeProps}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
