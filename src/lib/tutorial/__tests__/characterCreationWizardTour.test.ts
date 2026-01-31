import { characterCreationWizardTour } from '@/lib/tutorial/characterCreationWizardTour';

describe('characterCreationWizardTour', () => {
  it('keeps the basic info tooltip constrained to vertical placements', () => {
    const step = characterCreationWizardTour.find(
      (tourStep) => tourStep.target === '[data-tutorial="basic-info"]',
    );

    expect(step).toBeDefined();
    expect(step?.placement).toBe('bottom');
    expect(step?.floaterProps).toBeUndefined();
  });

  it('keeps the attributes tooltip constrained to vertical placements', () => {
    const step = characterCreationWizardTour.find(
      (tourStep) => tourStep.target === '[data-tutorial="attribute-allocation"]',
    );

    expect(step).toBeDefined();
    expect(step?.placement).toBe('bottom');
  });

  it('keeps the skills tooltip constrained to vertical placements', () => {
    const step = characterCreationWizardTour.find(
      (tourStep) => tourStep.target === '[data-tutorial="skill-selection"]',
    );

    expect(step).toBeDefined();
    expect(step?.placement).toBe('bottom');
  });

  it('disables joyride scrolling for wizard steps', () => {
    const stepsWithoutDisableScrolling = characterCreationWizardTour.filter(
      (step) => step.disableScrolling !== true,
    );

    expect(stepsWithoutDisableScrolling).toHaveLength(0);
  });
});
