import { worldGenerationTour } from '../worldGenerationTour';

describe('worldGenerationTour selectors', () => {
  it('uses valid query selectors for string targets', () => {
    expect(() => {
      worldGenerationTour.forEach((step) => {
        if (typeof step.target === 'string') {
          document.querySelector(step.target);
        }
      });
    }).not.toThrow();
  });

  it('does not hide the primary action on the final step', () => {
    const lastStep = worldGenerationTour[worldGenerationTour.length - 1];
    const data = lastStep?.data as { hideNextButton?: boolean } | undefined;

    expect(data?.hideNextButton).not.toBe(true);
  });
});
