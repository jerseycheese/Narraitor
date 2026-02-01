import { quickStartTour } from '@/lib/tutorial/quickStartTour';

describe('quickStartTour', () => {
  it('disables scrolling for the custom character step', () => {
    const step = quickStartTour.find(
      (tourStep) => tourStep.target === '[data-tutorial="quickstart-custom"]',
    );

    expect(step).toBeDefined();
    expect(step?.disableScrolling).toBe(true);
  });
});
