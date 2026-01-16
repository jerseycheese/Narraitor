'use client';

import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const isEndOfPage = (step as any).data?.isEndOfPage;

  const primaryLabel =
    primaryProps.title || primaryProps['aria-label'] || CONTINUE_LABEL;
  const backLabel = backProps.title || backProps['aria-label'] || 'Back';
  const skipLabel = skipProps.title || skipProps['aria-label'] || 'Skip';

  const {
    top: _closeTop,
    right: _closeRight,
    width: _closeWidth,
    height: _closeHeight,
    padding: _closePadding,
    ...closeButtonStyle
  } = styles.buttonClose;

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
              <Button
                aria-live="off"
                data-test-id="button-skip"
                style={styles.buttonSkip}
                type="button"
                variant="ghost"
                size="sm"
                {...skipProps}
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
          
          <div className="flex gap-2">
            {isEndOfPage && !isLastStep ? (
              <Button
                data-test-id="button-pause"
                style={styles.buttonNext}
                type="button"
                aria-label="Got it!"
                title="Got it!"
                variant="default"
                size="sm"
                onClick={handleContinueClick}
              >
                Got it!
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
      {!hideCloseButton && (
        <Button
          data-test-id="button-close"
          style={closeButtonStyle}
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-6 w-6 p-0 z-10"
          {...closeProps}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
