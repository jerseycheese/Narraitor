import { getTourOptions } from '@/lib/tutorial/tutorialConfig';

describe('tutorialConfig', () => {
  it('uses vertical fallback placements by default', () => {
    const options = getTourOptions('characterCreationWizard');

    expect(options.floaterProps?.modifiers?.flip?.options?.fallbackPlacements).toEqual(['bottom', 'top', 'left', 'right']);
  });
});
