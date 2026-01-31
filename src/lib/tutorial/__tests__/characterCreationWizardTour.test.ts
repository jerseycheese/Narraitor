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
});
