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
  scrollToFirstStep: true,
  showProgress: false,
  showSkipButton: true,
  disableScrolling: false,
  scrollOffset: 150,
};
