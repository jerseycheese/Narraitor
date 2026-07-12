import type { Placement } from '@popperjs/core';

export const joyrideStyles = {
  options: {
    primaryColor: 'var(--color-accent)',
    backgroundColor: 'var(--color-canvas)',
    textColor: 'var(--color-text-primary)',
    arrowColor: 'var(--color-overlay-surface-strong)',
    // eslint-disable-next-line design-tokens/no-hardcoded-colors
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    backgroundColor: 'var(--color-overlay-surface-strong)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    textAlign: 'left' as const,
    pointerEvents: 'auto' as const,
  },
  overlay: {
    pointerEvents: 'none' as const,
    // The dim comes from the spotlight's ring shadow below, so keep the overlay
    // itself clear and let that shadow extend past it (#1431).
    backgroundColor: 'transparent',
    mixBlendMode: 'normal' as const,
    overflow: 'visible' as const,
  },
  tooltipContent: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    textAlign: 'left' as const,
  },
  spotlight: {
    pointerEvents: 'none' as const,
    // Dim everything except the highlighted target with one large ring shadow.
    // react-joyride's default hard-light overlay composited to a no-op in this
    // app's stacking context, so the tour never showed a backdrop (#1431).
    backgroundColor: 'transparent',
    mixBlendMode: 'normal' as const,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
  },
  buttonNext: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  buttonBack: {
    color: 'var(--color-text-muted)',
  },
  buttonSkip: {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
    backgroundColor: 'transparent',
    padding: 0,
  },
  buttonClose: {
    display: 'none',
  },
};

const joyrideOptions = {
  continuous: true,
  scrollToFirstStep: false,
  showProgress: false,
  showSkipButton: true,
  disableScrolling: false,
  scrollOffset: 150,
  floaterProps: {
    modifiers: {
      flip: {
        options: {
          fallbackPlacements: ['bottom', 'top', 'left', 'right'] as Placement[],
        },
      },
    },
  },
};

/**
 * Tours that run inside modals need scrolling disabled to prevent
 * the page underneath from scrolling, which breaks spotlight positioning
 */
const MODAL_TOURS = [] as const;

/**
 * Tours that use the custom useTutorialAutoScroll hook
 * (Native Joyride scrolling must be disabled)
 */
const MANUAL_SCROLL_TOURS = [
  'firstPlay',
] as const;

/**
 * Get joyride options for a specific tour
 */
export function getTourOptions(tourId: string) {
  const isModalTour = MODAL_TOURS.includes(tourId as typeof MODAL_TOURS[number]);
  const isManualScrollTour = MANUAL_SCROLL_TOURS.includes(tourId as typeof MANUAL_SCROLL_TOURS[number]);

  return {
    ...joyrideOptions,
    disableScrolling: isModalTour || isManualScrollTour,
  };
}
