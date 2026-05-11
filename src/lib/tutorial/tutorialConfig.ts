export const joyrideStyles = {
  options: {
    primaryColor: 'hsl(var(--primary))',
    backgroundColor: 'hsl(var(--background))',
    textColor: 'hsl(var(--foreground))',
    arrowColor: 'hsl(var(--card))',
    // eslint-disable-next-line design-tokens/no-hardcoded-colors
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: 'var(--radius)',
    color: 'hsl(var(--card-foreground))',
    textAlign: 'left' as const,
    pointerEvents: 'auto' as const,
  },
  overlay: {
    pointerEvents: 'none' as const,
  },
  tooltipContent: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    textAlign: 'left' as const,
  },
  spotlight: {
    pointerEvents: 'none' as const,
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
  },
  buttonSkip: {
    color: 'hsl(var(--primary))',
    textDecoration: 'underline',
    backgroundColor: 'transparent',
    padding: 0,
  },
  buttonClose: {
    display: 'none',
  },
};

export const joyrideOptions = {
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
          fallbackPlacements: ['bottom', 'top', 'left', 'right'],
        },
      },
    },
  },
};

/**
 * Tours that run inside modals need scrolling disabled to prevent
 * the page underneath from scrolling, which breaks spotlight positioning
 */
export const MODAL_TOURS = [] as const;

/**
 * Tours that use the custom useTutorialAutoScroll hook
 * (Native Joyride scrolling must be disabled)
 */
export const MANUAL_SCROLL_TOURS = [
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
