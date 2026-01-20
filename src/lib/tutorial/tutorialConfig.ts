export const joyrideStyles = {
  options: {
    primaryColor: 'hsl(var(--primary))',
    backgroundColor: 'hsl(var(--background))',
    textColor: 'hsl(var(--foreground))',
    // eslint-disable-next-line design-tokens/no-hardcoded-colors
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: 'var(--radius)',
    color: 'hsl(var(--card-foreground))',
    textAlign: 'left',
  },
  tooltipContent: {
    textAlign: 'left',
  },
  tooltipTitle: {
    textAlign: 'left',
  },
  buttonNext: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  },
  buttonBack: {
    color: 'hsl(var(--muted-foreground))',
  },
  buttonSkip: {
    color: 'hsl(var(--muted-foreground))',
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
  disableScrolling: true,
  scrollOffset: 150,
};
